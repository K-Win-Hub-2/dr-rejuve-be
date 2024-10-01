const { body } = require("express-validator")

exports.createPatientValidator = [
    body('email', 'Invalid does not Empty').not().isEmpty(),
    body('email', 'Invalid email').isEmail()
  ]
  