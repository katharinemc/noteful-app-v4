'use strict';

const express = require('express');
const router = express.Router();
const localAuth = require('../passport/local');
const mongoose = require('mongoose');

const User = require('../models/user');

router.post('/', (req, res, next) => {
   
  const { username, password, fullName } = req.body;

  return User.hashPassword(password)
    .then(digest => {
      const newUser = {
        username,
        password: digest,
        fullName
      };
      return User.create(newUser);
    })
    .then(result => {
      return res.status(201).location(`/api/users/${result.id}`).json(result);
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('The username already exists');
        err.status = 400;
      }
      next(err);
    });
});


module.exports = router;