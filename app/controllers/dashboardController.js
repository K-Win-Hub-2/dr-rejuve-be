const { getTop10Treatment } = require("../dashboard/top10Treatment");
const { getTop10Medicine } = require("../dashboard/top10Medicine");
const { getTop10Customers } = require("../dashboard/top10Customer");
const {
  getDoctorServiceDelivery,
} = require("../dashboard/doctorServiceDelivery");
const { getCustomerVisitsByTsType } = require("../dashboard/customerVists");
const { getTopCustomerDetails } = require("../dashboard/topOneCustomer");

exports.getTop10TreatmentForDashBoard = async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      message: "Please provide startDate and endDate",
    });
  }

  try {
    const treatments = await getTop10Treatment(startDate, endDate);

    return res.status(200).json({
      success: true,
      message: "Here's the Top 10 Treatment List",
      data: treatments,
    });
  } catch (err) {
    console.error("Error fetching top 10 treatments:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve the Top 10 Treatment List",
      error: err.message || "An unexpected error occurred",
    });
  }
};

exports.getTop10MedicineForDashBoard = async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      message: "Please provide startDate and endDate",
    });
  }

  try {
    const medicines = await getTop10Medicine(startDate, endDate);

    return res.status(200).json({
      success: true,
      message: "Here's the Top 10 Medicine Lists",
      data: medicines,
    });
  } catch (error) {
    console.error("Error fetching top 10 medicine", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve the Top 10 Medicine List",
      error: error.message || "An unexpected error occurred",
    });
  }
};

exports.getTop10CustomerForDashBoard = async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      message: "Please provide startDate and endDate",
    });
  }

  try {
    const customers = await getTop10Customers(startDate, endDate);

    return res.status(200).json({
      success: true,
      message: "Here's the Top 10 Customers List",
      data: customers,
    });
  } catch (error) {
    console.error("Error fetching top 10 customers", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve the Top 10 Customers List",
      error: error.message || "An unexpected error occurred",
    });
  }
};

exports.getDoctorServiceDeliveryForDashBoard = async (req, res) => {
  const { startDate, endDate, doctorId } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      message: "Please provide startDate and endDate",
    });
  }

  try {
    const serviceDelivery = await getDoctorServiceDelivery(
      startDate,
      endDate,
      doctorId
    );

    return res.status(200).json({
      success: true,
      message: "Here's the Doctor Service Delivery",
      data: serviceDelivery,
    });
  } catch (error) {
    console.error("Error fetching doctor service delivery", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve the Doctor Service Delivery",
      error: error.message || "An unexpected error occurred",
    });
  }
};

exports.getCustomerVisitsForDashBoard = async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      message: "Please provide startDate and endDate",
    });
  }

  try {
    const customerVisit = await getCustomerVisitsByTsType(startDate, endDate);

    return res.status(200).json({
      success: true,
      message: "Here's the Customer Vists",
      data: customerVisit,
    });
  } catch (error) {
    console.error("Error fetching customer vists", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve the Customer Vists",
      error: error.message || "An unexpected error occurred",
    });
  }
};

exports.getTopOneCustomerForDashBoard = async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      message: "Please provide startDate and endDate",
    });
  }

  try {
    const topCustomer = await getTopCustomerDetails(startDate, endDate);

    return res.status(200).json({
      success: true,
      message: "Here's the Top Customer",
      data: topCustomer,
    });
  } catch (error) {
    console.error("Error fetching top customer", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve the Top Customer",
      error: error.message || "An unexpected error occurred",
    });
  }
};
