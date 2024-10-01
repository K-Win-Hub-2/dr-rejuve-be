const topMostSellingTreatment = require("../lib/topMostSellingList");

exports.topMostSellingTreatmentLists = async (req, res) => {
  let { startDate, endDate } = req.query;

  try {
    const sellingDoc = await topMostSellingTreatment(
      (startDate = null),
      (endDate = null)
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
