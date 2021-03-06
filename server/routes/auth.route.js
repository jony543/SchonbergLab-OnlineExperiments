const express = require('express');
const asyncHandler = require('express-async-handler')
const passport = require('passport');
const userCtrl = require('../controllers/user.controller');
const authCtrl = require('../controllers/auth.controller');
const config = require('../config/config');

const router = express.Router();
module.exports = router;

router.post('/register', asyncHandler(register), login);
router.post('/login', passport.authenticate('local', { session: false }), login);
router.get('/me', passport.authenticate('jwt', { session: false }), login);


async function register(req, res, next) {
  let user = await userCtrl.insert(req.body);
  user = user.toObject();
  
  delete user.hashedPassword;
  delete user.passwordHash
  
  req.user = user;
  next()
}

function login(req, res) {
  let user = req.user;

  delete user.hashedPassword;
  delete user.passwordHash
  
  let token = authCtrl.generateToken(user);

  res.cookie('jwt', token, {
            httpOnly: false,
            sameSite: true,
            signed: true,
            secure: false,
            maxAge: 12 * 30 * 24 * 60 * 60 * 1000,
        });

  res.json({ user, token });
}
