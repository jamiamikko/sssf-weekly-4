'use strict';

require('dotenv').config();
const https = require('https');
const http = require('http');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const handlebars = require('express-handlebars');
let acl = require('acl');
const helmet = require('helmet');

require('./passport')(passport);

const fs = require('fs');
const mongoose = require('mongoose');

const index = require('./routes/index');
const images = require('./routes/images');
const auth = require('./routes/auth');

const express = require('express');
const app = express();

app.engine(
  'handlebars',
  handlebars({
    extname: 'handlebars',
    defaultLayout: 'layout',
    layoutsDir: __dirname + '/views/layouts/'
  })
);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'handlebars');

app.use(
  session({
    secret: process.env.SECRET,
    resave: true,
    saveUninitialized: true
  })
);

app.use(helmet());
app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

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
  .then((db) => {
    acl = new acl(new acl.mongodbBackend(db, 'acl_'));

    console.log(acl);
  })
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

app.use('/', index);
app.use('/images', images);
app.use('/login', auth(passport));

app.use((err, req, res, next) => {
  console.log('ERROR');
  res.status(400).send({error: err.message});
});
