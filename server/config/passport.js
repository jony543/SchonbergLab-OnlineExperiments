const passport = require('passport');
const LocalStrategy = require('passport-local');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const bcrypt = require('bcrypt');
const md5 = require('md5');

const User = require('../models/user.mysql.model');
const config = require('./config');

var cookieOrHeaderExtractor = function(req) {
    var token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    
    if (!token) {
      if (req && req.signedCookies)
      {
          token = req.signedCookies['jwt'];
      }
    }

    return token;
};

const localLogin = new LocalStrategy({
  usernameField: 'email'
}, async (email, password, done) => {
  let user = await User.findOne({ username: email });
  if (!user || (md5(password) != user.passwordHash && !bcrypt.compareSync(password, user.hashedPassword))) {
    return done(null, false, { error: 'Your login details could not be verified. Please try again.' });
  }

  if (user.toObject)
    user = user.toObject();
  
  delete user.hashedPassword;
  delete user.passwordHash;

  done(null, user);
});

const jwtLogin = new JwtStrategy({
  jwtFromRequest: cookieOrHeaderExtractor,
  secretOrKey: config.jwtSecret
}, async (payload, done) => {
  let user = await User.findById(payload._id || payload.worker_id);
  if (!user) {
    return done(null, false);
  }

  if (user.toObject)
    user = user.toObject();
  
  delete user.hashedPassword;
  delete user.passwordHash;

  done(null, user);
});

passport.use(jwtLogin);
passport.use(localLogin);

module.exports = passport;
