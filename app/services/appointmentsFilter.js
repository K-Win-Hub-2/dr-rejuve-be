"use strict";

const appointmentModels = require("../models/appointment");

const AppointmentsFilter = async (
  startDate,
  endDate,
  doctorName,
  voucherCode,
  treatmentName
) => {
  console.log(
    "Filters -> doctorName:",
    doctorName,
    "voucherCode:",
    voucherCode,
    "treatmentName:",
    treatmentName
  );

  let query = {
    isDeleted: false,
  };

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      query.createdAt = {
        $gte: start,
        $lte: end,
      };
    } else {
      console.error("Invalid date format for startDate or endDate");
    }
  }

  if (treatmentName) {
    query["treatmentOnly.name"] = new RegExp(treatmentName, "i");
  } else {
    delete query["treatmentOnly.name"];
  }

  console.log("Final Query: ", JSON.stringify(query, null, 2));

  const appointments = await appointmentModels.aggregate([
    {
      $match: query,
    },

    {
      $lookup: {
        from: "patients",
        localField: "relatedPatient",
        foreignField: "_id",
        as: "patientDetails",
      },
    },

    {
      $unwind: "$patientDetails",
    },

    {
      $match: {
        "patientDetails.isDeleted": false,
      },
    },

    {
      $lookup: {
        from: "doctors",
        localField: "relatedDoctor",
        foreignField: "_id",
        as: "doctorDetails",
      },
    },

    {
      $unwind: {
        path: "$doctorDetails",
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $match: {
        "doctorDetails.isDeleted": false,
      },
    },

    ...(doctorName
      ? [
          {
            $match: {
              "doctorDetails.name": new RegExp(doctorName, "i"),
            },
          },
        ]
      : []),

    {
      $lookup: {
        from: "treatments",
        localField: "relatedTreatment",
        foreignField: "_id",
        as: "treatmentOnly",
      },
    },

    {
      $unwind: "$treatmentOnly",
    },

    {
      $match: {
        "treatmentOnly.isDeleted": false,
      },
    },

    {
      $match: treatmentName
        ? { "treatmentOnly.name": new RegExp(treatmentName, "i") }
        : {},
    },

    {
      $lookup: {
        from: "treatmentselections",
        localField: "relatedTreatmentSelection",
        foreignField: "_id",
        as: "treatmentDetails",
      },
    },

    {
      $unwind: "$treatmentDetails",
    },

    {
      $match: {
        "treatmentDetails.isDeleted": false,
      },
    },

    {
      $match: {
        "treatmentDetails.VoucherCode": voucherCode
          ? new RegExp(voucherCode, "i")
          : /.*/,
      },
    },

    {
      $project: {
        createdAt: 1,
        "patientDetails._id": 1,
        "patientDetails.name": 1,
        "patientDetails.age": 1,
        "patientDetails.phone": 1,
        "patientDetails.email": 1,
        "patientDetails.gender": 1,
        "patientDetails.address": 1,
        "patientDetails.patientStatus": 1,
        "patientDetails.patientID": 1,
        "patientDetails.totalAppointments": 1,
        "patientDetails.finishedAppointments": 1,
        "patientDetails.unfinishedAppointments": 1,
        "patientDetails.totalTS": 1,
        "patientDetails.debtBalance": 1,
        "patientDetails.walletUser": 1,
        "doctorDetails._id": 1,
        "doctorDetails.name": 1,
        "doctorDetails.speciality": 1,
        "doctorDetails.treatmentUnitMain": 1,
        treatmentDetails: 1,
        "treatmentOnly._id": 1,
        "treatmentOnly.name": 1,
        "treatmentOnly.estimateTotalPrice": 1,
        "treatmentOnly.relatedDoctor": 1,
        "treatmentOnly.buyableWithPoint": 1,
      },
    },
  ]);

  return appointments;
};

module.exports = AppointmentsFilter;
