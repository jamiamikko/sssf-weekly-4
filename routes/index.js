const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  if (req.user) {
    return res.render('index', {title: 'Assignment 4'});
  }

  res.redirect('/login');
});

router.get('/login', (req, res) => {
  res.render('login', {title: 'Login'});
});

module.exports = router;
