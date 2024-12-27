const TreatmentVoucherModel = require("../models/treatmentVoucher");

const getTop10Medicine = async (startDate, endDate) => {
  const topMedicine = await TreatmentVoucherModel.aggregate([
    {
      $match: {
        isDeleted: false,
        createdAt: {
          $gte: new Date(new Date(startDate).setUTCHours(0, 0, 0, 0)),
          $lte: new Date(new Date(endDate).setUTCHours(23, 59, 59, 999)),
        },
        "medicineItems.item_id": { $exists: true },
      },
    },
    { $unwind: "$medicineItems" },
    {
      $group: {
        _id: "$medicineItems.item_id",
        qty: { $sum: "$medicineItems.qty" },
      },
    },
    { $sort: { qty: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: "medicineitems",
        localField: "_id",
        foreignField: "_id",
        as: "medicineDetails",
      },
    },
    { $unwind: "$medicineDetails" },
    {
      $project: {
        name: "$medicineDetails.medicineItemName",
        qty: 1,
      },
    },
  ]);

  return topMedicine;
};

module.exports = {
  getTop10Medicine,
};
