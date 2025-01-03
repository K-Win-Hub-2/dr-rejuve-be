"use strict";
const TreatmentSelection = require("../models/treatmentSelection");
const Appointment = require("../models/appointment");
const Transaction = require("../models/transaction");
const Patient = require("../models/patient");
const TreatmentVoucher = require("../models/treatmentVoucher");
const Repay = require("../models/repayRecord");
const Accounting = require("../models/accountingList");
const Attachment = require("../models/attachment");
const AdvanceRecords = require("../models/advanceRecord");
const Treatment = require("../models/treatment");
const MedicineItems = require("../models/medicineItem");
const AccessoryItems = require("../models/accessoryItem");
const ProcedureItems = require("../models/procedureItem");
const treatment = require("../models/treatment");
const { sendEmail } = require("../lib/userUtil");
const config = require("../../config/db");
const { Buffer } = require("buffer");
const fs = require("fs");
const path = require("path");
const Debt = require("../models/debt");
const {
  deductSuccessOrFailure,
  deductPointFromPatient,
} = require("../services/pointDeduct");
const { createTS } = require("../services/treatmentVoucherService");
const {
  AddPointByInput,
  CalculateAndPointToUserWithPointRule,
  CalculateTotalAmountByPercent,
  CalculateWithExtraPoint,
} = require("../helper/pointHelper");

exports.getwithExactDate = async (req, res) => {
  try {
    let { exact } = req.query;
    const date = new Date(exact);
    const startDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    ); // Set start date to the beginning of the day
    const endDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate() + 1
    ); // Set end date to the beginning of the next day
    let result = await TreatmentVoucher.find({
      createdAt: { $gte: startDate, $lt: endDate },
    })
      .populate("createdBy relatedAppointment relatedPatient relatedCash")
      .populate({
        path: "relatedTreatment",
        model: "Treatments",
        populate: {
          path: "treatmentName",
          model: "TreatmentLists",
        },
      });
    //.populate('createdBy relatedTreatment relatedAppointment relatedPatient');
    if (result.length <= 0)
      return res.status(404).send({ error: true, message: "Not Found!" });
    return res.status(200).send({ success: true, data: result });
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.listMultiTreatmentSelections = async (req, res) => {
  let { keyword, role, limit, skip } = req.query;
  let count = 0;
  let page = 0;

  try {
    limit = +limit <= 100 ? +limit : 10; //limit
    skip = +skip || 0;
    let query = { isDeleted: false },
      regexKeyword;
    role ? (query["role"] = role.toUpperCase()) : "";
    keyword && /\w/.test(keyword)
      ? (regexKeyword = new RegExp(keyword, "i"))
      : "";
    query.tsType = "TSMulti";
    regexKeyword ? (query["name"] = regexKeyword) : "";
    let result = await TreatmentSelection.find(query)
      .populate(
        "createdBy relatedTreatmentList relatedAppointments relatedPatient finishedAppointments remainingAppointments relatedTransaction"
      )
      .populate({
        path: "relatedTreatment",
        model: "Treatments",
        populate: {
          path: "relatedDoctor",
          model: "Doctors",
        },
      });
    let count = await TreatmentSelection.find(query).count();
    const division = count / limit;
    page = Math.ceil(division);
    res.status(200).send({
      success: true,
      count: count,
      _metadata: {
        current_page: skip / limit + 1,
        per_page: limit,
        page_count: page,
        total_count: count,
      },
      list: result,
    });
  } catch (error) {
    return res.status(500).send({ error: true, message: "No Record Found!" });
  }
};

exports.listAllTreatmentSelections = async (req, res) => {
  let { keyword, role, limit, skip, tsType } = req.query;
  let count = 0;
  let page = 0;

  try {
    limit = +limit <= 100 ? +limit : 10; //limit
    skip = +skip || 0;
    let query = { isDeleted: false },
      regexKeyword;
    role ? (query["role"] = role.toUpperCase()) : "";
    keyword && /\w/.test(keyword)
      ? (regexKeyword = new RegExp(keyword, "i"))
      : "";
    regexKeyword ? (query["name"] = regexKeyword) : "";
    if (tsType) query.tsType = tsType;
    let result = await TreatmentSelection.find(query)
      .populate(
        "createdBy relatedTreatmentList relatedAppointments relatedPatient finishedAppointments remainingAppointments relatedTransaction"
      )
      .populate({
        path: "relatedTreatment",
        model: "Treatments",
        populate: {
          path: "relatedDoctor",
          model: "Doctors",
        },
      });
    let count = await TreatmentSelection.find(query).count();
    const division = count / limit;
    page = Math.ceil(division);
    res.status(200).send({
      success: true,
      count: count,
      _metadata: {
        current_page: skip / limit + 1,
        per_page: limit,
        page_count: page,
        total_count: count,
      },
      list: result,
    });
  } catch (error) {
    return res.status(500).send({ error: true, message: "No Record Found!" });
  }
};

exports.getTreatmentSelection = async (req, res) => {
  let query = { isDeleted: false };
  if (req.params.id) query._id = req.params.id;
  const result = await TreatmentSelection.find(query)
    .populate(
      "createdBy relatedAppointments remainingAppointments relatedTransaction relatedPatient relatedTreatmentList"
    )
    .populate({
      path: "relatedTreatment",
      populate: [
        {
          path: "relatedDoctor",
          model: "Doctors",
        },
        {
          path: "procedureMedicine.item_id",
          model: "ProcedureItems",
        },
        {
          path: "procedureAccessory.item_id",
          model: "AccessoryItems",
        },
        {
          path: "machine.item_id",
          model: "FixedAssets",
        },
      ],
    });
  if (!result)
    return res.status(500).json({ error: true, message: "No Record Found" });
  return res.status(200).send({ success: true, data: result });
};

exports.getTreatementSelectionByTreatmentID = async (req, res) => {
  let query = { isDeleted: false };
  if (req.params.id) query.relatedTreatment = req.params.id;
  const result = await TreatmentSelection.find(query)
    .populate(
      "createdBy relatedAppointments remainingAppointments relatedTransaction relatedPatient relatedTreatmentList"
    )
    .populate({
      path: "relatedTreatment",
      model: "Treatments",
      populate: {
        path: "relatedDoctor",
        model: "Doctors",
      },
    });
  if (!result)
    return res.status(500).json({ error: true, message: "No Record Found" });
  return res.status(200).send({ success: true, data: result });
};

