"use strict";

const { Schema, model } = require("mongoose");

const treatmentDetailsSchema = new Schema({
  title: {
    type: String,
  },
  image: {
    type: String,
  },
  description: {
    type: String,
  },
});

const adminTreatmentSchema = new Schema({
  treatmentName: {
    type: String,
    required: true,
  },
  SubTreatmentName: {
    type: String,
    required: true,
  },
  SubTreatmentDescription: {
    type: String,
    required: true,
  },
  treatmentDescription: {
    type: String,
  },
  treatmentBanner: {
    type: String,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  treatmentDetails: [treatmentDetailsSchema],
});

const OnlyShowTreatmentSchema = model(
  "adminCreateTreatment",
  adminTreatmentSchema
);

module.exports = OnlyShowTreatmentSchema;
