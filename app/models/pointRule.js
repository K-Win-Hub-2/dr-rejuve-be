'use strict';

const mongoose = require('mongoose');
mongoose.promise = global.Promise;
const Schema = mongoose.Schema;


let PointSchema = new Schema({
  point: {
    type: Number,
    default: 1
  },
  amount: {
    type: Number,
    default: 1
  },
  description: {
    type: String
  },
  type: {
    type: String,
    enum: ['Aesthetic', 'Surgery', 'Pharmacy'],
    default: 'Aesthetic'
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Points', PointSchema);
