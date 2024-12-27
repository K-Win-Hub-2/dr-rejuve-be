const TreatmentVoucherModel = require("../models/treatmentVoucher");
const mongoose = require("mongoose");

const getTop10Customers = async (startDate, endDate) => {
  const topCustomers = await TreatmentVoucherModel.aggregate([
    {
      $match: {
        isDeleted: false,
        createdAt: {
          $gte: new Date(new Date(startDate).setUTCHours(0, 0, 0, 0)),
          $lte: new Date(new Date(endDate).setUTCHours(23, 59, 59, 999)),
        },
        totalPaidAmount: { $gt: 0 },
        relatedPatient: { $exists: true },
        relatedPatient: {
          $ne: mongoose.Types.ObjectId("668eb36c16f45110e3ddaa9c"),
        },
      },
    },
    {
      $group: {
        _id: "$relatedPatient",
        totalSpent: { $sum: "$totalPaidAmount" },
      },
    },
    { $sort: { totalSpent: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: "patients",
        localField: "_id",
        foreignField: "_id",
        as: "customerDetails",
      },
    },
    {
      $unwind: "$customerDetails",
    },
    {
      $project: {
        name: "$customerDetails.name",
        totalSpent: "$totalSpent",
      },
    },
  ]);

  return topCustomers;
};

module.exports = {
  getTop10Customers,
};
