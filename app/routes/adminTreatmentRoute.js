"use strict";

const adminTreatmentController = require("../controllers/adminTreatmentController");
const { catchError } = require("../lib/errorHandler");
const upload = require("../lib/ImageUploadConfig");
const verifyToken = require("../lib/verifyToken");

module.exports = (app) => {
  app
    .route("/api/adminTreatment-create")
    .post(
      verifyToken,
      upload.any(),
      catchError(adminTreatmentController.createTreatment)
    );

  app.get(
    "/api/adminTreatments",
    catchError(adminTreatmentController.getAllTreatment)
  );

  app
    .route("/api/adminTreatment/:id")
    .get(catchError(adminTreatmentController.getTreatmentByID));

  app.get(
    "/api/get-all-treatments",
    catchError(adminTreatmentController.getALLMainTreatment)
  );

  app
    .route("/api/adminTreatment-update/:id")
    .put(
      verifyToken,
      upload.any(),
      catchError(adminTreatmentController.updateTreatment)
    );

  app
    .route("/api/adminTreatment-delete/:id")
    .delete(verifyToken, catchError(adminTreatmentController.deleteTreatment));
};
