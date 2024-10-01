'use strict';

const auth = require('../controllers/authController');
const verifyToken = require('../lib/verifyToken');
const { catchError } = require('../lib/errorHandler');
const { verifyDoctor } = require("../controllers/verifyDoctorController");
const treatmentVoucher = require("../controllers/treatmentVoucherController");

module.exports = app => {
       
      //verify doctor
      app.route('/api/login/doctor/verfiy')
       .post( verifyToken, verifyDoctor ,catchError( treatmentVoucher.getTreatmentVoucherByDoctorId))

       app.route('/api/auth/login').post(auth.login);

       app.route("/api/v1/auth/login").post(auth.patientLogin)

       app.route('/api/auth/logout').get(verifyToken, catchError(auth.logout));
};
