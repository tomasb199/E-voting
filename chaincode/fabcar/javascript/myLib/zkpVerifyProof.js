let bignum = require("bignum");
const crypto = require("crypto");

const verifyProof = (publicKey, cipher, [as, es, zs], validMessages) => {
    const hash = crypto.createHash("sha256").update(as.join("")).digest("hex");

    const publicKeyBignum = {
        g: bignum(publicKey.g.toString()),
        n: bignum(publicKey.n.toString()),
        _n2: bignum(publicKey._n2.toString()),
    };

    const cipherBignum = bignum(cipher.toString());

    const asBignum = as.map((i) => bignum(i.toString()));
    const esBignum = es.map((i) => bignum(i.toString()));

    const us = validMessages.map((mk) => {
        const gmk = publicKeyBignum.g.powm(
            bignum(mk.toString()),
            publicKeyBignum._n2
        );
        const uk = cipherBignum
            .mul(gmk.invertm(publicKeyBignum._n2))
            .mod(publicKeyBignum._n2);
        return uk;
    });
    console.log("--------------TEST-------------");
    const esum = esBignum.reduce(
        (acc, ek) => acc.add(ek).mod(bignum(2).pow(256)),
        bignum(0)
    );

    if (!bignum(hash, 16).eq(esum)) {
        console.error("err");
        return false;
    }

    return zs.every((zk, i) => {
        let zkBignum = bignum(zk);
        const ak = asBignum[i];
        const ek = esBignum[i];
        const uk = us[i];
        const zkn = zkBignum.powm(publicKeyBignum.n, publicKeyBignum._n2);
        let uke;
        if (ek.lt(0)) {
            uke = bignum(
                bigInt(uk.toString())
                    .modPow(bigInt(ek.toString()), publicKey._n2)
                    .toString()
            );
        } else {
            uke = uk.powm(ek, publicKeyBignum._n2);
        }
        const akue = ak.mul(uke).mod(publicKeyBignum._n2);
        return zkn.eq(akue);
    });
};

module.exports = {
    verifyProof,
};
