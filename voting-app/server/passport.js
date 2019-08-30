const GooglePlusTokenStrategy = require('passport-google-plus-token');
const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const { ExtractJwt } = require('passport-jwt');
const config = require('./configuration');

passport.serializeUser(function(user, cb) {
    cb(null, user);
});
  
passport.deserializeUser(function(obj, cb) {
    cb(null, obj);
});

// JSON WEB TOKENS STRATEGY
passport.use(new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromHeader('authorization'),
    secretOrKey: config.JWT_SECRET
}, async (payload, done) => {
    try {
        console.log('payload:', payload);
        done(null, true);
    } catch(error) {
        console.log(error);
        done(error, false);
    }
}));

// Google OAuth Strategy
passport.use('googleToken', new GooglePlusTokenStrategy({
    clientID: config.oauth.google.clientID,
    clientSecret: config.oauth.google.clientSecret
  }, async (accessToken, refreshToken, profile, done) => {
    try {
        console.log('tu');
        //Should have full user profile over here
        console.log('profile', profile);
        console.log('accessToken', accessToken);
        //console.log('refreshToken', refreshToken);
        var userData = {
            email: profile.emails[0].value,
            name: profile.displayName,
            token: accessToken
        };
        done(null, userData);
    } catch(error) {
      console.log(error);  
      done(error, false, error.message);
    }
  }));