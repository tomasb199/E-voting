const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const paillier = require("paillier-js");
var bigInt = require("big-integer");
let network = require("./fabric/network");

const port = 5000;
const bits = 1024;

const app = express();

//Body Parser Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
var PrivateKey = undefined,
  PublicKey = undefined;
var voteData = undefined;
app.use(cors()); //Cors for use 2 API
const appAdmin = "admin";

//Function for init voting keys
async function init() {
  //Get from blockchain vote data
  let networkObj = await network.connectToNetwork(appAdmin);
  response = await network.invoke(networkObj, true, "queryAllCandidates", "");
  voteData = JSON.parse(JSON.parse(response));

  console.log(voteData);

  //use this identity to query
  //Create HE keys
  let { publicKey, privateKey } = paillier.generateRandomKeys(bits);
  PrivateKey = privateKey;

  //Create structure for sending HE public key
  const publicKeyObj = {
    n: publicKey.n.toString(),
    g: publicKey.g.toString()
  };

  //Insert to blockchain HE Public Key
  networkObj = await network.connectToNetwork(appAdmin);
  response = await network.invoke(
    networkObj,
    false,
    "sendVotingKey",
    publicKeyObj
  );
  //Insert to blockchain HE Public Key
  networkObj = await network.connectToNetwork(appAdmin);
  response = await network.invoke(networkObj, false, "sendVotingKeyBits", bits);
}

init();

app.get("/getResult", async (req, res) => {
  let networkObj = await network.connectToNetwork(appAdmin);
  let response = await network.invoke(networkObj, true, "countVote", "");
  const pom = JSON.parse(JSON.parse(response));

  // Decrypt sum of all votes
  const sum = PrivateKey.decrypt(bigInt(pom.res));
  console.log("RESULT: ", sum);

  // Parse sum of all votes to for each candidate
  const finalResult = voteData.map(function(obj, i, array) {
    let temp;
    if (i + 1 < array.length) {
      temp = sum
        .mod(array[i + 1].Record.Vote) //TODO: potreba zmenit na nasledujucu hodnotu
        .divide(obj.Record.Vote)
        .toString();
    } else {
      temp = sum.divide(obj.Record.Vote).toString();
    }
    const result = {
      name: obj.Record.Name,
      res: temp
    };
    return result;
  });
  console.log(finalResult);
  res.send(JSON.stringify(finalResult));
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
