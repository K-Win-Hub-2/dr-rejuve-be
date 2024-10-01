'use strict';

const mongoose = require('mongoose');
mongoose.promise = global.Promise;
const Schema = mongoose.Schema;


let GiftPointRuleSchema = new Schema({
  name: {
    type: String
  },
  point: {
    type: Number,
    default: 0
  },
  description: {
    type: String
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('GiftPointRules', GiftPointRuleSchema);
