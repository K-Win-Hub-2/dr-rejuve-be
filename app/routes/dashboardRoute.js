const {
  getTop10TreatmentForDashBoard,
  getTop10MedicineForDashBoard,
  getTop10CustomerForDashBoard,
  getDoctorServiceDeliveryForDashBoard,
  getCustomerVisitsForDashBoard,
  getTopOneCustomerForDashBoard,
} = require("../controllers/dashboardController");
const { getYearlyIncome } = require("../dashboard/monthlyIncome");
const { catchError } = require("../lib/errorHandler");

module.exports = (app) => {
  app
    .route("/api/dashboard/top-ten-treatments")
    .get(catchError(getTop10TreatmentForDashBoard));

  app
    .route("/api/dashboard/top-ten-medicines")
    .get(catchError(getTop10MedicineForDashBoard));

  app
    .route("/api/dashboard/top-ten-customers")
    .get(catchError(getTop10CustomerForDashBoard));

  app
    .route("/api/dashboard/doctor-service-delivery")
    .get(catchError(getDoctorServiceDeliveryForDashBoard));

  app
    .route("/api/dashboard/customer-visits")
    .get(catchError(getCustomerVisitsForDashBoard));

  app
    .route("/api/dashboard/top-one-customer")
    .get(catchError(getTopOneCustomerForDashBoard));

  app.route("/api/yearly-income").get(catchError(getYearlyIncome));
};
