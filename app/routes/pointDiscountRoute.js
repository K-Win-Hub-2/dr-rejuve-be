"use strict"

const { listAllData, createData, dataById, updateDataById, deleteDataById } = require("../controllers/controller");
const { catchError } = require("../lib/errorHandler");
const verifyToken = require('../lib/verifyToken')

module.exports = (app) => {
    
    app.route('/api/v1/point-discount-rule')
        .get(listAllData)
        .post(catchError(createData))

        
    app.route('/api/v1/point-discount-rule/:id')
        .get(catchError(dataById)) 
        .put(catchError(updateDataById))
        .delete(catchError(deleteDataById))

};
