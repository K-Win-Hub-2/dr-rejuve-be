const TreatmentVoucherModel = require("../models/treatmentVoucher");

const getTopCustomerDetails = async (startDate, endDate) => {
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);
  endDateObj.setHours(23, 59, 59, 999);

  const matchStage = {
    isDeleted: false,
    createdAt: { $gte: startDateObj, $lte: endDateObj },
    tsType: { $in: ["TSMulti", "MS"] },
  };

  const topCustomerData = await TreatmentVoucherModel.aggregate([
    { $match: matchStage },

    {
      $group: {
        _id: "$relatedPatient",
        totalSpent: { $sum: "$totalPaidAmount" },
      },
    },

    { $sort: { totalSpent: -1 } },

    { $limit: 1 },

    {
      $lookup: {
        from: "patients",
        localField: "_id",
        foreignField: "_id",
        as: "customerDetails",
      },
    },

    { $unwind: "$customerDetails" },

    {
      $lookup: {
        from: "treatmentvouchers",
        let: { customerId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$relatedPatient", "$$customerId"] } } },
          { $match: { tsType: "MS" } },
          { $sort: { totalPaidAmount: -1 } },
          { $limit: 1 },
        ],
        as: "highestMedicineVoucher",
      },
    },

    {
      $lookup: {
        from: "treatmentvouchers",
        let: { customerId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$relatedPatient", "$$customerId"] } } },
          { $match: { tsType: "TSMulti" } },
          { $sort: { totalPaidAmount: -1 } },
          { $limit: 1 },
        ],
        as: "highestTreatmentVoucher",
      },
    },

    {
      $project: {
        _id: 0,
        customer: "$customerDetails",
        medicine: {
          voucherCode: { $arrayElemAt: ["$highestMedicineVoucher.code", 0] },
          paidAmount: {
            $arrayElemAt: ["$highestMedicineVoucher.msPaidAmount", 0],
          },
        },
        treatment: {
          voucherCode: { $arrayElemAt: ["$highestTreatmentVoucher.code", 0] },
          paidAmount: {
            $arrayElemAt: ["$highestTreatmentVoucher.totalPaidAmount", 0],
          },
        },
      },
    },
  ]);

  return topCustomerData.length > 0 ? topCustomerData[0] : null;
};

module.exports = {
  getTopCustomerDetails,
};
