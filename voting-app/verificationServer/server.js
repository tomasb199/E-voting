const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const paillier = require('paillier-bignum');
let r = require("jsrsasign");
let network = require("./fabric/network");

const port = 5000;
const bits = 2048;

const app = express();

//Body Parser Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
var PrivateKey = undefined, signKey = undefined;
app.use(cors()); //Cors for use 2 API
const appAdmin = "admin";

//Function for init voting keys
async function init() {
  //use this identity to query
  let { publicKey, privateKey } = await paillier.generateRandomKeys(bits);
  signKey = new r.KEYUTIL.generateKeypair("RSA", 2048);
  PrivateKey = privateKey;

  const publicKeyObj = {
    n: publicKey.n.toString(),
    g: publicKey.g.toString(),
  }

  //insert Public Key
  let networkObj = await network.connectToNetwork(appAdmin);
  let response = await network.invoke(
    networkObj,
    false,
    "sendVotingKey",
    JSON.stringify(publicKeyObj)
  );
  networkObj = await network.connectToNetwork(appAdmin);
  response = await network.invoke(networkObj, false, "sendSigningKey", r.KEYUTIL.getPEM(signKey.pubKeyObj));

}

async function countVote(res) {
  let networkObj = await network.connectToNetwork(appAdmin);
  let response = await network.invoke(
    networkObj,
    true,
    "countVote",
    ""
  );
  votingResult = JSON.parse(response);
  console.log("RESULT: ", votingResult);
  decryptVotingResult = votingResult.map(element => {
    return PrivateKey.decrypt(element).toString();
  });
  res.send(decryptVotingResult);
}
init();

app.get("/getResult", (req, res) => {
  countVote(res);
});

app.post("/verifyVote", (req, res) => {
  const fullVote = req.body; // Full vote structure for sign
  const vote = req.body.Vote; // Only votes for verify
  console.time("verifyVote");
  try {
    let sum = 0;
    let result = 0;

    for (let i = 0; i < vote.length; i++) {
      //If there are no votes attribute
      if (!vote[i].hasOwnProperty("vote") && !vote[i].hasOwnProperty("proof")) {
        res.send(false);
        return;
      }
      result = PrivateKey.decrypt(vote[i].vote);
      //Checking if the vote is 1 or 0
      if (result != 1 && result != 0) {
        res.send(false);
        return;
      }
      //I count all votes
      sum += result;
    }
    console.timeEnd("verifyVote");

    // If vote is correct sign
    if (sum >= 1) {
      var sig = new r.KJUR.crypto.Signature({ alg: "SHA1withRSA" });
      sig.init(signKey.prvKeyObj);
      sig.updateString(JSON.stringify(vote));
      console.log("Data to sign", JSON.stringify(vote));
      fullVote.Sign = sig.sign();
      res.send(fullVote);
    } else {
      res.send(false);
      return;
    }
  } catch (err) {
    res.send(false);
    return;
  }
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
