module.exports = {
  candidates: async (req, res, next) => {
    const vote = req.body;
    console.log("Data to verify", vote);
    var pubKey = r.KEYUTIL.getKey(r.KEYUTIL.getPEM(signKey.pubKeyObj));
    if (!pubKey.verify(vote, hSigVal)) {
      res.send(false);
    }
  }
};
