'use strict';


const express = require('express');
const router = express.Router();

const jwt = require('jsonwebtoken');

const mongoose = require('mongoose');
const User = require('../models/user');
const passport = require('passport');
const localStrategy = require('../passport/local');
const bodyParser = require('body-parser');

const options = {session: false, failWithError: true};

const localAuth = passport.authenticate('local', options);
const jsonParser = bodyParser.json();
const { JWT_SECRET, JWT_EXPIRY} = require('../config');


function createAuthToken (user) {
  return jwt.sign({ user }, JWT_SECRET, {
    subject: user.username,
    expiresIn: JWT_EXPIRY
  });
}


router.post('/login', localAuth, function (req, res) {
    console.log('welcome to auth');
    const authToken = createAuthToken(req.user);
    console.log(authToken);
  return res.json({authToken});
});

const jwtAuth = passport.authenticate('jwt', { session: false, failWithError: true });

router.post('/refresh', jwtAuth, (req, res) => {
  const authToken = createAuthToken(req.user);
  res.json({ authToken });
});


module.exports = router;