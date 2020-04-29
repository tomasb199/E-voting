const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const paillier = require("paillier-bignum");
let r = require("jsrsasign");
let network = require("./fabric/network");
const fs = require("fs");
const { performance } = require("perf_hooks");

let saveTimeArr = [];
let timeSum = 0;
let saveSumTime = [];

const port = 5000;
const bits = 2048;

const app = express();

//Body Parser Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
var PrivateKey = undefined,
  PublicKey = undefined,
  signKey = undefined;
var voteData = undefined;
app.use(cors()); //Cors for use 2 API
const appVerificationServer = "verificationServer";

//Function for init voting keys
async function init() {
  //use this identity to query
  let { publicKey, privateKey } = await paillier.generateRandomKeys(bits);
  signKey = new r.KEYUTIL.generateKeypair("RSA", 2048);
  PrivateKey = privateKey;
  PublicKey = publicKey;

  const publicKeyObj = {
    n: publicKey.n.toString(),
    g: publicKey.g.toString(),
  };

  //Get from blockchain vote data
  networkObj = await network.connectToNetwork(appVerificationServer);
  let response = await network.invoke(
    networkObj,
    true,
    "queryAllCandidates",
    ""
  );
  voteData = JSON.parse(JSON.parse(response));

  //Insert to blockchain HE Public Key
  networkObj = await network.connectToNetwork(appVerificationServer);
  response = await network.invoke(
    networkObj,
    false,
    "sendVotingKey",
    JSON.stringify(publicKeyObj)
  );

  //Insert to blockchain RSA-signing Public Key
  networkObj = await network.connectToNetwork(appVerificationServer);
  response = await network.invoke(
    networkObj,
    false,
    "sendSigningKey",
    r.KEYUTIL.getPEM(signKey.pubKeyObj)
  );
}

init();

app.get("/getResult", async (req, res) => {
  let networkObj = await network.connectToNetwork(appVerificationServer);
  let response = await network.invoke(networkObj, true, "countVote", "");
  votingResult = JSON.parse(response);
  console.log("RESULT: ", votingResult);

  if (voteData.voteType === 1) {
    console.time("decrypt");
    decryptVotingResult = votingResult.map((candidate) => {
      candidate.res = PrivateKey.decrypt(candidate.res).toString();
      return candidate;
    });
    console.timeEnd("decrypt");
    const finalResult = {
      decryptVotingResult,
    };
    res.send(finalResult);
  } else if (voteData.voteType === 2) {
    decryptVotingResult = votingResult.Parties.map((candidate) => {
      candidate.res = PrivateKey.decrypt(candidate.res).toString();
      return candidate;
    });
    const PreferentialVotes = votingResult.PreferentialVotes.map((party) => {
      party.res = party.res.map((element) => {
        element = PrivateKey.decrypt(element).toString();
        return element;
      });
      return party;
    });

    console.log(PreferentialVotes);
    const finalResult = {
      decryptVotingResult,
      PreferentialVotes,
    };

    res.send(finalResult);
  }
});

app.post("/verifyVote", (req, res) => {
  console.log(req.body);
  const fullVote = req.body; // Full vote structure for sign
  const vote = req.body.candidate; // Only votes for verify
  if (fullVote.voteType === 1) {
    try {
      let sum = 0;
      let result = 0;

      console.time("Verify");
      var t0 = performance.now();
      for (let i = 0; i < vote.length; i++) {
        //If there are no votes attribute
        if (!vote[i].hasOwnProperty("vote")) {
          console.log("Vote argument not exist");
          res.send(false);
          return;
        }
        result = PrivateKey.decrypt(vote[i].vote);
        //Checking if the vote is 1 or 0
        if (result != 1 && result != 0) {
          console.log("Vote for candidates is not 1 or 0");
          res.send(false);
          return;
        }
        //I count all votes
        sum += Number(result);
      }
      var t1 = performance.now();
      timeSum += t1 - t0;
      console.log("timeSum");
      saveTimeArr.push(timeSum);
      saveSumTime.push(timeSum);
      fs.writeFile(
        "performanceOut.txt",
        JSON.stringify(saveSumTime), //JSON.stringify(saveTimeArr),
        function (err) {
          if (err) return console.log(err);
          console.log("Hello World > helloworld.txt");
        }
      );
      console.timeEnd("Verify");
      // If vote is correct sign
      if (sum === 1 || sum === 0) {
        var sig = new r.KJUR.crypto.Signature({ alg: "SHA1withRSA" });
        sig.init(signKey.prvKeyObj);
        sig.updateString(JSON.stringify(vote));
        console.log("Data to sign", JSON.stringify(vote));
        fullVote.Sign = sig.sign();
        res.send(fullVote);
      } else {
        console.log("Sum votes for candidates is not 1 or 0");
        res.send(false);
        return;
      }
    } catch (err) {
      console.log("Undefined error");
      res.send(false);
      return;
    }
  } else if (fullVote.voteType === 2) {
    try {
      let sum = 0;
      let result = 0;
      let partyIndex = undefined;
      let isCorrect = true;

      for (let i = 0; i < vote.length; i++) {
        //If there are no votes attribute
        if (!vote[i].hasOwnProperty("vote")) {
          isCorrect = false;
          res.send(false);
          return;
        }
        result = PrivateKey.decrypt(vote[i].vote);

        //Checking if the vote is 1 or 0
        if (result != 1 && result != 0) {
          console.log("Vote for party is not 1 or 0");
          isCorrect = false;
          res.send(false);
          return;
        }
        if (result == 1) {
          partyIndex = i;
        }
        //I count all votes
        sum += Number(result);
      }
      // If vote is correct sign
      if (sum === 1 || sum === 0) {
        for (let i = 0; i < vote.length; i++) {
          var sumCandidates = 0;
          if (isCorrect) {
            for (let element of vote[i].Candidates) {
              result = PrivateKey.decrypt(element.vote);
              if (result != 1 && result != 0) {
                console.log("Preferential vote is not 1 or 0");
                isCorrect = false;
                break;
              }
              sumCandidates += Number(result);
            }
            if (i === partyIndex) {
              if (sumCandidates > fullVote.maxVote || sumCandidates < 0) {
                console.log("Too many preferential votes");
                isCorrect = false;
                return;
              }
            } else {
              if (sumCandidates !== 0) {
                console.log("Preferential votes for bad party", sumCandidates);
                isCorrect = false;
                return;
              }
            }
          } else {
            break;
          }
        }
        if (isCorrect) {
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
      } else {
        console.log("Sum votes for parties is not 1 or 0");
        res.send(false);
        return;
      }
    } catch (err) {
      console.log(err);
      res.send(false);
    }
  }
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
