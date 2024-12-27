const TreatmentVoucherModel = require("../models/treatmentVoucher");

const getCustomerVisitsByTsType = async (startDate, endDate) => {
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);
  endDateObj.setHours(23, 59, 59, 999);

  const matchStage = {
    isDeleted: false,
    createdAt: { $gte: startDateObj, $lte: endDateObj },
    tsType: { $in: ["TSMulti", "MS"] },
  };

  const customerVisitData = await TreatmentVoucherModel.aggregate([
    {
      $match: matchStage,
    },
    {
      $addFields: {
        month: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
        category: {
          $cond: [{ $eq: ["$tsType", "TSMulti"] }, "treatment", "medicine"],
        },
      },
    },
    {
      $group: {
        _id: {
          month: "$month",
          category: "$category",
        },
        qty: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: "$_id.category",
        monthlyData: {
          $push: {
            month: "$_id.month",
            qty: "$qty",
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        type: "$_id",
        monthlyData: 1,
      },
    },
  ]);

  const response = {
    medicine: [],
    treatment: [],
  };

  customerVisitData.forEach((data) => {
    if (data.type === "medicine") {
      response.medicine = data.monthlyData;
    } else if (data.type === "treatment") {
      response.treatment = data.monthlyData;
    }
  });

  return response;
};

module.exports = {
  getCustomerVisitsByTsType,
};
