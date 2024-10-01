"use strict";

const { unlink } = require("../lib/unlinkImage");
const adminPromotionModel = require("../models/adminPromotionModel");

exports.getAllPromotions = async (req, res, next) => {
  try {
    let { page = 1, limit = 10 } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const TotalPromotionsDoc = await adminPromotionModel
      .find({ isDeleted: false })
      .countDocuments();

    const promotions = await adminPromotionModel.find({ isDeleted: false });

    const division = TotalPromotionsDoc / limit;
    const totalPages = Math.ceil(division);

    return res.status(200).json({
      success: true,
      count: TotalPromotionsDoc,
      _metadata: {
        current_page: page,
        per_page: limit,
        page_count: totalPages,
        total_count: TotalPromotionsDoc,
      },
      list: promotions,
    });
  } catch (err) {
    return next(err);
  }
};

exports.createPromotion = async (req, res, next) => {
  let { promotionTitle, promotionSubTitle, promotionDescription } = req.body;

  const promotionImage = req.file ? req.file.path : null;

  try {
    if (!promotionTitle || !promotionImage || !promotionDescription) {
      return res
        .status(400)
        .json({ message: "Please provide all the required fields" });
    }

    await adminPromotionModel.create({
      promotionTitle,
      promotionSubTitle,
      image: promotionImage,
      promotionDescription,
    });

    return res.status(201).json({ message: "Promotion created successfully" });
  } catch (err) {
    return next(err);
  }
};

exports.getPromotionByID = async (req, res, next) => {
  const { id } = req.params;

  try {
    const promotionDoc = await adminPromotionModel.findById(id);

    if (!promotionDoc) {
      return res.status(404).json({ message: "Promotion not found" });
    }

    return res.status(200).json({ success: true, data: promotionDoc });
  } catch (err) {
    return next(err);
  }
};

exports.updatePromotion = async (req, res, next) => {
  const { id } = req.params;
  let { promotionTitle, promotionSubTitle, promotionDescription } = req.body;
  const promotionImage = req.file ? req.file.path : null;

  if (!promotionTitle || !promotionImage || !promotionDescription) {
    return res
      .status(400)
      .json({ message: "Please provide all the required fields" });
  }

  try {
    const promotionDoc = await adminPromotionModel.findById(id);

    if (!promotionDoc) {
      return res.status(404).json({ message: "Promotion not found" });
    }

    promotionDoc.promotionTitle = promotionTitle;
    promotionDoc.promotionSubTitle = promotionSubTitle;
    promotionDoc.promotionDescription = promotionDescription;

    if (promotionImage) {
      if (promotionDoc.image) {
        unlink(promotionDoc.image);
      }
      promotionDoc.image = promotionImage.path;
    }

    await promotionDoc.save();

    return res.status(200).json({ message: "Promotion updated successfully" });
  } catch (err) {
    return next(err);
  }
};

exports.deletePromotion = async (req, res, next) => {
  const { id } = req.params;

  try {
    const deletePromotionDoc = await adminPromotionModel.findByIdAndUpdate(
      { _id: id },
      { isDeleted: true }
    );

    if (!deletePromotionDoc) {
      return res.status(404).json({ message: "Promotion not found" });
    }

    return res.status(200).json({ message: "Promotion deleted successfully" });
  } catch (error) {
    return res.status(500).json({ error: true, message: error.message });
  }
};
