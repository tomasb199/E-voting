let network = require("../fabric/network");
const util = require("util");

//use this identity to query
const userName = "votingServer";

module.exports = {
  candidates: async (req, res, next) => {
    console.log(req.headers);
    let networkObj = await network.connectToNetwork(userName);
    let response = await network.invoke(
      networkObj,
      true,
      "queryAllCandidates",
      ""
    );
    let parsedResponse = await JSON.parse(response);
    res.send(parsedResponse);
  },

  //For testing
  getAllVote: async (req, res) => {
    let networkObj = await network.connectToNetwork(userName);
    let response = await network.invoke(networkObj, true, "queryAllVote", "");
    let parsedResponse = await JSON.parse(response);
    res.send(parsedResponse);
  },

  getPubKey: async (req, res) => {
    let networkObj = await network.connectToNetwork(userName);
    let response = await network.invoke(networkObj, true, "getKey", "");
    let parsedResponse = await JSON.parse(response);
    res.send(parsedResponse);
  },

  getBits: async (req, res) => {
    let networkObj = await network.connectToNetwork(userName);
    let response = await network.invoke(networkObj, true, "getBits", "");
    res.json(JSON.parse(response));
  },

  vote: async (req, res) => {
    let networkObj = await network.connectToNetwork(userName);
    console.time("Send Vote");
    let response = await network.invoke(networkObj, false, "createVote", [
      req.body,
    ]);
    console.timeEnd("Send Vote");
    if (response.error) {
      res.send(response.error);
    } else {
      res.send(response);
    }
  },

  getVote: async (req, res) => {
    console.log(req);
    let networkObj = await network.connectToNetwork(userName);
    let response = await network.invoke(
      networkObj,
      true,
      "readVote",
      req.query.ID.toString()
    );
    let parsedResponse = await JSON.parse(response);
    res.send(parsedResponse);
  },
};
