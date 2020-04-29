/* eslint-disable quotes */
/* eslint-disable no-var */
/*
 * SPDX-License-Identifier: Apache-2.0
 */

"use strict";

const shim = require("fabric-shim");
const { Contract } = require("fabric-contract-api");
const ClientIdentity = require("fabric-shim").ClientIdentity;
const { verifyProof } = require("paillier-in-set-zkp");
const paillier = require("paillier-js");
var bigInt = require("big-integer");
const path = require("path");
const fs = require("fs");

let PublicKey = undefined;
let validCandidates;
var bit = undefined;
let sizeElectionDistrict = 1000;

// connect to the pres election file
const ballotDataPath = path.join(process.cwd(), "./data/configData.json");
const ballotDataJson = fs.readFileSync(ballotDataPath, "utf8");
const ballotData = JSON.parse(ballotDataJson);

class FabCar extends Contract {
    async initLedger(ctx) {
        console.info("============= START : Initialize Ledger ===========");
        const candidates = ballotData;

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

    async sendVotingKey(ctx, publicKey) {
        // access has only verification server
        let cid = new ClientIdentity(ctx.stub);
        if (cid.assertAttributeValue("hf.EnrollmentID", "verificationServer")) {
            const key = JSON.parse(publicKey);
            await ctx.stub.putState(
                "HEPublicKey",
                Buffer.from(JSON.stringify(key))
            );
            PublicKey = new paillier.PublicKey(bigInt(key.n), bigInt(key.g));
            return true;
        } else {
            //Access denied
            return false;
        }
    }

    async sendVotingKeyBits(ctx, bits) {
        // access has only verification server
        let cid = new ClientIdentity(ctx.stub);
        if (cid.assertAttributeValue("hf.EnrollmentID", "verificationServer")) {
            bit = JSON.parse(bits);
            await ctx.stub.putState("bits", Buffer.from(JSON.stringify(bit)));
            return true;
        } else {
            //Access denied
            return false;
        }
    }

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
        // access has only voting server
        let cid = new ClientIdentity(ctx.stub);
        if (cid.assertAttributeValue("hf.EnrollmentID", "votingServer")) {
            try {
                const vote = JSON.parse(voteJSON);
                const as = vote.Proof[0].map((proof) => {
                    return bigInt(proof);
                });
                const es = vote.Proof[1].map((proof) => {
                    return bigInt(proof);
                });
                const zs = vote.Proof[2].map((proof) => {
                    return bigInt(proof);
                });
                console.time("verify");
                if (
                    verifyProof(
                        PublicKey,
                        bigInt(vote.Vote),
                        [as, es, zs],
                        validCandidates
                    )
                ) {
                    console.timeEnd("verify");
                    const buffer = Buffer.from(JSON.stringify(vote));
                    await ctx.stub.putState("VOTE" + vote.id, buffer);
                    return true;
                } else {
                    return false;
                }
            } catch (err) {
                return shim.error(err);
            }
        } else {
            //Access denied
            return false;
        }
    }

    async readVote(ctx, voteId) {
        // access has only voting server
        let cid = new ClientIdentity(ctx.stub);
        if (cid.assertAttributeValue("hf.EnrollmentID", "votingServer")) {
            const voteID_final = "VOTE" + voteId.toString();
            const exists = await this.dataExists(ctx, voteID_final);
            if (!exists) {
                throw new Error(`The vote ${voteId} does not exist`);
            }
            const buffer = await ctx.stub.getState(voteID_final);
            const asset = JSON.parse(buffer.toString());
            return asset;
        } else {
            //Access denied
            return false;
        }
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

    //For testing
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
        // access has only verification server
        let cid = new ClientIdentity(ctx.stub);
        if (cid.assertAttributeValue("hf.EnrollmentID", "verificationServer")) {
            let vote = 0;
            const allVotes = JSON.parse(await this.queryAllVote(ctx));

            console.time("sum");
            // Cipfer sum of all votes
            allVotes.forEach((element, i) => {
                if (i !== 0) {
                    let temp = element.Record.Vote;
                    console.info(temp);
                    vote = PublicKey.addition(vote, temp.toString());
                } else {
                    vote = element.Record.Vote;
                }
            });
            console.timeEnd("sum");
            const res = {
                res: vote,
            };

            return JSON.stringify(res);
        } else {
            //Access denied
            return false;
        }
    }
}

module.exports = FabCar;
