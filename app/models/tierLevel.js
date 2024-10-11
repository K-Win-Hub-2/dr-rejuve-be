"use strict";

const mongoose = require("mongoose");
mongoose.promise = global.Promise;
const Schema = mongoose.Schema;

let TierSchema = new Schema({
  name: {
    type: String,
  },
  description: {
    type: String,
  },
  relatedFixedDiscountPercent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "FixedDiscountPercents",
  },
  total_point: {
    type: Number,
    default: 0,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("TierLevels", TierSchema);
