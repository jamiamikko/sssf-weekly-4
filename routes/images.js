const express = require('express');
const mongoose = require('mongoose');
const sharp = require('sharp');
const path = require('path');
const multer = require('multer');
const uuid = require('uuid/v4');
const fs = require('fs');
const router = express.Router();

const imgDataSchema = new mongoose.Schema({
  time: {type: String, required: true},
  category: {type: String, required: true},
  title: {type: String, required: true},
  details: {type: String, required: true},
  coordinates: {type: Object, required: true},
  thumbnail: String,
  image: String,
  original: {type: String, required: true}
});

const ImgData = mongoose.model('ImgData', imgDataSchema);

const convertImage = (file, height, width) =>
  new Promise((resolve, reject) => {
    const newName =
      file.destination +
      file.filename.split('.')[0] +
      '_' +
      height +
      'x' +
      width +
      path.extname(file.originalname);

    sharp(file.path)
      .resize(height, width)
      .toFile(newName, (err, info) => {
        if (err) reject(err);
        else resolve(newName);
      });
  });

const storage = multer.diskStorage({
  destination: 'public/uploads/',
  filename: (req, file, callback) => {
    callback(null, uuid() + path.extname(file.originalname));
  },
});

const upload = multer({storage: storage}).single('image');

router.get('/', (req, res) => {
  ImgData.find({}, (err, data) => {
    if (err) {
      console.log(err);
      res.sendStatus(400);
    } else {
      res.send(data);
    }
  });
});

router.get('/search', (req, res) => {
  const title = req.query.title;

  ImgData.find({title: {$regex: title, $options: 'i'}}, (err, data) => {
    if (err) {
      console.log(err);
      res.sendStatus(400);
    } else {
      console.log(data);
      res.send(data);
    }
  });
});

router.get('/:id', (req, res) => {
  const id = req.params.id;

  ImgData.findById(id, (err, data) => {
    if (err) {
      console.log(err);
      res.sendStatus(400);
    } else {
      res.send(data);
    }
  });
});

router.put('/', upload, (req, res) => {
  if (!req.body || !req.file) return res.sendStatus(400);
  const date = new Date()
    .toISOString()
    .replace(/T/, ' ')
    .replace(/\..+/, '');

  const dataObj = {
    time: date,
    category: req.body.category,
    title: req.body.title,
    details: req.body.description,
    coordinates: {
      lat: parseFloat(req.body.latitude),
      lng: parseFloat(req.body.longitude),
    },
    original: req.file.path.replace('public/', ''),
  };

  convertImage(req.file, 320, 300)
    .then((data) => {
      dataObj.thumbnail = data.replace('public/', '');

      convertImage(req.file, 768, 720)
        .then((response) => {
          dataObj.image = response.replace('public/', '');

          const data = new ImgData(dataObj);
          data.save();
          res.sendStatus(200);
        })
        .catch((err) => {
          console.log(err);
          res.sendStatus(400);
        });
    })
    .catch((err) => {
      console.log(err);
      res.sendStatus(400);
    });
});

router.post('/:id', (req, res) => {
  if (!req.body) return sendStatus(400);

  const id = req.params.id;

  ImgData.findById(id, (err, image) => {
    if (err) {
      console.log(err);
      res.sendStatus(400);
    } else {
      image.set({
        coordinates: req.body.coordinates,
        category: req.body.category,
        title: req.body.title,
        details: req.body.details,
      });

      image.save((err, updatedData) => {
        if (err) {
          console.log(err);
          res.sendStatus(400);
        } else {
          res.send(updatedData);
        }
      });
    }
  });
});

router.delete('/:id', (req, res) => {
  const id = req.params.id;

  ImgData.findOne({_id: id}, (err, data) => {
    if (err) {
      console.log(err);
      res.sendStatus(400);
    } else {
      const imagePaths = [data.original, data.thumbnail, data.image];

      imagePaths.forEach((path) => {
        fs.unlink('public/' + path, (err) => {
          if (err) console.log(err);
        });
      });

      ImgData.deleteOne({_id: id}, (err) => {
        if (err) {
          console.log(err);
          res.sendStatus(400);
        } else {
          res.sendStatus(200);
        }
      });
    }
  });
});

module.exports = router;
