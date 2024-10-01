const { default: mongoose } = require("mongoose");
const pointHistory = require("../models/pointHistory");

exports.createPointHistory = async (data) => {
  try {
    let pointData = {
      type: data.type,
      relatedPatient: data.relatedPatient,
      relatedTreatment: data.relatedTreatment || null,
      relatedTreatmentVoucher: data.relatedTreatmentVoucher,
      discountPercent: data.discountPercent,
      realTotalAmount: data.realTotalAmount,
      discountTotalAmount: data.discountTotalAmount,
      point: data.point,
    };
    await pointHistory.create(pointData);
  } catch (err) {
    console.log("Error is", err.message);
  }
};

exports.getPointHistory = async (data) => {
  try {
    let { t, p, startDate, endDate, minPoint, maxPoint } = data;
    let query = {};

    if (p) {
      query["relatedPatient"] = mongoose.Types.ObjectId(p);
    }

    if (t) {
      query["relatedTreatment"] = t;
    }

    if (startDate && endDate) {
      const startDay = new Date(startDate);
      startDay.setHours(0, 0, 0, 0);
      const endDay = new Date(endDate);
      endDay.setHours(23, 59, 59, 999);

      query["date"] = { $gte: startDay, $lte: endDay };
    }

    if (minPoint && maxPoint) {
      minPoint = parseInt(minPoint);
      maxPoint = parseInt(maxPoint);

      query["point"] = { $gte: minPoint, $lte: maxPoint };
    }

    query["isDeleted"] = false;

    let pointHistoryData = await pointHistory
      .find(query)
      .populate("relatedTreatment relatedTreatmentVoucher relatedPatient")
      .sort({ createdAt: -1 })
      .exec();

    console.log("pointHistoryData", pointHistoryData);

    return pointHistoryData;
  } catch (err) {
    console.log("Error is", err.message);
  }
};
