"use strict";
const { model, Schema } = require("mongoose");

const adminPromotionSchema = new Schema({
  isDeleted: {
    type: Boolean,
    default: false,
  },
  promotionTitle: {
    type: String,
    required: true,
  },
  promotionSubTitle: {
    type: String,
  },
  image: {
    type: String,
    required: true,
  },
  promotionDescription: {
    type: String,
    required: true,
  },
});

const adminPromotionModel = model("adminPromotion", adminPromotionSchema);

module.exports = adminPromotionModel;
