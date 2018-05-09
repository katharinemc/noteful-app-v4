'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({
  fullName: { type: String, },
  username: {type: String, unique: true, required: true},
  password: {type: String, required: true}
});


// db.users.update( {"_id" : ObjectId("5af320e351fa1a1ca7007e83")},  {$set: {id" : ObjectId("5af318e85d696a18174d33f2")}})


userSchema.set('toObject', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    delete ret.password;
  }
});
userSchema.methods.validatePassword = function (password) {
  return password === this.password;
};

userSchema.methods.validatePassword = function (password) {
    return bcrypt.compare(password, this.password);
  };
  
  userSchema.statics.hashPassword = function (password) {
    return bcrypt.hash(password, 10);
  };

module.exports = mongoose.model('User', userSchema);
