/* eslint-disable quotes */
/* eslint-disable no-var */
/*
 * SPDX-License-Identifier: Apache-2.0
 */

"use strict";

const shim = require("fabric-shim");
const { Contract } = require("fabric-contract-api");
const { verifyProof } = require("paillier-in-set-zkp");
const paillier = require("paillier-js");
var bigInt = require("big-integer");

let PublicKey, PrivateKey;
let validCandidates;
var bit = 1024;
let sizeElectionDistrict = 1000;
class FabCar extends Contract {
    async initLedger(ctx) {
        var { publicKey, privateKey } = await paillier.generateRandomKeys(bit); // Change to at least 2048 bits in production state
        //await ctx.stub.putState('PublicKey', Buffer.from(JSON.stringify(publicKey)));
        PublicKey = publicKey;
        PrivateKey = privateKey;

        console.info("\n\nTesting additive homomorphism\n");

        console.info("============= START : Initialize Ledger ===========");
        const candidates = [
            {
                ID: "1",
                Name: "Robert Fico",
                Description: "SMER-SD",
                Age: "45"
            },
            {
                ID: "2",
                Name: "Marian Kotleba",
                Description: "LSNS",
                Age: "88"
            },
            {
                ID: "3",
                Name: "Bela Bugar",
                Description: "MOST-HID",
                Age: "42"
            },
            {
                ID: "4",
                Name: "Tomas Bujna",
                Description: "FIIT",
                Age: "24"
            }
        ];

        // Generate voting keys
        validCandidates = candidates.map((c, i) => {
            let vote = sizeElectionDistrict ** i;
            c.Vote = vote;
            return vote;
        });

        for (let i = 0; i < candidates.length; i++) {
            candidates[i].docType = "candidates";
            await ctx.stub.putState(
                "CANDIDATE" + i,
                Buffer.from(JSON.stringify(candidates[i]))
            );
            console.info("Added <--> ", candidates[i]);
        }

        await ctx.stub.putState("bits", Buffer.from(bit.toString()));
        await ctx.stub.putState(
            "validCandidates",
            Buffer.from(JSON.stringify(validCandidates))
        );
    }

    async dataExists(ctx, voteId) {
        const buffer = await ctx.stub.getState(voteId);
        return !!buffer && buffer.length > 0;
    }

    async getKey(ctx) {
        return JSON.stringify(PublicKey);
    }

    /*    async getCan(ctx) {
        const exists = await this.dataExists(ctx, "validCandidates");
        if (!exists) {
            throw new Error("The bits does not exist");
        }

        const buffer = await ctx.stub.getState("validCandidates");
        const asset = JSON.parse(buffer.toString());

        return asset;
    }
*/
    async getBits(ctx) {
        const exists = await this.dataExists(ctx, "bits");
        if (!exists) {
            throw new Error("The bits does not exist");
        }

        const bits = await ctx.stub.getState("bits");
        const res = bits.toString();
        return res;
    }

    async createVote(ctx, voteJSON) {
        try {
            const vote = JSON.parse(voteJSON);
            const as = vote.Proof[0].map(proof => {
                return bigInt(proof);
            });
            const es = vote.Proof[1].map(proof => {
                return bigInt(proof);
            });
            const zs = vote.Proof[2].map(proof => {
                return bigInt(proof);
            });

            if (
                verifyProof(
                    PublicKey,
                    bigInt(vote.Vote),
                    [as, es, zs],
                    validCandidates
                )
            ) {
                const buffer = Buffer.from(JSON.stringify(vote));
                await ctx.stub.putState("VOTE" + vote.id, buffer);
                return true;
            } else {
                return false;
            }
        } catch (err) {
            return shim.error(err);
        }
    }

    async readVote(ctx, voteId) {
        const voteID_final = "VOTE" + voteId.toString();
        const exists = await this.dataExists(ctx, voteID_final);
        if (!exists) {
            throw new Error(`The vote ${voteId} does not exist`);
        }
        const buffer = await ctx.stub.getState(voteID_final);
        const asset = JSON.parse(buffer.toString());
        return asset;
    }

    async queryAllCandidates(ctx) {
        const startKey = "CANDIDATE0";
        const endKey = "CANDIDATE999";

        const iterator = await ctx.stub.getStateByRange(startKey, endKey);

        const allResults = [];
        while (true) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                console.log(res.value.value.toString("utf8"));

                const Key = res.value.key;
                let Record;
                try {
                    Record = JSON.parse(res.value.value.toString("utf8"));
                } catch (err) {
                    console.log(err);
                    Record = res.value.value.toString("utf8");
                }
                allResults.push({ Key, Record });
            }
            if (res.done) {
                console.log("end of data");
                await iterator.close();
                console.info(allResults);
                return JSON.stringify(allResults);
            }
        }
    }

    async queryAllVote(ctx) {
        const startKey = "VOTE0";
        const endKey = "VOTE9999";
        const iterator = await ctx.stub.getStateByRange(startKey, endKey);

        const allResults = [];
        while (true) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                console.log(res.value.value.toString("utf8"));

                const Key = res.value.key;
                let Record;
                try {
                    Record = JSON.parse(res.value.value.toString("utf8"));
                } catch (err) {
                    console.log(err);
                    Record = res.value.value.toString("utf8");
                }
                allResults.push({ Key, Record });
            }
            if (res.done) {
                console.log("end of data");
                await iterator.close();
                console.info(allResults);
                return JSON.stringify(allResults);
            }
        }
    }

    async countVote(ctx) {
        let vote = 0;
        var temp;

        const allVotes = JSON.parse(await this.queryAllVote(ctx));

        // Cipfer sum of all votes
        allVotes.forEach((element, i) => {
            if (i !== 0) {
                temp = element.Record.Vote;
                console.info(temp);
                vote = PublicKey.addition(vote, temp.toString());
            } else {
                vote = element.Record.Vote;
            }
        });

        // Decrypt sum of all votes
        const sum = PrivateKey.decrypt(vote);

        // Parse sum of all votes to for each candidate
        const allCandidates = JSON.parse(await this.queryAllCandidates(ctx));
        let res = allCandidates.map(function(obj, i, array) {
            if (i + 1 < array.length) {
                return sum
                    .mod(array[i + 1].Record.Vote) //TODO: potreba zmenit na nasledujucu hodnotu
                    .divide(obj.Record.Vote)
                    .toString();
            } else {
                return sum.divide(obj.Record.Vote).toString();
            }
        });
        return res;
    }
}

module.exports = FabCar;
