'use strict';

const express = require('express');
const router = express.Router();
const localAuth = require('../passport/local');
const mongoose = require('mongoose');

const User = require('../models/user');

router.post('/', (req, res, next) => {
   
  let { username, password, fullname = '' } = req.body;
  fullname = fullname.trim();


  if (!password || !username) {
    const err = new Error('Must include username and password');
    err.status = 400;
    return next(err);
  }

  if (typeof password !== 'string' || typeof username !== 'string') {
    const err = new Error('Password and username must be string');
    err.status = 400;
    return next(err);
  }

  if(password.length < 8 || password.length >72) {
    const err = new Error ('password must be between 8 and 72 characters');
    err.status = 400;
    return next(err);
  }

  const explicityTrimmedFields = ['username', 'password'];
  const nonTrimmedField = explicityTrimmedFields.find(
    field => req.body[field].trim() !== req.body[field]
  );

  if (nonTrimmedField) {
    const err = new Error(`Field: '${nonTrimmedField}' cannot start or end with whitespace`);
    err.status = 422;
    return next(err);
  }


  return User.hashPassword(password)
    .then(digest => {
      const newUser = {
        username,
        password: digest,
        fullname
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