'use strict';

const mongoose = require('mongoose');
mongoose.promise = global.Promise;
const Schema = mongoose.Schema;


let PointDiscountSchema = new Schema({
  from: {
    type: Number,
    default: 0
  },
  to: {
    type: Number,
    default: 0
  },
  percent: {
    type: Number,
    default: 0
  },
  type: {
    type: String,
    enum: ['Aesthetic', 'Surgery', 'Pharmacy'],
    default: 'Aesthetic'
  },
  description: {
    type: String
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PointDiscounts', PointDiscountSchema);
