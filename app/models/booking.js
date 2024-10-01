"use strict";

const mongoose = require("mongoose");
mongoose.promise = global.Promise;
const Schema = mongoose.Schema;
const validator = require("validator");

let BookingSchema = new Schema({
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Treatments",
  },
  bookingNumber: {
    type: String,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  name: {
    type: String,
  },
  phone: {
    type: Number,
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    validate: {
      isAsync: true,
      validator: validator.isEmail,
      message: "Invalid Email Address.",
    },
  },
  serviceProvider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctors",
  },
  description: {
    type: String,
  },
  date: {
    type: Date,
  },
  time: {
    type: String,
  },
  remark: {
    type: String,
  },
  doctor: {
    type: String,
  },
  treatment: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  relatedPatient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patients",
  },
  status: {
    type: String,
    enum: ["Pending", "Success", "Cancelled", "Confirmed"],
    default: "Pending",
  },
});

module.exports = mongoose.model("Bookings", BookingSchema);
