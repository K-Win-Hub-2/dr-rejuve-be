const treatmentVoucher = require("../models/treatmentVoucher");

const topMostSellingTreatment = async (startDate, endDate) => {
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
      $group: {
        _id: "$multiTreatment.item_id",
        saleCount: { $sum: 1 },
      },
    },

    { $sort: { saleCount: -1 } },

    {
      $limit: 10,
    },

    {
      $lookup: {
        from: "treatments",
        localField: "_id", // Field from multiTreatment (item_id)
        foreignField: "_id",
        as: "treatmentDetails",
      },
    },

    { $unwind: "$treatmentDetails" },

    {
      $project: {
        _id: 1,
        saleCount: 1,
        "treatmentDetails.name": 1,
      },
    },
  ]);

  console.log("treatmentListsDoc", treatmentListsDoc);
  return treatmentListsDoc;
};

module.exports = topMostSellingTreatment;
