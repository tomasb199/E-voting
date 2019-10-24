/* eslint-disable quotes */
/* eslint-disable no-var */
/*
 * SPDX-License-Identifier: Apache-2.0
 */

"use strict";

const shim = require("fabric-shim");
const { Contract } = require("fabric-contract-api");
const paillier = require("paillier-js");
var bigInt = require("big-integer");

class FabCar extends Contract {
    async initLedger(ctx) {
        console.info("\n\nTesting additive homomorphism\n");

        console.info("============= START : Initialize Ledger ===========");
        const candidates = [
            {
                ID: "1",
                Name: "Robert Fico",
                Description: "SMER-SD",
                Foto:
                    "https://upload.wikimedia.org/wikipedia/commons/7/7c/Fico_Juncker_%28cropped%29.jpg",
                Age: "45"
            },
            {
                ID: "2",
                Name: "Marian Kotleba",
                Description: "LSNS",
                Foto:
                    "https://cdn.webnoviny.sk/sites/32/2017/10/marian-kotleba-676x451.jpg",
                Age: "88"
            },
            {
                ID: "3",
                Name: "Bela Bugar",
                Description: "MOST-HID",
                Foto:
                    "https://www.most-hid.sk/sites/most-hid.sk/files/story/bugar-bela.jpg",
                Age: "42"
            },
            {
                ID: "4",
                Name: "Tomas Bujna",
                Description: "FIIT",
                Foto: "https://i.imgur.com/UQihxU0.jpg",
                Age: "24"
            }
        ];

        for (let i = 0; i < candidates.length; i++) {
            candidates[i].docType = "candidates";
            await ctx.stub.putState(
                "CANDIDATE" + i,
                Buffer.from(JSON.stringify(candidates[i]))
            );
            console.info("Added <--> ", candidates[i]);
        }

        //await ctx.stub.putState("bits", Buffer.from(bit.toString()));

    }

    async dataExists(ctx, voteId) {
        const buffer = await ctx.stub.getState(voteId);
        return !!buffer && buffer.length > 0;
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

    async getVotingKey(ctx) {

        const exists = await this.dataExists(ctx, "HEPublicKey");
        if (!exists) {
            throw new Error(`The Voting Key does not exist`);
        }

        const carAsBytes = await ctx.stub.getState("HEPublicKey"); // get the car from chaincode state
        console.log(carAsBytes.toString());
        return carAsBytes.toString();
    }

    async sendVotingKey(ctx, publicKey) {

        const key = JSON.parse(publicKey);
        await ctx.stub.putState(
            "HEPublicKey",
            Buffer.from(JSON.stringify(key))
        );
        return true;
    }

    async createVote(ctx, voteJSON) {
        try {
            const vote = JSON.parse(voteJSON);
            const buffer = Buffer.from(JSON.stringify(vote));
            await ctx.stub.putState("VOTE" + vote.id, buffer);
            return true;
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
        const allVotes = JSON.parse(await this.queryAllVote(ctx));
        const publicKeyTemp = JSON.parse(await this.getVotingKey(ctx));
        const PublicKey = new paillier.PublicKey(
            bigInt(publicKeyTemp.n),
            bigInt(publicKeyTemp.g)
        );
        let res = [];
        //Pocet kandidatov
        for (let y = 0; y < allVotes[0].Record.Vote.length; y++) {
            let temp = 0;
            //Idem cez vsetky hlasy
            for (let x = 0; x < allVotes.length; x++) {
                if (x !== 0) {
                    temp = PublicKey.addition(
                        temp,
                        allVotes[x].Record.Vote[y].vote.toString()
                    );
                } else {
                    temp = allVotes[x].Record.Vote[y].vote;
                }
            }
            res.push(temp);
        }

        return res;
    }
}

module.exports = FabCar;
