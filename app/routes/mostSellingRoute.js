"use strict";

const { catchError } = require("../lib/errorHandler");
const verifyToken = require("../lib/verifyToken");
const {
  topMostSellingTreatmentLists,
} = require("../controllers/topMostSellingLists");

module.exports = (app) => {
  app
    .route("/api/most-selling-treatment")
    .get(catchError(topMostSellingTreatmentLists));
};
