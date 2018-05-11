'use strict';

const express = require('express');
const router = express.Router();
const passport = require('passport');
const mongoose = require('mongoose');
const Note = require('../models/note');
const Tag = require('../models/tag');
const Folder = require('../models/folder');


router.use('/', passport.authenticate('jwt', { session: false, failWithError: true }));

function validateFolderId(folderId, userId) {
  if (folderId === undefined) {
    return Promise.resolve();
  }
  if (!mongoose.Types.ObjectId.isValid(folderId)) {
    const err = new Error('The `folderId` is not valid');
    err.status = 400;
    return Promise.reject(err);
  }
  return Folder.count({ _id: folderId, userId })
    .then(count => {
      if (count === 0) {
        const err = new Error('The `folderId` is not valid');
        err.status = 400;
        return Promise.reject(err);
      }
    });
}

function validateTagIds(tags, userId) {
  if (tags === undefined) {
    return Promise.resolve();
  }
  if (!Array.isArray(tags)) {
    const err = new Error('The `tags` must be an array');
    err.status = 400;
    return Promise.reject(err);
  }
  return Tag.find({ $and: [{ _id: { $in: tags }, userId }] })
    .then(results => {
      if (tags.length !== results.length) {
        const err = new Error('The `tags` contains an invalid id');
        err.status = 400;
        return Promise.reject(err);
      }
    });
}

/* ========== GET/READ ALL ITEMS ========== */
router.get('/', (req, res, next) => {
  const { searchTerm, folderId, tagId } = req.query;
  const userId = req.user.id;

  let filter ={ userId};


  if (searchTerm) {
    const re = new RegExp(searchTerm, 'i');
    filter.title = { $regex: re };
  }


  if (folderId) {
    filter.folderId = folderId;
  }

  if (tagId) {
    filter.tags = tagId;
  }

  console.log(filter);

  Note.find( filter)
    .populate('tags')
    .sort({ 'updatedAt': 'desc' })
    .then(results => {
      res.json(results);
    })
    .catch(err => {
      next(err);
    });
});

/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/:id', (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  console.log(userId);

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Note.findOne({ _id: id, userId })
    .populate('tags')
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
});

/* ========== POST/CREATE AN ITEM ========== */
router.post('/', (req, res, next) => {
  const { title, content, folderId, tags = [] } = req.body;
  const userId = req.user.id;
  const newNote = { title, content, userId, folderId, tags };

  /***** Never trust users - validate input *****/
  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  if (folderId && !mongoose.Types.ObjectId.isValid(folderId)) {
    const err = new Error('The `folderId` is not valid');
    err.status = 400;
    return next(err);
  }

  if (tags) {
    tags.forEach((tag) => {
      if (!mongoose.Types.ObjectId.isValid(tag)) {
        const err = new Error('The `id` is not valid');
        err.status = 400;
        return next(err);
      }
    });
  }

  Promise.all([
    validateFolderId(folderId, userId),
    validateTagIds(tags, userId)
  ])
    .then(() => Note.create(newNote))
    .then(result => {
      res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
    })
    .catch(err => {
      if (err === 'InvalidFolder') {
        err = new Error('The folder is not valid');
        err.status = 400;
      }
      if (err === 'InvalidTag') {
        err = new Error('The tag is not valid');
        err.status = 400;
      }
      next(err);
    });

  

 
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/:id', (req, res, next) => {
  const { id } = req.params;
  const { title, content, folderId, tags = [] } = req.body;
  const userId = req.user.id;

  const updateNote = { title, content, userId, folderId, tags };

  /***** Never trust users - validate input *****/
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  if (folderId && !mongoose.Types.ObjectId.isValid(folderId)) {
    const err = new Error('The `folderId` is not valid');
    err.status = 400;
    return next(err);
  }

  if (tags) {
    tags.forEach((tag) => {
      if (!mongoose.Types.ObjectId.isValid(tag)) {
        const err = new Error('The `tags.id` is not valid');
        err.status = 400;
        return next(err);
      }
    });
  }

  Promise.all([
    validateFolderId(folderId, userId),
    validateTagIds(tags, userId)
  ])
    .then(() => {
      return Note.findByIdAndUpdate(id, updateNote, { new: true })
        .populate('tags');
    })
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      if (err === 'InvalidFolder') {
        err = new Error('The folder is not valid');
        err.status = 400;
      }
      if (err === 'InvalidTag') {
        err = new Error('The tag is not valid');
        err.status = 400;
      }
      next(err);
    });
});

router.delete('/:id', (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  Note.findOneAndRemove({_id:id, userId})
    .then(() => {
      //add code to check if element removed
      res.status(204).end();
    })
    .catch(err => {
      next(err);
    });
});

module.exports = router;