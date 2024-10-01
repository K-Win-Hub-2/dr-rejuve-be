'use strict';

const mongoose = require('mongoose');
mongoose.promise = global.Promise;
const Schema = mongoose.Schema;


let FixedDiscountPercentSchema = new Schema({
  name: {
    type: String
  },
  percent: {
    type: Number,
    default: 0
  },
  description: {
    type: String
  },
  date: {
    type: Date,
    default: Date.now
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('FixedDiscountPercents', FixedDiscountPercentSchema);
