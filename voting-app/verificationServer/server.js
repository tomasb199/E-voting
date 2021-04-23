const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const paillier = require("paillier-bignum");
var bigInt = require("big-integer");
let network = require("./fabric/network");

const port = 5000;
const bits = 2048;

const app = express();

//Body Parser Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
var PrivateKey = undefined;
var voteData = undefined;
app.use(cors()); //Cors for use 2 API
const appVerificationServer = "verificationServer";

//Function for init voting keys
async function init() {
  //Get from blockchain vote data
  let networkObj = await network.connectToNetwork(appVerificationServer);
  response = await network.invoke(networkObj, true, "queryAllCandidates", "");
  voteData = JSON.parse(response);

  console.log(voteData);

  //use this identity to query
  //Create HE keys
  let { publicKey, privateKey } = paillier.generateRandomKeys(bits);
  PrivateKey = privateKey;

  //Create structure for sending HE public key
  const publicKeyObj = {
    n: publicKey.n.toString(),
    g: publicKey.g.toString(),
  };

  //Insert to blockchain HE Public Key
  networkObj = await network.connectToNetwork(appVerificationServer);
  response = await network.invoke(
    networkObj,
    false,
    "sendVotingKey",
    publicKeyObj
  );
  //Insert to blockchain HE Public Key
  networkObj = await network.connectToNetwork(appVerificationServer);
  response = await network.invoke(networkObj, false, "sendVotingKeyBits", bits);
}

init();

app.get("/getResult", async (req, res) => {
  let networkObj = await network.connectToNetwork(appVerificationServer);

  console.time("Transaction");
  let response = await network.invoke(networkObj, true, "countVote", "");
  console.timeEnd("Transaction");
  const pom = JSON.parse(response);
  console.time("Decrypt");
  // Decrypt sum of all votes
  const sum = PrivateKey.decrypt(bigInt(pom.res));
  console.timeEnd("Decrypt");
  console.log("RESULT: ", sum);

  console.time("Parsing result");
  // Parse sum of all votes to for each candidate
  const finalResult = voteData.map(function (obj, i, array) {
    let temp;
    if (i + 1 < array.length) {
      temp = sum
        .mod(array[i + 1].Record.Vote)
        .div(obj.Record.Vote)
        .toString();
    } else {
      temp = sum.div(obj.Record.Vote).toString();
    }
    const result = {
      name: obj.Record.Name,
      res: temp,
    };
    return result;
  });
  console.timeEnd("Parsing result");
  console.log(finalResult);
  res.send(JSON.stringify(finalResult));
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
