"use strict";

const User = require("../models/user");
const jwt = require("jsonwebtoken");
const CONFIG = require("../../config/db");
const patient = require("../models/patient");
const {
  comparePassword,
  generateToken,
} = require("../helper/passwordDecryptAndEncryptHelper");

exports.patientLogin = async (req, res) => {
  try {
    patient.findOne(
      { phone: req.body.phone, walletUser: true },
      function (err, patient) {
        if (err) {
          return res.status(500).send({
            success: false,
            message: "Error on the server",
          });
        }

        if (!patient) {
          return res.status(404).send({
            success: false,
            message: "No patient found",
          });
        }
        //response after compare state
        comparePassword(req.body.password, patient.password).then((match) => {
          if (!match)
            return res
              .status(401)
              .send({ success: false, message: "Wrong Password" });
          const token = generateToken(patient.id, patient.name, patient.email);
          patient.password = null;
          const response = {
            token: token,
            patient: patient,
          };
          return res.status(200).send({ success: true, data: response });
        });
      }
    );
  } catch (err) {
    console.log("Error: ", err.message);
  }
};

exports.login = (req, res) => {
  try {
    User.findOne({ email: req.body.email }, function (err, user) {
      if (err) {
        return res.status(500).send({
          error: true,
          message: "Error on the server",
        });
      }

      if (!user) {
        return res.status(404).send({
          error: true,
          message: "No user found",
        });
      }

      user.comparePassword(req.body.password, function (err, user, reason) {
        if (user && user.isDeleted === true) {
          return res.status(403).send({
            error: true,
            message:
              "This account is deactivated. Pls contact an admin to activate it again",
          });
        }
        if (user && user.emailVerify === false) {
          return res.status(403).send({
            error: true,
            message:
              "Your email is not confirmed yet.Please confirm from your email.",
          });
        }
        if (user && user.isDeleted === false) {
          var token = jwt.sign(
            { credentials: `${user._id}.${CONFIG.jwtKey}.${user.email}` },
            CONFIG.jwtSecret,
            { expiresIn: CONFIG.defaultPasswordExpire }
          );
          const credentials = {
            id: user._id,

            isAdmin: user.isAdmin,
            isUser: user.isUser,
            isDoctor: user.isDoctor,
            token: token,
            user: {
              role: user.accRole,
              name: user.givenName,
              email: user.email,
              phone: user.phone,
            },
          };
          if (
            (user.createdBy && !user.lastLoginTime) ||
            user.status === "ARCHIVE"
          ) {
            credentials["firstTimeLogin"] = true;
          }
          user.lastLoginTime = new Date();
          user.save();
          return res.status(200).send(credentials);
        }

        // otherwise we can determine why we failed
        var reasons = User.failedLogin;
        switch (reason) {
          case reasons.NOT_FOUND:
            return res.status(404).send({
              error: true,
              message: "No user found",
            });
          case reasons.PASSWORD_INCORRECT:
            // note: these cases are usually treated the same - don't tell
            // the user *why* the login failed, only that it did
            return res.status(401).send({
              error: true,
              message: "Wrong Password.",
            });
          case reasons.MAX_ATTEMPTS:
            // send email or otherwise notify user that account is
            // temporarily locked
            return res.status(429).send({
              error: true,
              message:
                "Too Many Request. Your account is locked. Please try again after 30 minutes.",
            });
        }
      });
    });
  } catch (error) {
    console.log(error);
  }
};

exports.logout = async (req, res) => {
  res.status(200).send({ auth: false });
};
