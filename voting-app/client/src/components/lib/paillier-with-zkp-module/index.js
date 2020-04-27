// Root source https://github.com/framp/paillier-in-set-zkp

/*eslint-disable eqeqeq*/

const bigInt = require("big-integer");
const crypto = require("crypto");

const encryptWithProof = function (
  publicKey,
  message,
  validMessages,
  bits = 512
) {
  const as = [];
  const es = [];
  const zs = [];

  const _n2 = publicKey.n.pow(2);
  let r;
  do {
    r = bigInt.randBetween(2, publicKey.n);
  } while (r.leq(1));
  const random = r;
  const cipher = publicKey.g
    .modPow(bigInt(message), publicKey._n2)
    .multiply(r.modPow(publicKey.n, _n2))
    .mod(publicKey._n2);

  const om = getCoprime(publicKey.n, bits);
  const ap = om.modPow(publicKey.n, publicKey._n2);

  let mi = null;
  validMessages.forEach((mk, i) => {
    const gmk = publicKey.g.modPow(bigInt(mk), publicKey._n2);
    const uk = cipher.times(gmk.modInv(publicKey._n2)).mod(publicKey._n2);
    if (message === mk) {
      as.push(ap);
      zs.push(null);
      es.push(null);
      mi = i;
    } else {
      const zk = om;
      zs.push(zk);
      const ek = bigInt.randBetween(2, bigInt(2).pow(bits).subtract(1));
      es.push(ek);
      const zn = zk.modPow(publicKey.n, publicKey._n2);
      const ue = uk.modPow(ek, publicKey._n2);
      const ak = zn.times(ue.modInv(publicKey._n2)).mod(publicKey._n2);
      as.push(ak);
    }
  });

  const hash = crypto.createHash("sha256").update(as.join("")).digest("hex");

  const esum = es
    .filter(Boolean)
    .reduce((acc, ek) => acc.plus(ek).mod(bigInt(2).pow(256)), bigInt(0));
  const ep = bigInt(hash, 16).subtract(esum).mod(bigInt(2).pow(256));
  const rep = random.modPow(ep, publicKey.n);
  const zp = om.times(rep).mod(publicKey.n);
  es[mi] = ep;
  zs[mi] = zp;

  const proof = [as, es, zs];

  return [cipher, proof, random];
};

// getCoprime :: Bits -> Number -> Number
// Generate a coprime number of target (their GCD should be 1)
function getCoprime(target, bit) {
  console.log(target);
  const bits = bigInt(bit - 1); //Math.floor(Math.log2(target))
  while (true) {
    const lowerBound = bigInt(2)
      .pow(bits - 1)
      .plus(1);
    let possible = lowerBound.plus(bigInt.rand(bits)).or(1);
    const result = bigInt(possible);
    if (possible.gt(bigInt(2).pow(1024))) return result;
    while (target > 0) {
      [possible, target] = [target, possible.mod(target)];
    }
    if (possible.eq(bigInt(1))) return result;
  }
}

module.exports = {
  encryptWithProof: encryptWithProof,
};
