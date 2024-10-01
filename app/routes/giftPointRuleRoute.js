"use strict"

const { listAllData, createData, dataById, updateDataById, deleteDataById } = require("../controllers/controller");
const { catchError } = require("../lib/errorHandler");
const verifyToken = require('../lib/verifyToken')

module.exports = (app) => {
    
    app.route('/api/v1/gift-point')
        .get(listAllData)
        .post(catchError(createData))

        
    app.route('/api/v1/gift-point/:id')
        .get(catchError(dataById)) 
        .put(catchError(updateDataById))
        .delete(catchError(deleteDataById))

};
