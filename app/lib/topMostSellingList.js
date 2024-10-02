const treatmentVoucher = require("../models/treatmentVoucher");

const topMostSellingTreatment = async (name, startDate, endDate) => {
  let query = {
    isDeleted: false,
    tsType: { $in: ["TSMulti", "TS"] },
  };

  if (startDate && endDate) {
    query.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  } else {
    let now = new Date();
    let firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    let lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    query.createdAt = {
      $gte: firstDayOfMonth,
      $lte: lastDayOfMonth,
    };
  }

  const treatmentListsDoc = await treatmentVoucher.aggregate([
    {
      $match: query,
    },
    {
      $unwind: "$multiTreatment",
    },
    {
      $lookup: {
        from: "treatments",
        localField: "multiTreatment.item_id",
        foreignField: "_id",
        as: "treatmentDetails",
      },
    },
    { $unwind: "$treatmentDetails" },

    {
      $lookup: {
        from: "treatmentlists",
        localField: "treatmentDetails.treatmentName",
        foreignField: "_id",
        as: "treatmentListDetails",
      },
    },
    { $unwind: "$treatmentListDetails" },

    ...(name
      ? [
          {
            $match: {
              "treatmentListDetails.name": {
                $regex: new RegExp(name, "i"),
              },
            },
          },
        ]
      : []),

    {
      $group: {
        _id: "$multiTreatment.item_id",
        totalPaidAmount: { $sum: "$totalPaidAmount" },
        totalDiscountAmount: { $sum: "$totalDiscount" },
        saleCount: { $sum: 1 },
        treatmentName: { $first: "$treatmentDetails.name" },
        treatmentListName: { $first: "$treatmentListDetails.name" },
      },
    },
    { $sort: { saleCount: -1 } },
    { $limit: 10 },

    {
      $project: {
        _id: 1,
        treatmentName: 1,
        treatmentListName: 1,
        saleCount: 1,
        totalPaidAmount: 1,
        totalDiscountAmount: 1,
      },
    },

    {
      $group: {
        _id: null,
        treatments: { $push: "$$ROOT" },
        grandTotalPaidAmount: { $sum: "$totalPaidAmount" },
        grandTotalDiscountAmount: { $sum: "$totalDiscountAmount" },
      },
    },
  ]);

  return treatmentListsDoc;
};

module.exports = topMostSellingTreatment;
