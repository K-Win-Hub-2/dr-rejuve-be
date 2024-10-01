"use strict"
const { createTier, tierById, updateTierById, listTier, deleteTierById } = require("../controllers/tierController");
const { catchError } = require("../lib/errorHandler");
const verifyToken = require('../lib/verifyToken');

module.exports = (app) => {

    app.route('/api/tier')
        .post( catchError(createTier))
        
    app.route('/api/tier/:id')
        .get(verifyToken, catchError(tierById))
        .put(catchError(updateTierById))
        .delete(catchError(deleteTierById))

    app.route('/api/tiers').get(listTier)
};
