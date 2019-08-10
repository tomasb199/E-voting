/* eslint-disable eqeqeq */
/* eslint-disable no-trailing-spaces */
/* eslint-disable indent */
/* eslint-disable no-tabs */
/* eslint-disable no-unused-vars */
/* eslint-disable no-var */
/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');
const paillier = require('paillier-js');

let PublicKey, PrivateKey;
const validCandidates = [1, 1000, 1000000, 1000000000];
var bit = 512;
var proof;
class FabCar extends Contract {

    async initLedger(ctx) {
        
	var { publicKey, privateKey } = paillier.generateRandomKeys(bit); // Change to at least 2048 bits in production state
        //await ctx.stub.putState('PublicKey', Buffer.from(JSON.stringify(publicKey)));
        PublicKey = publicKey;
        PrivateKey = privateKey;

        console.info('\n\nTesting additive homomorphism\n');

        console.info('============= START : Initialize Ledger ===========');
        const candidates = [
            { ID: '1', Name: 'Robert Fico', VoteKey: 'CANDIDATE0', Description: 'SMER', Age: '45', Vote: '1' },
            { ID: '2', Name: 'Marian Kotleba', VoteKey: 'CANDIDATE1', Description: 'LSNS', Age: '88', Vote: '1000' },
			{ ID: '3', Name: 'Bela Bugar', VoteKey: 'CANDIDATE2', Description: 'MOST', Age: '42', Vote: '1000000' },
			{ ID: '4', Name: 'Tomas Bujna', VoteKey: 'CANDIDATE3', Description: 'FIIT', Age: '24', Vote: '1000000000' }
        ];

        for (let i = 0; i < candidates.length; i++) {
            candidates[i].docType = 'candidates';
            await ctx.stub.putState('CANDIDATE' + i, Buffer.from(JSON.stringify(candidates[i])));
            console.info('Added <--> ', candidates[i]);
        }
		await ctx.stub.putState('bits', Buffer.from(bit.toString()));
        await ctx.stub.putState('validCandidates', Buffer.from(JSON.stringify(validCandidates)));
    }

    async dataExists(ctx, voteId) {
        const buffer = await ctx.stub.getState(voteId);
        return (!!buffer && buffer.length > 0);
    }

    async getKey(ctx){

        return JSON.stringify(PublicKey);
    }

    async getCan(ctx){

        return validCandidates;
    }
	
	async getBits(ctx){

        const exists = await this.dataExists(ctx, 'bits');
        if (!exists) {
            throw new Error('The bits does not exist');
        }

        const bits = await ctx.stub.getState('bits');
        const res = bits.toString();
        return res;
    }

	async createVote(ctx, vote) {
        const voteToJSON = JSON.parse(vote);
        /*const exists = await this.voteExists(ctx, voteId);
        if (exists) {
            throw new Error(`The vote ${voteId} already exists`);
        }
        const asset = { value };*/
        const buffer = Buffer.from(JSON.stringify(voteToJSON));      
        await ctx.stub.putState('VOTE' + voteToJSON.id, buffer);
        return true;
    }

    async readVote(ctx, voteId) {
        const voteID_final = 'VOTE'+ voteId.toString();
        const exists = await this.dataExists(ctx, voteID_final);
        if (!exists) {
            throw new Error(`The vote ${voteId} does not exist`);
        }
        const buffer = await ctx.stub.getState(voteID_final);
        const asset = JSON.parse(buffer.toString());
        return asset;
    }
	
	async queryAllCandidates(ctx) {
        const startKey = 'CANDIDATE0';
        const endKey = 'CANDIDATE999';

        const iterator = await ctx.stub.getStateByRange(startKey, endKey);

        const allResults = [];
        while (true) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                console.log(res.value.value.toString('utf8'));

                const Key = res.value.key;
                let Record;
                try {
                    Record = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                    console.log(err);
                    Record = res.value.value.toString('utf8');
                }
                allResults.push({ Key, Record });
            }
            if (res.done) {
                console.log('end of data');
                await iterator.close();
                console.info(allResults);
                return JSON.stringify(allResults);
            }
        }
    }
	
    async queryAllVote(ctx) {

        const startKey = 'VOTE0';
        const endKey = 'VOTE999';
        const iterator = await ctx.stub.getStateByRange(startKey, endKey);

        const allResults = [];
        while (true) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                console.log(res.value.value.toString('utf8'));

                const Key = res.value.key;
                let Record;
                try {
                    Record = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                    console.log(err);
                    Record = res.value.value.toString('utf8');
                }
                allResults.push({ Key, Record });
            }
            if (res.done) {
                console.log('end of data');
                await iterator.close();
                console.info(allResults);
                return JSON.stringify(allResults);
            }
        }
        
    }
	
	async countVote(ctx) {

        var i = 1;
        var vote = 0;
        var temp;

        while(true){
            const voteAsBytes = await ctx.stub.getState('VOTE' + i.toString()); // get the car from chaincode state
            if (!voteAsBytes || voteAsBytes.length === 0) {
                break;
            }
            const votes = JSON.parse(voteAsBytes.toString());
            //if(verifyProof(PublicKey, candidates.Cipher, candidates.Proof, validCandidates, bit)){
            if(i != 1){
                
                    temp = votes.Vote;
                    console.info(temp);
                    vote = PublicKey.addition(vote, temp.toString());
                    
                //vote += votes.Cipher;
            }
            else{
                vote = votes.Vote;
            }
            //}
            i++;
        }
        return  PrivateKey.decrypt(vote);

    }

}

module.exports = FabCar;