exports.createTreatmentSelectionCode = async (req, res) => {
  let data = req.body;

  try {
    //prepare TS-ID
    const latestDocument = await TreatmentSelection.find({}, { seq: 1 })
      .sort({ seq: -1 })
      .limit(1)
      .exec();
    if (latestDocument.length === 0 && latestDocument[0].seq === undefined)
      dataTVC = { ...dataTVC, seq: 1, code: "TVC-" + "-1" }; // if seq is undefined set initial patientID and seq
    if (latestDocument.length > 0 && latestDocument[0].seq) {
      console.log(latestDocument, "latestDocument");
      const increment = latestDocument[0].seq + 1;
      dataTVC = { ...dataTVC, code: "TVC-" + "-" + increment, seq: increment };
    }
    return res.status(200).send({
      success: true,
      data: data,
    });
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.createMultiTreatmentSelection = async (req, res) => {
  let {
    payWithPoint,
    add_point,
    input_point,
    userType,
    relatedExtraPoint,
    ...data
  } = req.body;

  let treatmentArray = JSON.parse(req.body.multiTreatment);
  const patientInfo = await Patient.findById(req.body.relatedPatient);

  if (add_point && add_point === "true") {
    console.log("this is add point", req.body);

    if (input_point) {
      await AddPointByInput(req.body.relatedPatient, input_point);
      const result = await CalculateWithExtraPoint(
        req.body.relatedPatient,
        relatedExtraPoint
      );

      req.body.relatedExtraPoint = result.extra_point || relatedExtraPoint;
    } else if (!input_point) {
      const percentByAmount = await CalculateTotalAmountByPercent(req, res);

      if (!percentByAmount.success)
        return res
          .status(500)
          .send({ success: false, message: percentByAmount.message });

      req.body.pay_point_to_customer = percentByAmount.point;
      req.body.totalAmount = percentByAmount.discountTotalAmount;
      req.body.discountPercent = percentByAmount.percent;
      req.body.realTotalAmount = Number(percentByAmount.realTotalAmount);
      req.body.giftedPoints = percentByAmount.gift_point;
      req.body.relatedExtraPoint = percentByAmount.extra_point;

      console.log("Percent By Amount : ", percentByAmount);
    }

    req.body.relatedExtraPoint = relatedExtraPoint;

    createTS(req, res);
  } else if (payWithPoint) {
    const total_point = treatmentArray.reduce(
      (acc, curr) => acc + curr.point,
      0
    );

    console.log(
      "d",
      deductSuccessOrFailure(patientInfo.total_point, total_point)
    );

    switch (deductSuccessOrFailure(patientInfo.total_point, total_point)) {
      case false:
        return res.status(401).send({
          success: false,
          message: "You don't have enough point to buy these treatments",
        });

      case true:
        req.body.total_points = total_point;
        deductPointFromPatient(patientInfo._id, total_point);
        createTS(req, res);
    }
  } else {
    console.log("else", req.body);
    createTS(req, res);
  }
};

exports.createTreatmentSelection = async (req, res, next) => {
  let data = req.body;

  let relatedAppointments = [];
  let tvcCreate = false;
  let createdBy = req.credentials.id;
  let files = req.files;
  try {
    if (req.body.originalDate === undefined)
      return res
        .status(500)
        .send({ error: true, message: "Original Date is required" });

    const appointmentConfig = {
      relatedPatient: req.body.relatedPatient,
      relatedDoctor: req.body.relatedDoctor,
      originalDate: new Date(req.body.originalDate), // Convert to Date object
      phone: req.body.phone,
      purchaseType: req.body.purchaseType,
    };

    const numTreatments = req.body.treatmentTimes;
    const dataconfigs = [];

    for (let i = 0; i < numTreatments; i++) {
      const date = new Date(appointmentConfig.originalDate);
      date.setDate(date.getDate() + i * req.body.inBetweenDuration); // Add 7 days for each iteration
      const config = { ...appointmentConfig, originalDate: date };
      dataconfigs.push(config);
    }

    const appointmentResult = await Appointment.insertMany(dataconfigs);
    appointmentResult.map(function (element, index) {
      relatedAppointments.push(element._id);
    });

    if (files.payment) {
      for (const element of files.payment) {
        let imgPath = element.path.split("cherry-k")[1];
        const attachData = {
          fileName: element.originalname,
          imgUrl: imgPath,
          image: imgPath.split("\\")[2],
        };
        const attachResult = await Attachment.create(attachData);
        var attachID = attachResult._id.toString();
      }
    }
    console.log(req.body.totalAmount);

    const patientUpdate = await Patient.findOneAndUpdate(
      { _id: req.body.relatedPatient },
      {
        $inc: {
          conditionAmount: req.body.totalAmount,
          conditionPurchaseFreq: 1,
          conditionPackageQty: 1,
        },
      },
      { new: true }
    );
    data = {
      ...data,
      relatedAppointments: relatedAppointments,
      remainingAppointments: relatedAppointments,
      createdBy: createdBy,
      tsType: "TS",
    };
    console.log(data, "data1");
    // //first transaction
    // if (req.body.paymentMethod === 'Cash Down') {
    //     let accID = ''
    //     if (req.body.purchaseType === 'Clinic') {
    //         accID = '6467379159a9bc811d97f4d2'

    //     } else if (req.body.purchaseType === 'Surgery') {
    //         accID = '648096bd7d7e4357442aa476'
    //     }
    //     var fTransResult = await Transaction.create({
    //         "amount": req.body.paidAmount,
    //         "date": Date.now(),
    //         "remark": null,
    //         "type": "Credit",
    //         "relatedAccounting": accID, //Advance Income
    //         "createdBy": createdBy
    //     })

    //     var amountUpdate = await Accounting.findOneAndUpdate(
    //         { _id: accID },
    //         { $inc: { amount: req.body.paidAmount } }
    //     )
    //     //sec transaction
    //     var secTransResult = await Transaction.create({
    //         "amount": req.body.paidAmount,
    //         "date": Date.now(),
    //         "remark": null,
    //         "relatedBank": req.body.relatedBank,
    //         "relatedCash": req.body.relatedCash,
    //         "type": "Debit",
    //         "relatedTransaction": fTransResult._id,
    //         "createdBy": createdBy
    //     });
    //     var fTransUpdate = await Transaction.findOneAndUpdate(
    //         { _id: fTransResult._id },
    //         {
    //             relatedTransaction: secTransResult._id
    //         },
    //         { new: true }
    //     )
    //     if (req.body.relatedBank) {
    //         var amountUpdate = await Accounting.findOneAndUpdate(
    //             { _id: req.body.relatedBank },
    //             { $inc: { amount: req.body.paidAmount } }
    //         )
    //     } else if (req.body.relatedCash) {
    //         var amountUpdate = await Accounting.findOneAndUpdate(
    //             { _id: req.body.relatedCash },
    //             { $inc: { amount: req.body.paidAmount } }
    //         )
    //     }
    //     tvcCreate = true;
    // }
    // //_________COGS___________

    // const treatmentResult = await Treatment.find({ _id: req.body.relatedTreatment })
    // const purchaseTotal = treatmentResult.reduce((accumulator, currentValue) => accumulator + currentValue.estimateTotalPrice, 0)
    // console.log(purchaseTotal)
    // const inventoryResult = Transaction.create({
    //     "amount": purchaseTotal,
    //     "date": Date.now(),
    //     "remark": req.body.remark,
    //     "relatedAccounting": "64a8e09055a87deaea39e181", //Treatement inventory
    //     "type": "Credit",
    //     "createdBy": createdBy
    // })
    // var inventoryAmountUpdate = await Accounting.findOneAndUpdate(
    //     { _id: "64a8e09055a87deaea39e181" },  //Treatement inventory
    //     { $inc: { amount: -purchaseTotal } }
    // )
    // if (req.body.purchaseType === 'Clinic') {
    //     var COGSResult = Transaction.create({
    //         "amount": purchaseTotal,
    //         "date": Date.now(),
    //         "remark": req.body.remark,
    //         "relatedAccounting": "64a8e0e755a87deaea39e18d", //Clinic Treatement COGS
    //         "type": "Debit",
    //         "relatedTransaction": inventoryResult._id,
    //         "createdBy": createdBy
    //     })
    //     var COGSUpdate = await Accounting.findOneAndUpdate(
    //         { _id: "64a8e0e755a87deaea39e18d" },  //Clinic Treatement COGS
    //         { $inc: { amount: purchaseTotal } }
    //     )
    // } else {
    //     var COGSResult = Transaction.create({
    //         "amount": purchaseTotal,
    //         "date": Date.now(),
    //         "remark": req.body.remark,
    //         "relatedAccounting": "64a8e0bb55a87deaea39e187", //Surgery COGS
    //         "type": "Debit",
    //         "relatedTransaction": inventoryResult._id,
    //         "createdBy": createdBy
    //     })
    //     var COGSUpdate = await Accounting.findOneAndUpdate(
    //         { _id: "64a8e0bb55a87deaea39e187" },  //Surgery COGS
    //         { $inc: { amount: purchaseTotal } }
    //     )
    // }

    // var inventoryUpdate = await Transaction.findOneAndUpdate(
    //     { _id: inventoryResult._id },
    //     {
    //         relatedTransaction: COGSResult._id
    //     },
    //     { new: true }
    // )

    // //_________END_OF_COGS___________
    //if (fTransResult && secTransResult) { data = { ...data, relatedTransaction: [fTransResult._id, secTransResult._id] } } //adding relatedTransactions to treatmentSelection model
    if (treatmentVoucherResult) {
      data = {
        ...data,
        relatedTreatmentVoucher: treatmentVoucherResult._id,
        purchaseTotal: purchaseTotal,
      };
    }
    console.log(data, "data2");

    const result = await TreatmentSelection.create(data);
    const tsupdate = await Patient.findOneAndUpdate(
      { _id: req.body.relatedPatient },
      { $inc: { totalTS: 1, unfinishedTS: 1 } }
    );

    tvcCreate = true;
    // if (req.body.paymentMethod === 'Advance') {
    //     let transID = ''
    //     if (req.body.purchaseType === 'Clinic') {
    //         transID = "6467379159a9bc811d97f4d2"
    //     } else if (req.body.purchaseType === 'Surgery') {
    //         transID = "648096bd7d7e4357442aa476"
    //     }
    //     const treatmentResult = await Treatment.find({ _id: req.body.relatedTreatment })
    //     let advanceAmount = req.body.totalAmount - req.body.paidAmount

    //     if (req.body.deferAmount > 0 && req.body.paidAmount !== 0 && req.body.cashBackAmount === 0) {
    //         var fTransResult = await Transaction.create({
    //             "amount": advanceAmount,
    //             "date": Date.now(),
    //             "remark": null,
    //             "relatedAccounting": "6495731a7e9b3fb309e0f6ab", //Advance Income
    //             "type": "Debit",
    //             "createdBy": createdBy
    //         })
    //         var amountUpdate = await Accounting.findOneAndUpdate(
    //             { _id: "6495731a7e9b3fb309e0f6ab" },  //Advance Income
    //             { $inc: { amount: -req.body.totalAmount } }
    //         )
    //         //sec transaction
    //         var secTransResult = await Transaction.create({
    //             "amount": req.body.paidAmount,
    //             "date": Date.now(),
    //             "remark": null,
    //             "relatedBank": req.body.relatedBank,
    //             "relatedCash": req.body.relatedCash,
    //             "type": "Debit",
    //             "relatedTransaction": fTransResult._id,
    //             "createdBy": createdBy
    //         });
    //         var fTransUpdate = await Transaction.findOneAndUpdate(
    //             { _id: fTransResult._id },
    //             {
    //                 relatedTransaction: secTransResult._id
    //             },
    //             { new: true }
    //         )
    //         if (req.body.relatedBank) {
    //             var freqSecamountUpdate = await Accounting.findOneAndUpdate(
    //                 { _id: req.body.relatedBank },
    //                 { $inc: { amount: req.body.paidAmount } }
    //             )
    //         } else if (req.body.relatedCash) {
    //             var freqSecamountUpdate = await Accounting.findOneAndUpdate(
    //                 { _id: req.body.relatedCash },
    //                 { $inc: { amount: req.body.paidAmount } }
    //             )

    //         }
    //         var secTransResult2 = await Transaction.create({
    //             "amount": req.body.totalAmount,
    //             "date": Date.now(),
    //             "remark": null,
    //             "relatedAccounting": transID,
    //             "type": "Credit",
    //             "relatedTransaction": fTransResult._id,
    //             "createdBy": createdBy
    //         });
    //         var freqSecamountUpdate2 = await Accounting.findOneAndUpdate(
    //             { _id: transID },
    //             { $inc: { amount: req.body.totalAmount } }
    //         )
    //         const ARUpdate = await AdvanceRecords.findOneAndUpdate(
    //             { _id: req.body.advanceID },
    //             { amount: 0 },
    //             { new: true }
    //         )
    //     } else if (req.body.deferAmount < 0 && req.body.paidAmount === 0 && req.body.cashBackAmount > 0) {
    //         //sec transaction

    //         var fTransResult = await Transaction.create({
    //             "amount": req.body.totalAmount,
    //             "date": Date.now(),
    //             "remark": null,
    //             "relatedAccounting": transID,
    //             "type": "Credit",

    //             "createdBy": createdBy
    //         });

    //         var amountUpdate = await Accounting.findOneAndUpdate(
    //             { _id: transID },
    //             { $inc: { amount: req.body.totalAmount } }
    //         )
    //         var secTransResult = await Transaction.create({
    //             "amount": req.body.totalAmount,
    //             "date": Date.now(),
    //             "remark": null,
    //             "relatedAccounting": "6495731a7e9b3fb309e0f6ab", //Advance Income
    //             "type": "Debit",
    //             "relatedTransaction": fTransResult._id,
    //             "createdBy": createdBy
    //         })

    //         var amountUpdate = await Accounting.findOneAndUpdate(
    //             { _id: "6495731a7e9b3fb309e0f6ab" }, //Advance Income
    //             { $inc: { amount: -req.body.totalAmount } }
    //         )

    //         var fTransUpdate = await Transaction.findOneAndUpdate(
    //             { _id: fTransResult._id },
    //             {
    //                 relatedTransaction: secTransResult._id
    //             },
    //             { new: true }
    //         )

    //         const ARUpdate = await AdvanceRecords.findOneAndUpdate(
    //             { _id: req.body.advanceID },
    //             { amount: req.body.cashBackAmount },
    //             { new: true }
    //         )

    //     } else if (req.body.deferAmount === 0 && req.boy.paidAmount === 0 && req.body.cashBackAmount === 0) {
    //         var fTransResult = await Transaction.create({
    //             "amount": req.body.totalAmount,
    //             "date": Date.now(),
    //             "remark": null,
    //             "relatedAccounting": transID,
    //             "type": "Credit",

    //             "createdBy": createdBy
    //         });

    //         var amountUpdate = await Accounting.findOneAndUpdate(
    //             { _id: transID },
    //             { $inc: { amount: req.body.totalAmount } }
    //         )
    //         var secTransResult = await Transaction.create({
    //             "amount": req.body.totalAmount,
    //             "date": Date.now(),
    //             "remark": null,
    //             "relatedAccounting": "6495731a7e9b3fb309e0f6ab", //Advance Income
    //             "type": "Debit",
    //             "relatedTransaction": fTransResult._id,
    //             "createdBy": createdBy
    //         })

    //         var amountUpdate = await Accounting.findOneAndUpdate(
    //             { _id: "6495731a7e9b3fb309e0f6ab" },
    //             { $inc: { amount: -req.body.totalAmount } }
    //         )

    //         var fTransUpdate = await Transaction.findOneAndUpdate(
    //             { _id: fTransResult._id },
    //             {
    //                 relatedTransaction: secTransResult._id
    //             },
    //             { new: true }
    //         )

    //         const ARUpdate = await AdvanceRecords.findOneAndUpdate(
    //             { _id: req.body.advanceID },
    //             { amount: 0 },
    //             { new: true }
    //         )
    //     }
    //     let dataTVC = {
    //         "relatedTreatmentSelection": result._id,
    //         "deposit": req.body.deposit,
    //         "payment": attachID,
    //         "purchaseType": req.body.purchaseType,
    //         "relatedDoctor": req.body.relatedDoctor,
    //         "relatedTreatment": req.body.relatedTreatment,
    //         "relatedAppointment": req.body.relatedAppointment,
    //         "relatedPatient": req.body.relatedPatient,
    //         "paymentMethod": "pAdvance", //enum: ['by Appointment','Lapsum','Total','Advanced']
    //         "paidAmount": req.body.paidAmount,
    //         "relatedBank": req.body.relatedBank,
    //         "bankType": req.body.bankType,//must be bank acc from accounting accs
    //         "paymentType": req.body.paymentType, //enum: ['Bank','Cash']
    //         "relatedCash": req.body.relatedCash, //must be cash acc from accounting accs
    //         "createdBy": createdBy,
    //         "remark": req.body.remark,
    //         "payment": attachID,
    //         "relatedDiscount": req.body.relatedDiscount,
    //         "discountAmount": req.body.discountAmount,
    //         "discountType": req.body.discountType,
    //         "tsType": 'TS'
    //     }
    //     let today = new Date().toISOString()
    //     const latestDocument = await TreatmentVoucher.find({}, { seq: 1 }).sort({ seq: -1 }).limit(1).exec();
    //     if (latestDocument.length === 0 && latestDocument[0].seq === undefined) dataTVC = { ...dataTVC, seq: 1, code: "TVC-"  + "-1" } // if seq is undefined set initial patientID and seq
    //     if (latestDocument.length > 0 && latestDocument[0].seq) {
    //         console.log(latestDocument, 'latestDocument')
    //         const increment = latestDocument[0].seq + 1
    //         dataTVC = { ...dataTVC, code: "TVC-"  + "-" + increment, seq: increment }
    //     }
    //     var treatmentVoucherResult = await TreatmentVoucher.create(dataTVC)
    // }

    // if (req.body.paymentMethod === 'FOC') {
    //     let dataTVC = {
    //         "relatedTreatmentSelection": result._id,
    //         "remark": req.body.remark,
    //         "payment": attachID,
    //         "deposit": req.body.deposit,
    //         "purchaseType": req.body.purchaseType,
    //         "relatedDoctor": req.body.relatedDoctor,
    //         "relatedTreatment": req.body.relatedTreatment,
    //         "relatedAppointment": req.body.relatedAppointment,
    //         "relatedPatient": req.body.relatedPatient,
    //         "paymentMethod": "FOC", //enum: ['by Appointment','Lapsum','Total','Advanced']
    //         "paidAmount": req.body.paidAmount,
    //         "relatedBank": req.body.relatedBank,
    //         "bankType": req.body.bankType,//must be bank acc from accounting accs
    //         "paymentType": req.body.paymentType, //enum: ['Bank','Cash']
    //         "relatedCash": req.body.relatedCash, //must be cash acc from accounting accs
    //         "createdBy": createdBy,
    //         "remark": req.body.remark,
    //         "payment": attachID,
    //         "discountAmount": req.body.discountAmount,
    //         "discountType": req.body.discountType,
    //         "tsType": 'TS'
    //     }
    //     let today = new Date().toISOString()
    //     const latestDocument = await TreatmentVoucher.find({}, { seq: 1 }).sort({ seq: -1 }).limit(1).exec();
    //     if (latestDocument.length === 0) dataTVC = { ...dataTVC, seq: 1, code: "TVC-"  + "-1" } // if seq is undefined set initial patientID and seq
    //     if (latestDocument.length > 0) {
    //         const increment = latestDocument[0].seq + 1
    //         dataTVC = { ...dataTVC, code: "TVC-"  + "-" + increment, seq: increment }
    //     }
    //     var treatmentVoucherResult = await TreatmentVoucher.create(dataTVC)
    // }
    if (tvcCreate === true) {
      //--> treatment voucher create
      let dataTVC = {
        secondAccount: req.body.secondAccount,
        secondAmount: req.body.secondAmount,
        isDouble: req.body.isDouble,
        relatedTreatmentSelection: result._id,
        payment: attachID,
        remark: req.body.remark,
        deposit: req.body.deposit,
        purchaseType: req.body.purchaseType,
        relatedDoctor: req.body.relatedDoctor,
        relatedTreatment: req.body.relatedTreatment,
        relatedAppointment: req.body.relatedAppointment,
        relatedPatient: req.body.relatedPatient,
        paymentMethod: req.body.paymentMethod, //enum: ['by Appointment','Lapsum','Total','Advanced']
        paidAmount: req.body.paidAmount,
        relatedBank: req.body.relatedBank,
        bankType: req.body.bankType, //must be bank acc from accounting accs
        paymentType: req.body.paymentType, //enum: ['Bank','Cash']
        relatedCash: req.body.relatedCash, //must be cash acc from accounting accs
        createdBy: createdBy,
        remark: req.body.remark,
        payment: attachID,
        discountAmount: req.body.discountAmount,
        discountType: req.body.discountType,
        tsType: "TS",
        balance: req.body.balance,
        createdAt: req.body.createdAt,
      };
      let today = new Date().toISOString();
      const latestDocument = await TreatmentVoucher.find({}, { seq: 1 })
        .sort({ seq: -1 })
        .limit(1)
        .exec();
      if (latestDocument.length === 0)
        dataTVC = { ...dataTVC, seq: 1, code: "TVC-" + "-1" }; // if seq is undefined set initial patientID and seq
      if (latestDocument.length > 0) {
        const increment = latestDocument[0].seq + 1;
        dataTVC = {
          ...dataTVC,
          code: "TVC-" + "-" + increment,
          seq: increment,
        };
      }
      var treatmentVoucherResult = await TreatmentVoucher.create(dataTVC);
    }
    let advanceQuery = { $inc: { amount: -req.body.totalAmount } };
    if (req.body.recievedPatient)
      advanceQuery.recievedPatient = req.body.recievedPatient;
    //freq Update Start
    // const advanceResult = await AdvanceRecords.findOneAndUpdate(
    //     { relatedPatient: req.body.relatedPatient },
    //     advanceQuery,
    //     { new: true }
    // )
    const freqUpdate = await Patient.findOneAndUpdate(
      { _id: req.body.relatedPatient },
      {
        $inc: {
          treatmentPackageQty: 1,
          totalAmount: req.body.totalAmount,
          totalAppointments: req.body.treatmentTimes,
          unfinishedAppointments: req.body.treatmentTimes,
        },
      },
      { new: true }
    );
    // var freqfTransResult = await Transaction.create({
    //     "amount": req.body.paidAmount,
    //     "date": Date.now(),
    //     "remark": null,
    //     "relatedAccounting": "6495731a7e9b3fb309e0f6ab", //Advance Income
    //     "type": "Credit",
    //     "createdBy": createdBy
    // })
    // var freqamountUpdate = await Accounting.findOneAndUpdate(
    //     { _id: "6495731a7e9b3fb309e0f6ab" },
    //     { $inc: { amount: -req.body.paidAmount } }
    // )
    // //sec transaction
    // var freqSecTransResult = await Transaction.create({
    //     "amount": req.body.paidAmount,
    //     "date": Date.now(),
    //     "remark": null,
    //     "relatedBank": req.body.relatedBank,
    //     "relatedCash": req.body.relatedCash,
    //     "type": "Debit",
    //     "relatedTransaction": freqfTransResult._id,
    //     "createdBy": createdBy
    // });
    // var freqfTransUpdate = await Transaction.findOneAndUpdate(
    //     { _id: freqfTransResult._id },
    //     {
    //         relatedTransaction: freqSecTransResult._id
    //     },
    //     { new: true }
    // )
    // if (req.body.relatedBank) {
    //     var freqSecamountUpdate = await Accounting.findOneAndUpdate(
    //         { _id: req.body.relatedBank },
    //         { $inc: { amount: req.body.paidAmount } }
    //     )
    // } else if (req.body.relatedCash) {
    //     var freqSecamountUpdate = await Accounting.findOneAndUpdate(
    //         { _id: req.body.relatedCash },
    //         { $inc: { amount: req.body.paidAmount } }
    //     )
    // }

    const populatedResult = await TreatmentSelection.find({ _id: result._id })
      .populate(
        "createdBy relatedAppointments remainingAppointments relatedTransaction relatedPatient relatedTreatmentList"
      )
      .populate({
        path: "relatedTreatment",
        model: "Treatments",
        populate: {
          path: "relatedDoctor",
          model: "Doctors",
        },
      })
      .populate({
        path: "relatedAppointments",
        model: "Appointments",
        populate: {
          path: "relatedDoctor",
          model: "Doctors",
        },
      });
    //let appointmentcount = populatedResult.relatedAppointments;
    let appointmentcount = populatedResult[0].relatedAppointments.length;
    let perAppointmentPrices = (
      req.body.totalAmount / appointmentcount
    ).toFixed(2);
    // let deferRevenues = req.body.totalAmount - perAppointmentPrices;
    let deferRevenues = req.body.totalAmount;
    let updatedata = {
      perAppointmentPrice: perAppointmentPrices,
      deferRevenue: deferRevenues,
    };

    for (const id of relatedAppointments) {
      const accResult = await Appointment.findOneAndUpdate(
        { _id: id },
        { $addToSet: { relatedTreatmentSelection: result._id } },
        { new: true }
      );
    }

    if (data.relatedPatient) {
      const patientResult = await Patient.findOneAndUpdate(
        { _id: req.body.relatedPatient },
        { $addToSet: { relatedTreatmentSelection: result._id } },
        { new: true }
      );
    }
    if (treatmentVoucherResult) {
      var populatedTV = await TreatmentVoucher.find({
        _id: treatmentVoucherResult._id,
      }).populate("relatedDiscount");
    }
    if (req.body.balance > 0) {
      const debtCreate = await Debt.create({
        balance: req.body.balance,
        relatedPatient: data.relatedPatient,
        relatedTreatmentVoucher: treatmentVoucherResult._id,
      });
      var updateDebt = await Patient.findOneAndUpdate(
        { _id: relatedPatient },
        { $inc: { debtBalance: req.body.balance } }
      );
    }
    console.log("updated data is " + JSON.stringify(updatedata));
    let updatedTreatementSelection = await TreatmentSelection.findByIdAndUpdate(
      populatedResult[0]._id,
      {
        perAppointmentPrice: perAppointmentPrices,
        deferRevenue: deferRevenues,
      }
    );
    let updatedTreatmentSelectionQuery = await TreatmentSelection.findById(
      populatedResult[0]._id
    );

    let response = {
      message: "Treatment Selection create success",
      success: true,
      data: populatedResult,
      appointmentAutoGenerate: appointmentResult,
      patientFreqUpdate: freqUpdate,
      updatedTreatementSelectionQuery: updatedTreatmentSelectionQuery, //updatedTreatementSelection
      // purchaseTotal: purchaseTotal
      // fTransResult: fTransResult,
      // secTransResult: secTransResult,
      // treatmentVoucherResult:treatmentVoucherResult
    };
    if (populatedTV) response.treatmentVoucherResult = populatedTV;
    // if (fTransUpdate) response.fTransResult = fTransUpdate
    // if (fTransResult) response.secTransResult = secTransResult
    res.status(200).send(response);
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.updateTreatmentSelectionStatus = async (req, res) => {
  try {
    const { relatedPatient, relatedTreatmentSelection } = req.body;
    const getTS = await TreatmentSelection.findOne({
      _id: relatedTreatmentSelection,
      isDeleted: false,
    });
    if (getTS.isDone === true)
      return res
        .status(500)
        .send({ error: true, message: "It's already Updated!" });
    const updateTs = await TreatmentSelection.findOneAndUpdate(
      { _id: relatedTreatmentSelection, isDeleted: false },
      { isDone: true }
    );
    const updatePatient = await Patient.findOneAndUpdate(
      { _id: relatedPatient, isDeleted: false },
      { $inc: { finishedTS: 1, unfinishedTS: -1 } }
    );
    return res
      .status(200)
      .send({ success: true, message: "Successfully Updated!" });
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.updateTreatmentSelection = async (req, res, next) => {
  try {
    let data = req.body;
    if (data.paidAmount) {
      data = { ...data, leftOverAmount: data.totalAmount - data.paidAmount }; // leftOverAmount Calculation
    }
    if (data.paidAmount === 0)
      data = { ...data, leftOverAmount: data.totalAmount };
    const result = await TreatmentSelection.findOneAndUpdate(
      { _id: req.body.id },
      data,
      { new: true }
    ).populate("relatedTreatment");
    return res.status(200).send({ success: true, data: result });
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.treatmentPayment = async (req, res, next) => {
  let data = req.body;
  let createdBy = req.credentials.id;
  let files = req.files;
  try {
    let { paidAmount } = data;
    const treatmentSelectionQuery = await TreatmentSelection.find({
      _id: req.body.id,
      isDeleted: false,
    })
      .populate("relatedTreatment")
      .populate("relatedAppointments");
    const result = await TreatmentSelection.findOneAndUpdate(
      { _id: req.body.id },
      { $inc: { leftOverAmount: -paidAmount }, paidAmount: paidAmount },
      { new: true }
    ).populate("relatedTreatment");
    if (files.payment) {
      for (const element of files.payment) {
        let imgPath = element.path.split("cherry-k")[1];
        const attachData = {
          fileName: element.originalname,
          imgUrl: imgPath,
          image: imgPath.split("\\")[2],
        };
        const attachResult = await Attachment.create(attachData);
        var attachID = attachResult._id.toString();
      }
    }
    if (result.paymentMethod === "Credit") {
      //
      let dataTVC = {
        remark: req.body.remark,
        payment: attachID,
        secondAccount: req.body.secondAccount,
        secondAmount: req.body.secondAmount,
        isDouble: req.body.isDouble,
        relatedTreatmentSelection: result._id,
        deposit: req.body.deposit,
        purchaseType: req.body.purchaseType,
        relatedDoctor: req.body.relatedDoctor,
        relatedTreatment: req.body.relatedTreatment,
        relatedAppointment: req.body.relatedAppointment,
        relatedPatient: req.body.relatedPatient,
        paymentMethod: "by Appointment", //enum: ['by Appointment','Lapsum','Total','Advanced']
        amount: paidAmount,
        relatedBank: req.body.relatedBank, //must be bank acc from accounting accs
        bankType: req.body.bankType,
        paymentType: req.body.paymentType, //enum: ['Bank','Cash']
        relatedCash: req.body.relatedCash,
        createdBy: createdBy, //must be cash acc from accounting accs
        remark: req.body.remark,
        payment: attachID,
        relatedDiscount: req.body.relatedDiscount,
        discountAmount: req.body.discountAmount,
        discountType: req.body.discountType,
      };
      let today = new Date().toISOString();
      const latestDocument = await TreatmentVoucher.find({}, { seq: 1 })
        .sort({ seq: -1 })
        .limit(1)
        .exec();
      if (latestDocument.length === 0)
        dataTVC = { ...dataTVC, seq: 1, code: "TVC-" + "-1" }; // if seq is undefined set initial patientID and seq
      if (latestDocument.length > 0) {
        const increment = latestDocument[0].seq + 1;
        dataTVC = {
          ...dataTVC,
          code: "TVC-" + "-" + increment,
          seq: increment,
        };
      }
      var treatmentVoucherResult = await TreatmentVoucher.create(dataTVC);
      //transaction
      let transID = "";
      if (req.body.purchaseType === "Clinic") {
        transID = "6467379159a9bc811d97f4d2";
      } else if (req.body.purchaseType === "Surgery") {
        transID = "648096bd7d7e4357442aa476";
      }
      var fTransResult = await Transaction.create({
        amount: req.body.paidAmount,
        date: Date.now(),
        remark: null,
        relatedAccounting: transID,
        type: "Credit",
        createdBy: createdBy,
      });
      if (result.relatedTreatment.relatedAccount) {
        var amountUpdate = await Accounting.findOneAndUpdate(
          { _id: transID },
          { $inc: { amount: req.body.paidAmount } }
        );
      }
      //sec transaction
      var secTransResult = await Transaction.create({
        amount: req.body.paidAmount,
        date: Date.now(),
        remark: null,
        relatedBank: req.body.relatedBank,
        relatedCash: req.body.relatedCash,
        type: "Debit",
        relatedTransaction: fTransResult._id,
        createdBy: createdBy,
      });
      var fTransUpdate = await Transaction.findOneAndUpdate(
        { _id: fTransResult._id },
        {
          relatedTransaction: secTransResult._id,
        },
        { new: true }
      );
      if (req.body.relatedBank) {
        var amountUpdate = await Accounting.findOneAndUpdate(
          { _id: req.body.relatedBank },
          { $inc: { amount: req.body.paidAmount } }
        );
      } else if (req.body.relatedCash) {
        var amountUpdate = await Accounting.findOneAndUpdate(
          { _id: req.body.relatedCash },
          { $inc: { amount: req.body.paidAmount } }
        );
      }
    }
    // else if (result.paymentMethod === 'Cash Down') { //byAppointment
    //     // const treatmentVoucherResult = await TreatmentVoucher.create(
    //     //     {
    //     //         "relatedTreatment": req.body.relatedTreatment,
    //     //         "relatedAppointment": req.body.relatedAppointment,
    //     //         "relatedPatient": req.body.relatedPatient,
    //     //         "paymentMethod": 'by Appointment', //enum: ['by Appointment','Lapsum','Total','Advanced']
    //     //         "amount": paidAmount,
    //     //     }
    //     // )

    //     var repayRecord = await Repay.create({
    //         relatedAppointment: req.body.relatedAppointment,
    //         relatedTreatmentSelection: req.body.id,
    //         paidAmount: req.body.paidAmount,
    //     })
    //     var rpRecordPopulated = await Repay.find({ _id: repayRecord._id }).populate('relatedAppointment')
    //     //transaction
    //     if (req.body.purchaseType === 'Clinic') {
    //         var fTransResult = await Transaction.create({
    //             "amount": req.body.paidAmount,
    //             "date": Date.now(),
    //             "remark": null,
    //             "relatedAccounting": "649416b44236f7602ba3411a", //Sales Clinic
    //             "type": "Debit",
    //             "createdBy": createdBy,
    //         })
    //     } else if (req.body.purchaseType === 'Surgery') {
    //         var fTransResult = await Transaction.create({
    //             "amount": req.body.paidAmount,
    //             "date": Date.now(),
    //             "remark": null,
    //             "relatedAccounting": "648096bd7d7e4357442aa476", //Sales-Surgery
    //             "type": "Debit",
    //             "createdBy": createdBy,
    //         })
    //     }
    //     //sec transaction
    //     var secTransResult = await Transaction.create({
    //         "amount": req.body.paidAmount,
    //         "date": Date.now(),
    //         "remark": null,
    //         "relatedAccounting": result.relatedTreatment.relatedAccount,
    //         "type": "Credit",
    //         "relatedTransaction": fTransResult._id,
    //         "createdBy": createdBy,
    //     })
    //     var fTransUpdate = await Transaction.findOneAndUpdate(
    //         { _id: fTransResult._id },
    //         {
    //             relatedTransaction: secTransResult._id
    //         },
    //         { new: true }
    //     )
    //     var amountUpdate = await Accounting.findOneAndUpdate(
    //         { _id: result.relatedTreatment.relatedAccount },
    //         { $inc: { amount: req.body.paidAmount } }
    //     )

    //     var amountUpdate2 = await Accounting.findOneAndUpdate(
    //         { _id: "6467379159a9bc811d97f4d2" },
    //         { $inc: { amount: -req.body.paidAmount } }
    //     )
    // }
    let response = {
      success: true,
      data: result,
      //appointmentAutoGenerate: appointmentResult,
      fTransResult: fTransUpdate,
      // secTransResult: secTransResult,
      // treatmentVoucherResult:treatmentVoucherResult
    };
    if (treatmentVoucherResult)
      response.treatmentVoucherResult = treatmentVoucherResult;
    return res.status(200).send(response);
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.deleteTreatmentSelection = async (req, res, next) => {
  try {
    const result = await TreatmentSelection.findOneAndUpdate(
      { _id: req.params.id },
      { isDeleted: true },
      { new: true }
    );
    return res
      .status(200)
      .send({ success: true, data: { isDeleted: result.isDeleted } });
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.activateTreatmentSelection = async (req, res, next) => {
  try {
    const result = await TreatmentSelection.findOneAndUpdate(
      { _id: req.params.id },
      { isDeleted: false },
      { new: true }
    );
    return res
      .status(200)
      .send({ success: true, data: { isDeleted: result.isDeleted } });
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.createTreatmentTransaction = async (req, res) => {
  try {
    //first transaction
    const fTransaction = new Transaction({
      amount: req.body.amount,
      date: req.body.date,
      remark: req.body.remark,
      relatedAccounting: req.body.firstAccount,
      type: "Credit",
      createdBy: createdBy,
    });
    const fTransResult = await fTransaction.save();
    const secTransaction = new Transaction({
      amount: req.body.amount,
      date: req.body.date,
      remark: req.body.remark,
      relatedAccounting: req.body.secondAccount,
      type: "Debit",
      relatedTransaction: fTransResult._id,
      createdBy: createdBy,
    });
    var fTransUpdate = await Transaction.findOneAndUpdate(
      { _id: fTransResult._id },
      {
        relatedTransaction: secTransResult._id,
      },
      { new: true }
    );
    const secTransResult = await secTransaction.save();
    res.status(200).send({
      message: "MedicineSale Transaction success",
      success: true,
      fTrans: fTransUpdate,
      sTrans: secTransResult,
    });
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.getRelatedTreatmentSelections = async (req, res) => {
  try {
    let query = { isDeleted: false };
    let { relatedPatient, start, end, relatedAppointments } = req.body;
    if (start && end) query.createdAt = { $gte: start, $lte: end };
    if (relatedPatient) query.relatedPatient = relatedPatient;
    if (relatedAppointments)
      query.relatedAppointments = { $in: relatedAppointments };
    const result = await TreatmentSelection.find(query)
      .populate(
        "createdBy relatedAppointments remainingAppointments relatedTransaction relatedPatient relatedTreatmentList"
      )
      .populate({
        path: "relatedTreatment",
        model: "Treatments",
        populate: {
          path: "relatedDoctor",
          model: "Doctors",
        },
      });
    if (result.length === 0)
      return res.status(404).json({ error: true, message: "No Record Found" });
    return res.status(200).send({ success: true, data: result });
  } catch (error) {
    return res.status(500).send({
      error: true,
      message: "An Error Occured While Fetching Related Treatment Selections",
    });
  }
};

exports.searchTreatmentSelections = async (req, res, next) => {
  try {
    let query = { isDeleted: false };
    let { search, relatedPatient } = req.body;
    if (relatedPatient) query.relatedPatient = relatedPatient;
    if (search) query.$text = { $search: search };
    const result = await TreatmentSelection.find(query)
      .populate(
        "createdBy relatedAppointments remainingAppointments relatedTransaction relatedPatient relatedTreatmentList"
      )
      .populate({
        path: "relatedTreatment",
        model: "Treatments",
        populate: {
          path: "relatedDoctor",
          model: "Doctors",
        },
      });
    if (result.length === 0)
      return res.status(404).send({ error: true, message: "No Record Found!" });
    return res.status(200).send({ success: true, data: result });
  } catch (err) {
    return res.status(500).send({ error: true, message: err.message });
  }
};

exports.profitAndLossForEveryMonth = async (req, res) => {
  console.log("here");
  let treatmentSelectionResult = await TreatmentSelection.find({});
  const BankNames = treatmentSelectionResult.reduce(
    (result, { purchaseType, totalAmount }) => {
      console.log(result, "before");
      result[purchaseType] = (result[purchaseType] || 0) + totalAmount;
      console.log(result, "after");
      return result;
    },
    {}
  );
  return res
    .status(200)
    .send({ success: true, data: treatmentSelectionResult });
};

exports.sendEmail = async (req, res) => {
  try {
    let { recipent, voucherType, voucherNo, voucherDate } = req.body;
    const filePath = "../";
    const mailOptions = {
      from: config.senderEmail, // Sender email address
      to: recipent, // Recipient email address (can be a comma-separated list for multiple recipients)
      subject: `${voucherType} Voucher (${voucherNo})`, // Email subject
      html: `
                <p>Dear Customer,</p>
    
                <p>Please recieve your ${voucherType} voucher (${voucherNo}) which was purchased on ${voucherDate} as attached.</p>
    
                <p>Best regards,<br>Clinic Denovo</p>

                <em>Address: Blk A, No. 001, Corner of Hantharwadi Road and Hnin Si Street, Yuzana Highway Complex,, Yangon, Myanmar, 11041</em>

                <br/>
                
                <em>Ph No: 09 968 119 995</em>
  `,
    };

    // const outputFolder = path.join(__dirname, 'decoded_files');
    const outputFilePath = path.join(
      config.savePDF,
      voucherNo + "@" + voucherDate + ".png"
    );
    const base64String = req.body.file.replace(/^data:image\/png;base64,/, "");
    const bufferData = Buffer.from(base64String, "base64");

    // Step 2: Create the output folder if it doesn't exist
    if (!fs.existsSync(config.savePDF)) {
      fs.mkdirSync(config.savePDF);
    }
    // Step 2: Write the Buffer data to a file
    fs.writeFile(outputFilePath, bufferData, async (err) => {
      if (err) {
        console.error("Error writing the decoded file:", err);
        return;
      }
      console.log("File successfully decoded and saved:", outputFilePath);
      mailOptions.attachments = [
        {
          filename: "voucher.png",
          path: outputFilePath,
          contentType: "image/png", // Set the correct content type for PDF
        },
      ];
      const emailResult = await sendEmail(mailOptions);
      return res.status(200).send({ success: true, result: emailResult });
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.TopTenFilter = async (req, res) => {
  try {
    let query = { isDeleted: false };
    let { start, end, tsType } = req.query;

    if ((start, end)) query.createdAt = { $gte: start, $lte: end };
    if (tsType) query.tsType = tsType;

    const TreatmentResult = await TreatmentSelection.find(query)
      .populate("relatedTreatment multiTreatment.item_id")
      .populate({
        path: "relatedTreatment",
        populate: {
          path: "treatmentName",
          model: "TreatmentLists",
        },
      });

    if (tsType === "TS") {
      const treatmentNameMap = TreatmentResult.reduce(
        (result, { relatedTreatment }) => {
          if (!relatedTreatment) {
            // Handle the case where relatedTreatment is undefined
            return result; // Skip this iteration
          }

          const { name, treatmentName } = relatedTreatment;
          const treatmentUnit = name;
          const treatment = treatmentName.name;

          console.log(treatmentUnit);

          if (result.hasOwnProperty(treatmentUnit)) {
            result[treatmentUnit].qty++;
          } else {
            result[treatmentUnit] = { treatmentUnit, treatment, qty: 1 };
          }
          return result;
        },
        {}
      );

      const reducedTreatmentNames = Object.values(treatmentNameMap);

      const sortedTreatmentNames = reducedTreatmentNames.sort(
        (a, b) => b.qty - a.qty
      ); // Descending

      return res.status(200).send({
        success: true,
        data: sortedTreatmentNames,
        list: TreatmentResult,
      });
    } else if (tsType === "TSMulti") {
      const treatmentNameMap = TreatmentResult.reduce(
        (result, { multiTreatment }) => {
          if (multiTreatment.length === 0) {
            return result; // Skip this iteration
          }

          console.log(multiTreatment);

          multiTreatment.forEach((item) => {
            const { name, treatmentName } = item.item_id;
            const treatmentUnit = name || "Undefined"; // Use 'Undefined' if name is falsy
            const treatment = treatmentName ? treatmentName.name : "Undefined";

            if (result.hasOwnProperty(treatmentUnit)) {
              result[treatmentUnit].qty++;
            } else {
              result[treatmentUnit] = { treatmentUnit, treatment, qty: 1 };
            }
          });
          return result; // Return the updated result object for the current iteration
        },

        {}
      );

      const reducedTreatmentNames = Object.values(treatmentNameMap);

      const sortedTreatmentNames = reducedTreatmentNames.sort(
        (a, b) => b.qty - a.qty
      ); // Descending

      return res.status(200).send({
        success: true,
        data: sortedTreatmentNames,
        list: TreatmentResult,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.getTreatmentsWithSalesFilter = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).send({
        success: false,
        message: "Both startDate and endDate are required.",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    const treatments = await TreatmentVoucher.aggregate([
      {
        $match: {
          isDeleted: false,
          createdAt: { $gte: start, $lte: end },
          tsType: { $in: ["TS", "TSMulti"] },
          purchaseType: { $ne: null },
        },
      },
      {
        $unwind: "$multiTreatment",
      },
      {
        $lookup: {
          from: "treatments",
          localField: "multiTreatment.item_id",
          foreignField: "_id",
          as: "treatmentDetails",
        },
      },
      {
        $unwind: "$treatmentDetails",
      },
      {
        $addFields: {
          treatmentUnit: "$treatmentDetails.name",
          qty: "$multiTreatment.qty",
        },
      },
      {
        $group: {
          _id: {
            purchaseType: "$purchaseType",
            treatmentUnit: "$treatmentUnit",
          },
          qty: { $sum: "$qty" },
        },
      },
      {
        $group: {
          _id: "$_id.purchaseType",
          treatments: {
            $push: {
              treatmentUnit: "$_id.treatmentUnit",
              qty: "$qty",
            },
          },
        },
      },
      {
        $addFields: {
          treatments: {
            $sortArray: { input: "$treatments", sortBy: { qty: -1 } },
          },
        },
      },
      {
        $project: {
          _id: 0,
          purchaseType: "$_id",
          treatments: 1,
        },
      },
    ]);

    const medicines = await TreatmentVoucher.aggregate([
      {
        $match: {
          isDeleted: false,
          createdAt: { $gte: start, $lte: end },
          tsType: "MS",
        },
      },
      {
        $unwind: "$medicineItems",
      },
      {
        $lookup: {
          from: "medicineitems",
          localField: "medicineItems.item_id",
          foreignField: "_id",
          as: "medicineDetails",
        },
      },
      {
        $unwind: "$medicineDetails",
      },
      {
        $addFields: {
          medicineName: "$medicineDetails.medicineItemName",
          qty: "$medicineItems.qty",
        },
      },
      {
        $group: {
          _id: "$medicineName",
          qty: { $sum: "$qty" },
        },
      },
      {
        $sort: { qty: -1 }, // Sort medicines by quantity in descending order
      },
      {
        $project: {
          _id: 0,
          medicineName: "$_id",
          qty: 1,
        },
      },
    ]);

    return res.status(200).send({
      success: true,
      data: { treatments, medicines },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      success: false,
      message: "An error occurred while fetching treatments and medicines.",
      error: error.message,
    });
  }
};
