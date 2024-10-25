"use strict";

const PatientModels = require("../models/patient");

exports.patientFilter = async (name, phone) => {
  let query = {
    isDeleted: false,
  };

  if (name) {
    query.name = new RegExp(name, "i");
  }

  if (phone) {
    query.phone = new RegExp(phone, "i");
  }

  const patients = await PatientModels.aggregate([
    {
      $match: query,
    },

    {
      $lookup: {
        from: "tierlevels",
        localField: "tierLevel",
        foreignField: "_id",
        as: "tierLevelDetails",
      },
    },

    {
      $unwind: {
        path: "$tierLevelDetails",
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $project: {
        patiendData: "$$ROOT",
        tierLevelDetails: 1,
      },
    },
  ]);

  return patients;
};
