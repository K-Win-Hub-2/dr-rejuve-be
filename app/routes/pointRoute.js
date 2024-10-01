"use strict"

const { createPoint, updatePointById, pointById, listAllPointModel } = require("../controllers/pointController");
const { CalculateAndPointToUserWithPointRule } = require("../helper/pointHelper");
const { catchError } = require("../lib/errorHandler");
const verifyToken = require('../lib/verifyToken');

module.exports = (app) => {

    app.route('/api/point')
        .post(catchError(createPoint))
        
    app.route('/api/point/:id')
        .get(verifyToken, catchError(pointById)) 
        .put(catchError(updatePointById))

    app.route('/api/points').get(verifyToken, listAllPointModel)

    app.route("/api/point/add/patient").post(CalculateAndPointToUserWithPointRule)
};
