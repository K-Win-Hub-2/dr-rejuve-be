"use strict";

const adminBannerModel = require("../models/adminBannerModel");
const { unlink } = require("../lib/unlinkImage");

exports.createAdminBanner = async (req, res, next) => {
  const banner_image = req.file ? req.file.path : null;

  try {
    if (!banner_image) {
      return res
        .status(400)
        .json({ message: "Please provide all the required fields" });
    }

    await adminBannerModel.create({
      image: banner_image,
    });
  } catch (error) {
    return next(error);
  }
};

exports.updateAdminBanner = async (req, res, next) => {
  const { id } = req.params;
  const banner_image = req.file ? req.file.path : null;

  if (!banner_image) {
    return res
      .status(400)
      .json({ message: "Please provide all the required fields" });
  }

  try {
    const bannerDoc = await adminBannerModel.findById(id);

    if (!bannerDoc) {
      return res.status(404).json({ message: "Banner not found" });
    }

    if (banner_image) {
      if (bannerDoc.image) {
        unlink(bannerDoc.image);
      }

      bannerDoc.image = banner_image.path;
    }

    await bannerDoc.save();

    return res.status(200).json({ message: "Banner updated successfully" });
  } catch (error) {
    return next(error);
  }
};

exports.listAllAdminBanner = async (req, res, next) => {
  let { page = 1, limit = 10 } = req.query;
  page = parseInt(page);
  limit = parseInt(limit);

  try {
    const TotalBanners = await adminBannerModel
      .find({ isDeleted: false })
      .countDocuments();

    const bannersDoc = await adminBannerModel.find({ isDeleted: false });

    const division = TotalBanners / limit;
    const totalPages = Math.ceil(division);

    return res.status(200).json({
      success: true,
      count: TotalBanners,
      _metadata: {
        current_page: page,
        per_page: limit,
        page_count: totalPages,
        total_count: TotalBanners,
      },
      list: bannersDoc,
    });
  } catch (err) {
    return next(err);
  }
};

exports.getAdminBannerByID = async (req, res, next) => {
  const { id } = req.params;
  try {
    const bannerDoc = await adminBannerModel.findById(id);
    if (!bannerDoc) {
      return res.status(404).json({ message: "Banner not found" });
    }

    return res.status(200).json({ success: true, data: bannerDoc });
  } catch (err) {
    return next(err);
  }
};

exports.deleteAdminBanner = async (req, res, next) => {
  const { id } = req.params;

  try {
    const bannerDoc = await adminBannerModel.findById(id);
    if (!bannerDoc) {
      return res.status(404).json({ message: "Banner not found" });
    }

    bannerDoc.isDeleted = true;
    await bannerDoc.save();

    return res.status(200).json({ message: "Banner deleted successfully" });
  } catch (err) {
    return next(err);
  }
};
