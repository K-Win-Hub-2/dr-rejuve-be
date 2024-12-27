const TreatmentVoucherModel = require("../models/treatmentVoucher");
const mongoose = require("mongoose");

const getYearlyIncome = async (req, res) => {
  try {
    const { year, tsType, doctorID } = req.query;

    if (!year) {
      return res.status(400).json({ error: "Year is required." });
    }

    if (!tsType || !["TSMulti", "MS"].includes(tsType)) {
      return res
        .status(400)
        .json({ error: "Invalid tsType. Must be either 'TSMulti' or 'MS'." });
    }

    const incomeByMonth = [];

    for (let month = 1; month <= 12; month++) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const matchStage = {
        isDeleted: false,
        createdAt: { $gte: startDate, $lte: endDate },
        tsType: tsType,
      };

      if (tsType === "TSMulti" && doctorID) {
        matchStage.relatedDoctor = mongoose.Types.ObjectId(doctorID);
      }

      const treatmentVouchers = await TreatmentVoucherModel.aggregate([
        { $match: matchStage },
        {
          $project: {
            totalAmount: 1,
            totalDiscount: 1,
            multiTreatment: 1,
            medicineItems: 1,
          },
        },
        {
          $addFields: {
            totalSale: {
              $cond: {
                if: { $eq: [tsType, "TSMulti"] },
                then: { $sum: "$multiTreatment.price" },
                else: { $sum: "$medicineItems.price" },
              },
            },
            totalDiscount: {
              $cond: {
                if: { $eq: [tsType, "TSMulti"] },
                then: { $sum: "$multiTreatment.discountAmount" },
                else: { $sum: "$medicineItems.discountAmount" },
              },
            },
            netSale: {
              $subtract: [
                {
                  $cond: {
                    if: { $eq: [tsType, "TSMulti"] },
                    then: { $sum: "$multiTreatment.price" },
                    else: { $sum: "$medicineItems.price" },
                  },
                },
                {
                  $cond: {
                    if: { $eq: [tsType, "TSMulti"] },
                    then: { $sum: "$multiTreatment.discountAmount" },
                    else: { $sum: "$medicineItems.discountAmount" },
                  },
                },
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: "$totalSale" },
            totalDiscounts: { $sum: "$totalDiscount" },
            netSales: { $sum: "$netSale" },
          },
        },
      ]);

      const result = treatmentVouchers.length
        ? treatmentVouchers[0]
        : { totalSales: 0, totalDiscounts: 0, netSales: 0 };

      incomeByMonth.push({
        month,
        ...result,
      });
    }

    res.status(200).json({
      success: true,
      message: `Income for ${year}`,
      year,
      incomeByMonth,
    });
  } catch (error) {
    console.error("Error calculating yearly income:", error);
    res.status(500).json({
      success: false,
      error: "An error occurred while calculating income.",
    });
  }
};

module.exports = { getYearlyIncome };
