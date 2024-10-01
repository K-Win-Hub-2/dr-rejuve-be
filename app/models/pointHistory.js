'use strict';

const mongoose = require('mongoose');
mongoose.promise = global.Promise;
const Schema = mongoose.Schema;


let PointHistorySchema = new Schema({
  type: {
    type: String,
    enum: ['point_earned', 'point_spent'],
    required: true,
  },
  discountPercent: {
    type: Number,
    required: true,
    default: 0
  },
  realTotalAmount: {
    type: Number,
    default: 0
  },
  discountTotalAmount: {
    type: Number,
    default: 0
  },
  relatedPatient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patients',
    required: true
  },
  relatedTreatment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Treatments'
  },
  relatedTreatmentVoucher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TreatmentVouchers'
  },
  point: {
    type: Number,
    required: true,
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  date: {
    type: Date,
    default: Date.now()
  },
  relatedBranch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branches'
  },
});

module.exports = mongoose.model('PointHistories', PointHistorySchema);

//Author: Oakar Kyaw