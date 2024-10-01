"use strict";

const adminPromotionController = require("../controllers/adminPromationCreate");
const { catchError } = require("../lib/errorHandler");

module.exports = (app) => {
  app
    .route("/api/adminPromotion-create")
    .post(catchError(adminPromotionController.createPromotion));

  app
    .route("/api/adminPromotion-update/:id")
    .put(catchError(adminPromotionController.updatePromotion));

  app
    .route("/api/adminPromotion-delete/:id")
    .delete(catchError(adminPromotionController.deletePromotion));

  app
    .route("/api/adminPromotion-lists")
    .get(catchError(adminPromotionController.getAllPromotions));

  app
    .route("/api/adminPromotion-list/:id")
    .get(catchError(adminPromotionController.getPromotionByID));
};
