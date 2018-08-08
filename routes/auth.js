const express = require('express');
const router = express.Router();
const User = require('../db/User');

module.exports = (passport) => {
  return router.post(
    '/',
    passport.authenticate('local', {
      successRedirect: '/',
      failureRedirect: '/login.html'
    })
  );
};
