const TreatmentVoucherModel = require("../models/treatmentVoucher");

const getTop10Treatment = async (startDate, endDate) => {
  const topTreatments = await TreatmentVoucherModel.aggregate([
    {
      $match: {
        isDeleted: false,
        createdAt: {
          $gte: new Date(new Date(startDate).setUTCHours(0, 0, 0, 0)),
          $lte: new Date(new Date(endDate).setUTCHours(23, 59, 59, 999)),
        },
        "multiTreatment.item_id": { $exists: true },
      },
    },
    { $unwind: "$multiTreatment" },
    {
      $group: {
        _id: "$multiTreatment.item_id",
        qty: { $sum: "$multiTreatment.qty" },
      },
    },
    { $sort: { qty: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: "treatments",
        localField: "_id",
        foreignField: "_id",
        as: "treatmentDetails",
      },
    },
    { $unwind: "$treatmentDetails" },
    {
      $project: {
        name: "$treatmentDetails.name",
        qty: 1,
      },
    },
  ]);

  return topTreatments;
};

module.exports = {
  getTop10Treatment,
};
