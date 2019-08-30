let network = require('../fabric/network');
const util = require('util');

//use this identity to query
const appAdmin = "admin";

module.exports = {

    candidates: async (req, res, next) => {
        console.log(req.headers);
        let networkObj = await network.connectToNetwork(appAdmin);
        let response = await network.invoke(networkObj, true, 'queryAllCandidates', '');
        let parsedResponse = await JSON.parse(response);
        res.send(parsedResponse);
    },

    getAllVote: async (req, res) => {

        let networkObj = await network.connectToNetwork(appAdmin);
        let response = await network.invoke(networkObj, true, 'queryAllVote', '');
        let parsedResponse = await JSON.parse(response);
        res.send(parsedResponse);
    },
    
    getPubKey: async (req, res) => {
    
        let networkObj = await network.connectToNetwork(appAdmin);
        let response = await network.invoke(networkObj, true, 'getKey', '');
        let parsedResponse = await JSON.parse(response);
        res.send(parsedResponse);
    },

    getBits: async (req, res) => {
    
        let networkObj = await network.connectToNetwork(appAdmin);
        let response = await network.invoke(networkObj, true, 'getBits', '');
        res.json(JSON.parse(response));
    },

    vote: async (req, res) => {
    
        let networkObj = await network.connectToNetwork(appAdmin); //TODO:Change to req.body.id
        //0console.log('util inspecting\n' + util.inspect(networkObj));
        
        let response = await network.invoke(networkObj, false, 'createVote', [req.body]);
        if (response.error) {
        res.send(response.error);
        } else {
        res.send(response);
        }
    },

    getResult: async (req, res) => {
    
        let networkObj = await network.connectToNetwork(appAdmin);
        let response = await network.invoke(networkObj, true, 'countVote', '');
        let parsedResponse = await JSON.parse(response);
        res.send(parsedResponse);
    },
    getVote: async (req, res) => {
        console.log(req);
        let networkObj = await network.connectToNetwork(appAdmin);
        let response = await network.invoke(networkObj, true, 'readVote', req.query.ID.toString());
        let parsedResponse = await JSON.parse(response);
        res.send(parsedResponse);
    },

}