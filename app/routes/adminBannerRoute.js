"use strict";

const adminBanner = require("../controllers/adminBannerController");
const { catchError } = require("../lib/errorHandler");
const verifyToken = require("../lib/verifyToken");

module.exports = (app) => {
  app
    .route("/api/adminBanner-create")
    .post(catchError(adminBanner.createAdminBanner));

  app
    .route("/api/adminBanner-update/:id")
    .put(catchError(adminBanner.updateAdminBanner));

  app
    .route("/api/adminBanner-lists")
    .get(catchError(adminBanner.listAllAdminBanner));

  app
    .route("/api/adminBanner-list/:id")
    .get(catchError(adminBanner.getAdminBannerByID));

  app
    .route("/api/adminBanner-delete/:id")
    .delete(catchError(adminBanner.deleteAdminBanner));
};
