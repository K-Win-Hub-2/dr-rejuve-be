const topMostSellingTreatment = require("../lib/topMostSellingList");

exports.topMostSellingTreatmentLists = async (req, res) => {
  let { startDate, endDate, treatmentName } = req.query;

  try {
    const sellingDoc = await topMostSellingTreatment(
      treatmentName,
      startDate,
      endDate
    );

    res.status(200).json({
      status: "success",
      data: sellingDoc,
    });
  } catch (error) {
    console.error("Error in topMostSellingTreatmentLists", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};
