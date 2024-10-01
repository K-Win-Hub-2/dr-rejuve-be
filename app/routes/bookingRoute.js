"use strict";

const booking = require("../controllers/bookingController");
const { catchError } = require("../lib/errorHandler");
const verifyToken = require('../lib/verifyToken');

module.exports = (app) => {

    app.route('/api/v1/booking')
        .post(catchError(booking.createBooking))
        
    app.route('/api/v1/booking/:id')
        .get( catchError(booking.getBookingById))
        .delete( catchError(booking.deleteBooking)) 
        .put( catchError(booking.updateBookingById))
    app.route('/api/v1/bookings').get(catchError(booking.listAllBooking))
};
