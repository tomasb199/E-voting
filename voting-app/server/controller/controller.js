const JWT = require('jsonwebtoken');
const config = require('../configuration');

signToken = user => {
    return JWT.sign({
      iss: 'VotingApp',
      sub: user.id,
      name: user.displayName,
      iat: new Date().getTime(), // current time
      exp: new Date().setDate(new Date().getDate() + 1) // current time + 1 day ahead
    }, config.JWT_SECRET);
  }

module.exports = {

    googleOAuth: async (req, res, next) => {
      // Generate token
      console.log('got here');
      const token = signToken(req.user);
      res.status(200).json({token});
    }

}