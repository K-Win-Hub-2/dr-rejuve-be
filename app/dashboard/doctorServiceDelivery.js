const mongoose = require("mongoose");
const TreatmentVoucherModel = require("../models/treatmentVoucher");

// const getDoctorServiceDelivery = async (startDate, endDate, doctorID) => {
//   const startDateObj = new Date(startDate);
//   const endDateObj = new Date(endDate);
//   endDateObj.setHours(23, 59, 59, 999);

//   const matchStage = {
//     isDeleted: false,
//     createdAt: { $gte: startDateObj, $lte: endDateObj },
//   };

//   if (doctorID) {
//     matchStage.relatedDoctor = mongoose.Types.ObjectId(doctorID);
//   } else {
//     matchStage.relatedDoctor = { $ne: null };
//   }

//   const doctorServiceData = await TreatmentVoucherModel.aggregate([
//     {
//       $match: matchStage,
//     },
//     {
//       $lookup: {
//         from: "treatmentselections",
//         localField: "_id",
//         foreignField: "relatedTreatmentVoucher",
//         as: "treatmentSelections",
//       },
//     },
//     {
//       $lookup: {
//         from: "appointments",
//         localField: "_id",
//         foreignField: "relatedTreatmentSelection",
//         as: "appointments",
//       },
//     },
//     {
//       $addFields: {
//         month: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
//       },
//     },
//     {
//       $group: {
//         _id: {
//           doctor: "$relatedDoctor",
//           month: "$month",
//         },
//         total_treatment: { $sum: 1 },
//         finished_treatment: {
//           $sum: {
//             $add: [
//               {
//                 $size: {
//                   $filter: {
//                     input: "$treatmentSelections",
//                     cond: { $eq: ["$$this.selectionStatus", "Done"] },
//                   },
//                 },
//               },
//               {
//                 $size: {
//                   $filter: {
//                     input: "$appointments",
//                     cond: { $eq: ["$$this.usageStatus", "Finished"] },
//                   },
//                 },
//               },
//             ],
//           },
//         },
//         unfinished_treatment: {
//           $sum: {
//             $add: [
//               {
//                 $size: {
//                   $filter: {
//                     input: "$treatmentSelections",
//                     cond: { $eq: ["$$this.selectionStatus", "Ongoing"] },
//                   },
//                 },
//               },
//               {
//                 $size: {
//                   $filter: {
//                     input: "$appointments",
//                     cond: { $ne: ["$$this.usageStatus", "Finished"] },
//                   },
//                 },
//               },
//             ],
//           },
//         },
//       },
//     },
//     {
//       $lookup: {
//         from: "doctors",
//         localField: "_id.doctor",
//         foreignField: "_id",
//         as: "doctorDetails",
//       },
//     },
//     {
//       $unwind: {
//         path: "$doctorDetails",
//         preserveNullAndEmptyArrays: false,
//       },
//     },
//     {
//       $group: {
//         _id: "$_id.doctor",
//         doctor_name: { $first: "$doctorDetails.name" },
//         monthly_data: {
//           $push: {
//             month: "$_id.month",
//             total_treatment: "$total_treatment",
//             finished_treatment: "$finished_treatment",
//             unfinished_treatment: "$unfinished_treatment",
//           },
//         },
//       },
//     },
//   ]);

//   return doctorServiceData;
// };

const getDoctorServiceDelivery = async (startDate, endDate, doctorID) => {
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);
  endDateObj.setHours(23, 59, 59, 999);

  const matchStage = {
    isDeleted: false,
    createdAt: { $gte: startDateObj, $lte: endDateObj },
  };

  if (doctorID) {
    matchStage.relatedDoctor = mongoose.Types.ObjectId(doctorID);
  } else {
    matchStage.relatedDoctor = { $ne: null };
  }

  const doctorServiceData = await TreatmentVoucherModel.aggregate([
    {
      $match: matchStage,
    },
    {
      $lookup: {
        from: "treatmentselections",
        localField: "_id",
        foreignField: "relatedTreatmentVoucher",
        as: "treatmentSelections",
      },
    },
    {
      $lookup: {
        from: "appointments",
        localField: "_id",
        foreignField: "relatedTreatmentSelection",
        as: "appointments",
      },
    },
    {
      $addFields: {
        month: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
      },
    },
    {
      $group: {
        _id: doctorID
          ? { doctor: "$relatedDoctor", month: "$month" }
          : { month: "$month" },
        total_treatment: { $sum: 1 },
        finished_treatment: {
          $sum: {
            $add: [
              {
                $size: {
                  $filter: {
                    input: "$treatmentSelections",
                    cond: { $eq: ["$$this.selectionStatus", "Done"] },
                  },
                },
              },
              {
                $size: {
                  $filter: {
                    input: "$appointments",
                    cond: { $eq: ["$$this.usageStatus", "Finished"] },
                  },
                },
              },
            ],
          },
        },
        unfinished_treatment: {
          $sum: {
            $add: [
              {
                $size: {
                  $filter: {
                    input: "$treatmentSelections",
                    cond: { $eq: ["$$this.selectionStatus", "Ongoing"] },
                  },
                },
              },
              {
                $size: {
                  $filter: {
                    input: "$appointments",
                    cond: { $ne: ["$$this.usageStatus", "Finished"] },
                  },
                },
              },
            ],
          },
        },
      },
    },
    ...(doctorID
      ? [
          {
            $lookup: {
              from: "doctors",
              localField: "_id.doctor",
              foreignField: "_id",
              as: "doctorDetails",
            },
          },
          {
            $unwind: "$doctorDetails",
          },
          {
            $group: {
              _id: "$_id.doctor",
              doctor_name: { $first: "$doctorDetails.name" },
              monthly_data: {
                $push: {
                  month: "$_id.month",
                  total_treatment: "$total_treatment",
                  finished_treatment: "$finished_treatment",
                  unfinished_treatment: "$unfinished_treatment",
                },
              },
            },
          },
        ]
      : [
          {
            $group: {
              _id: "$_id.month",
              total_treatment: { $sum: "$total_treatment" },
              finished_treatment: { $sum: "$finished_treatment" },
              unfinished_treatment: { $sum: "$unfinished_treatment" },
            },
          },
          {
            $project: {
              _id: 0,
              month: "$_id",
              total_treatment: 1,
              finished_treatment: 1,
              unfinished_treatment: 1,
            },
          },
          {
            $group: {
              _id: null,
              monthly_data: { $push: "$$ROOT" },
            },
          },
          {
            $project: {
              _id: 0,
              monthly_data: 1,
            },
          },
        ]),
  ]);

  return doctorServiceData;
};

module.exports = {
  getDoctorServiceDelivery,
};
