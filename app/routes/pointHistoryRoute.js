"use strict";

const {
  listAllPointHistories,
} = require("../controllers/pointHistoryController");
const verifyToken = require("../lib/verifyToken");

module.exports = (app) => {
  app.route("/api/point-histories").get(verifyToken, listAllPointHistories);
};
