const router = require('express-promise-router')();
const passport = require('passport');
const passportConf = require('../passport');

const { validateBody, schemas } = require('../helper/routeHelper');
const UsersController = require('../controller/controller');
const FabricController = require('../controller/fabricController');
const passportGoogle = passport.authenticate('googleToken', { session: false });
const passportJWT = passport.authenticate('jwt', { session: false });

router.route('/voting-app/candidates')
    .get(FabricController.candidates);

// Only for debug
router.route('/voting-app/getAllVote')
    .get(FabricController.getAllVote);

router.route('/voting-app/getPubKey')
    .get(FabricController.getPubKey);

router.route('/voting-app/vote')
    .post(FabricController.vote);

router.route('/voting-app/getVote')
    .get(FabricController.getVote);

router.route('/voting-app/login')
    .post(passportGoogle, UsersController.googleOAuth);

module.exports = router;