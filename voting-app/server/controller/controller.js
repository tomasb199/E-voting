const JWT = require('jsonwebtoken');
const config = require('../configuration');

signToken = user => {
  console.log('UserID: ', user.name);
    return JWT.sign({
      iss: 'VotingApp',
      sub: user.id,
      name: user.name,
      email: user.email,
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