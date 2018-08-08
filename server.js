'use strict';

require('dotenv').config();
const https = require('https');
const http = require('http');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const fs = require('fs');
const mongoose = require('mongoose');

const images = require('./routes/images');

const express = require('express');
const app = express();

passport.use(
  new LocalStrategy((username, password, done) => {
    if (
      username !== process.env.USERNAME ||
      password !== process.env.PASSWORD
    ) {
      done(null, false, {message: 'Incorrect credentials'});
      return;
    }
    return done(null, {username: username});
  })
);

passport.serializeUser((user, done) => {
  console.log(`Serialize user: ${user.username}`);
  done(null, user);
});

passport.deserializeUser((user, done) => {
  console.log(`Deserialize user: ${user.username}`);
  done(null, user);
});

app.use(
  session({
    secret: process.env.SECRET,
    resave: true,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(express.static('public'));

const sslkey = fs.readFileSync('./config/ssl-key.pem');
const sslcert = fs.readFileSync('./config/ssl-cert.pem');

const options = {
  key: sslkey,
  cert: sslcert,
};

https.createServer(options, app).listen(3000);
http
  .createServer((req, res) => {
    res.writeHead(301, {Location: 'https://localhost:3000' + req.url});
    res.end();
  })
  .listen(8080);

mongoose
  .connect(
    `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@${
      process.env.DB_HOST
    }:${process.env.DB_PORT}/test`,
    {useNewUrlParser: true}
  )
  .then(() => {})
  .catch((err) => {
    console.log(err);
  });

const db = mongoose.connection;

db.once('open', () => {
  console.log('Connected to MongoDB');
});

db.on('error', (err) => {
  console.log(err);
});

app.use('/images', images);

app.post(
  '/login',
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login.html',
  })
);
