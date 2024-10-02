const treatmentVoucher = require("../models/treatmentVoucher");

const FilterTreatmentInVoucherLists = async (treatmentName) => {
  let query = {
    isDeleted: false,
  };

  if (treatmentName) {
    query["treatment.name"] = treatmentName;
  }

  const treatmentListDocs = await treatmentVoucher.aggregate([
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
        as: "treatment",
      },
    },

    {
      $match: treatmentName ? { "treatment.name": treatmentName } : {},
    },

    {
      $project: {
        _id: 1,
        code: 1,
        treatmentName: "$treatment.name",
        treatmentSellingPrice: "$multiTreatment.sellingPrice",
        buyableWithPoint: "$treatment.buyableWithPoint",
        deduct_point: "$treatment.deduct_point",
        treatmentTimes: "$treatment.treatmentTimes",
        discount: "$treatment.discount",
        description: "$treatment.description",
        status: "$treatment.status",
      },
    },
  ]);

  return treatmentListDocs;
};

module.exports = FilterTreatmentInVoucherLists;
