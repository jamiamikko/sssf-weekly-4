'use strict';

require('dotenv').config();
const https = require('https');
const http = require('http');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');

require('./passport')(passport);

const fs = require('fs');
const mongoose = require('mongoose');

const images = require('./routes/images');
const auth = require('./routes/auth');

const express = require('express');
const app = express();

app.use(
  session({
    secret: process.env.SECRET,
    resave: true,
    saveUninitialized: true
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
  cert: sslcert
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
app.use('/login', auth(passport));

app.use((err, req, res, next) => {
  console.log('ERROR');
  res.status(400).send({error: err.message});
});
