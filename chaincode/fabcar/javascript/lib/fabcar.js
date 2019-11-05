/* eslint-disable quotes */
/* eslint-disable no-var */
/*
 * SPDX-License-Identifier: Apache-2.0
 */

"use strict";

const shim = require("fabric-shim");
const { Contract } = require("fabric-contract-api");
const paillier = require("paillier-js");
let r = require("jsrsasign");
var bigInt = require("big-integer");
const path = require("path");
const fs = require("fs");

// connect to the pres election file
const ballotDataPath = path.join(process.cwd(), "./lib/data/configData2.json");
const ballotDataJson = fs.readFileSync(ballotDataPath, "utf8");
const ballotData = JSON.parse(ballotDataJson);

class FabCar extends Contract {
    async initLedger(ctx) {
        console.info("\n\nTesting additive homomorphism\n");
        console.info("============= START : Initialize Ledger ===========");

        //Save to the local database
        await ctx.stub.putState(
            "voteData",
            Buffer.from(JSON.stringify(ballotData))
        );
    }

    async dataExists(ctx, voteId) {
        const buffer = await ctx.stub.getState(voteId);
        return !!buffer && buffer.length > 0;
    }

    async queryAllCandidates(ctx) {
        const voteData = await ctx.stub.getState("voteData");
        return voteData.toString();
    }

    async getVotingKey(ctx) {
        const exists = await this.dataExists(ctx, "HEPublicKey");
        if (!exists) {
            throw new Error(`The Voting Key does not exist`);
        }

        const carAsBytes = await ctx.stub.getState("HEPublicKey"); // get the car from chaincode state
        console.log(carAsBytes.toString());
        return JSON.parse(carAsBytes.toString());
    }

    async sendVotingKey(ctx, publicKey) {
        const key = JSON.parse(publicKey);
        await ctx.stub.putState(
            "HEPublicKey",
            Buffer.from(JSON.stringify(key))
        );
        return true;
    }

    async getSigningKey(ctx) {
        const exists = await this.dataExists(ctx, "SigningPublicKey");
        if (!exists) {
            throw new Error("The SigningPublicKey does not exist");
        }

        const bits = await ctx.stub.getState("SigningPublicKey");
        const res = JSON.parse(bits.toString());
        return res;
    }

    async sendSigningKey(ctx, publicKeyJSON) {
        await ctx.stub.putState("SigningPublicKey", Buffer.from(publicKeyJSON));
        return true;
    }

    async createVote(ctx, voteJSON) {
        try {
            var pubKey = new r.KEYUTIL.getKey(await this.getSigningKey(ctx));
            const vote = JSON.parse(voteJSON);

            if (pubKey.verify(JSON.stringify(vote.candidate), vote.Sign)) {
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
        try {
            const allVotes = JSON.parse(await this.queryAllVote(ctx));
            const voteData = JSON.parse(await this.queryAllCandidates(ctx));
            const publicKeyTemp = JSON.parse(await this.getVotingKey(ctx));
            var PublicKey = new paillier.PublicKey(
                bigInt(publicKeyTemp.n),
                bigInt(publicKeyTemp.g)
            );
            let res = [];
            //Pocet kandidatov
            for (let y = 0; y < voteData.candidate.length; y++) {
                let temp = 0;
                //Idem cez vsetky hlasy
                for (let x = 0; x < allVotes.length; x++) {
                    if (x !== 0) {
                        temp = PublicKey.addition(
                            temp,
                            allVotes[x].Record.candidate[y].vote.toString()
                        );
                    } else {
                        temp = allVotes[x].Record.candidate[y].vote;
                    }
                }
                if (voteData.voteType === 1) {
                    const result = {
                        name: voteData.candidate[y].Name,
                        res: temp
                    };

                    res.push(result);
                } else if (voteData.voteType === 2) {
                    const result = {
                        name: voteData.candidate[y].Party,
                        res: temp
                    };

                    res.push(result);
                }
            }
            if (voteData.voteType === 1) {
                return res;
            } else if (voteData.voteType === 2) {
                const PreferentialVotes = [];
                for (let y = 0; y < voteData.candidate.length; y++) {
                    let result = [];
                    for (
                        let z = 0;
                        z < voteData.candidate[0].Candidates.length;
                        z++
                    ) {
                        let temp = 0;
                        //Idem cez vsetky hlasy
                        for (let x = 0; x < allVotes.length; x++) {
                            if (x !== 0) {
                                temp = PublicKey.addition(
                                    temp,
                                    allVotes[x].Record.candidate[y].Candidates[
                                        z
                                    ].vote.toString()
                                );
                            } else {
                                temp =
                                    allVotes[x].Record.candidate[y].Candidates[
                                        z
                                    ].vote;
                            }
                        }
                        result.push(temp.toString());
                    }
                    const resultObj = {
                        name: voteData.candidate[y].Party,
                        res: result
                    };
                    PreferentialVotes.push(resultObj);
                }
                const finalRes = {
                    Parties: res,
                    PreferentialVotes: PreferentialVotes
                };
                return finalRes;
            }
        } catch (error) {
            console.info(error);
            return error;
        }
    }
}

module.exports = FabCar;
