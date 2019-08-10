/* eslint-disable no-unused-vars */
const { encryptWithProof, verifyProof } = require('paillier-in-set-zkp')
const paillier = require('paillier-js')
var bigInt = require("big-integer");
const bits = 32;
/*
const {publicKey, privateKey} = paillier.generateRandomKeys(bits);

function test(publicKeyJSON){
    const temp = JSON.parse(publicKeyJSON);
    //console.log(temp);
    const valid = [1,10,100];
    const publicKey2 = new paillier.PublicKey(bigInt(temp.n), Number(temp.g));
    console.time('encrypt');
    const [cipher, proof] = encryptWithProof(publicKey2, valid[0], valid, bits);
    console.timeEnd('encrypt');
    console.log(cipher.toString());
    console.log(publicKey2.addition(cipher.toString(),cipher.toString()));
}
//console.log(publicKey);
const publicKey2 = test(JSON.stringify(publicKey));
*/
console.time('generate');
const {publicKey, privateKey} = paillier.generateRandomKeys(bits)
console.timeEnd('generate');
const validScores = [0,15,30,60,70,80,90,100,110,120]
const secretScore = 30
console.time('encrypt');
const [cipher, proof, random] = encryptWithProof(publicKey, secretScore, validScores, bits)
console.log(random.toString());
console.timeEnd('encrypt');
// Transmit cipher, proof and publicKey
console.time('verify');
const result = verifyProof(publicKey, cipher, proof, validScores, bits) // true
console.timeEnd('verify');