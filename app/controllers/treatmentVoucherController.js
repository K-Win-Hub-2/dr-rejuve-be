"use strict";
const TreatmentVoucher = require("../models/treatmentVoucher");
const MedicineItems = require("../models/medicineItem");
const Transaction = require("../models/transaction");
const Accounting = require("../models/accountingList");
const path = require("path");
const UserUtil = require("../lib/userUtil");
const TreatmentSelection = require("../models/treatmentSelection");
const Attachment = require("../models/attachment");
const Log = require("../models/log");
const Debt = require("../models/debt");
const Doctor = require("../models/doctor");
const Therapist = require("../models/therapist");
const {
  filterTreatmentVoucherService,
} = require("../services/treatmentVoucherService");
const {
  CalculateTotalAmountByPercent,
  AddPointByInput,
  checkAndUpdateTierOfPatient,
} = require("../helper/pointHelper");
const { createPointHistory } = require("../services/pointHistoryService");
const FilterTreatmentInVoucherLists = require("../lib/FilterTreatmentInVoucherLists");

exports.deleteMS = async (req, res) => {
  try {
    const result = await TreatmentVoucher.findOneAndUpdate(
      { _id: req.params.id },
      { isDeleted: true },
      { new: true }
    );
    return res.status(200).send({ success: true, data: result });
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.listAllTreatmentVouchers = async (req, res) => {
  let {
    keyword,
    startDate,
    endDate,
    role,
    limit,
    skip,
    tsType,
    relatedPatient,
  } = req.query;
  let count = 0;
  let page = 0;
  try {
    limit = +limit <= 100 ? +limit : 20; //limit
    skip = +skip || 0;
    let query = { isDeleted: false },
      regexKeyword;

    if (role) {
      query["role"] = role.toUpperCase();
    }

    if (keyword && /\w/.test(keyword)) {
      regexKeyword = new RegExp(keyword, "i");
    }

    if (tsType) {
      query.tsType = tsType;
    }

    relatedPatient ? (query.relatedPatient = relatedPatient) : "";

    if (regexKeyword) {
      query["name"] = regexKeyword;
    }

    if (startDate && endDate) {
      const startDay = new Date(startDate);
      startDay.setHours(0, 0, 0, 0);
      const endDay = new Date(endDate);
      endDay.setHours(23, 59, 59, 999);

      query.createdAt = { $gte: startDay, $lt: endDay };
    }

    let result = await TreatmentVoucher.find(query)
      .populate(
        "relatedDoctor createdBy relatedTreatment relatedAppointment payment relatedTreatmentSelection medicineItems.item_id multiTreatment.item_id"
      )
      .populate("relatedPatient")
      .populate({
        path: "repay",
        populate: {
          path: "repayId",
          populate: [
            {
              path: "relatedTreatmentVoucher",
            },
            {
              path: "relatedPatient",
            },
            {
              path: "relatedBank",
            },
            {
              path: "relatedCash",
            },
          ],
        },
      });

    count = await TreatmentVoucher.find(query).count();
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
  } catch (e) {
    return res.status(500).send({ error: true, message: e.message });
  }
};

exports.getTreatmentVoucherWithTreatmentID = async (req, res) => {
  let query = { isDeleted: false };
  if (req.params.id) query.relatedTreatmentSelection = req.params.id;
  const result = await TreatmentVoucher.find(query)
    .populate("createdBy relatedTreatment relatedAppointment relatedPatient")
    .populate({
      path: "repay",
      populate: {
        path: "repayId",
        populate: [
          {
            path: "relatedTreatmentVoucher",
          },
          {
            path: "relatedPatient",
          },
          {
            path: "relatedBank",
          },
          {
            path: "relatedCash",
          },
        ],
      },
    });
  if (!result)
    return res.status(500).json({ error: true, message: "No Record Found" });
  return res.status(200).send({ success: true, data: result });
};

exports.getTreatmentVoucher = async (req, res) => {
  let query = { isDeleted: false };
  if (req.params.id) query._id = req.params.id;
  const result = await TreatmentVoucher.find(query)
    .populate(
      "createdBy relatedTreatment relatedAppointment relatedPatient relatedTreatmentSelection multiTreatment.item_id relatedCash relatedBank relatedDoctor medicineItems.item_id relatedPackageSelection relatedPackage"
    )
    .populate([
      {
        path: "repay",
        populate: {
          path: "repayId",
          populate: [
            {
              path: "relatedTreatmentVoucher",
            },
            {
              path: "relatedPatient",
            },
            {
              path: "relatedBank",
            },
            {
              path: "relatedCash",
            },
          ],
        },
      },
      {
        path: "secondAccount",
        populate: [
          { path: "relatedType" },
          { path: "relatedHeader" },
          { path: "relatedTreatment" },
          { path: "relatedBank" },
        ],
      },
    ]);
  if (!result)
    return res.status(500).json({ error: true, message: "No Record Found" });
  return res.status(200).send({ success: true, data: result });
};

exports.updateMedicineSale = async (req, res) => {
  try {
    let { id, addItems, removeItems } = req.body;
    let data = req.body;
    console.log("data to update medicine sale is ", data);
    const createdBy = req.credentials.id;
    console.log("addItems", addItems, id, removeItems);
    if (addItems !== undefined) {
      for (const e of addItems) {
        const result = await MedicineItems.find({ _id: e.item_id });
        if (!result[0].totalUnit)
          return res
            .status(404)
            .send({ error: true, message: "TotalUnit is undefined!" });
        let totalUnit = result[0].totalUnit - e.qty;

        const from = result[0].fromUnit;
        const to = result[0].toUnit;
        const currentQty = (from * totalUnit) / to;
        try {
          if (totalUnit > 0) {
            const result = await MedicineItems.findOneAndUpdate(
              { _id: e.item_id },
              { totalUnit: totalUnit, currentQty: currentQty },
              { new: true }
            );
            // Handle the result as needed
          } else {
            res.status(500).send({
              message: "Cannot decrement totalUnit when it's already 0.",
              error: true,
            });
            // Handle this situation according to your business logic
          }
        } catch (error) {
          return res.status(500).send({ error: true, message: error.message });
        }
        const logResult = await Log.create({
          relatedTreatmentSelection: null,
          relatedAppointment: null,
          relatedMedicineItems: e.item_id,
          currentQty: e.stock,
          actualQty: e.actual,
          finalQty: totalUnit,
          type: "Medicine Sale",
          createdBy: createdBy,
        });
      }
    }

    if (removeItems !== undefined) {
      for (const e of removeItems) {
        const result = await MedicineItems.find({ _id: e.item_id });
        if (!result[0].totalUnit)
          return res
            .status(200)
            .send({ error: true, message: "TotalUnit is undefined!" });
        let totalUnit = result[0].totalUnit + e.qty;

        const from = result[0].fromUnit;
        const to = result[0].toUnit;
        const currentQty = (from * totalUnit) / to;
        try {
          if (totalUnit > 0) {
            const result = await MedicineItems.findOneAndUpdate(
              { _id: e.item_id },
              { totalUnit: totalUnit, currentQty: currentQty },
              { new: true }
            );
          } else {
            res.status(500).send({
              message: "Cannot decrement totalUnit when it's already 0.",
              error: true,
            });
          }
        } catch (error) {
          return res.status(500).send({ error: true, message: error.message });
        }
        const logResult = await Log.create({
          relatedTreatmentSelection: null,
          relatedAppointment: null,
          relatedMedicineItems: e.item_id,
          currentQty: e.stock,
          actualQty: e.actual,
          finalQty: totalUnit,
          type: "Medicine Sale",
          createdBy: createdBy,
        });
      }
    }
    const updateMedicineSale = await TreatmentVoucher.findOneAndUpdate(
      { _id: id },
      req.body,
      { new: true }
    );
    if (!req.body.relatedCash) {
      const msUpdate = await TreatmentVoucher.findOneAndUpdate(
        { _id: id },
        { $unset: { relatedCash: "" } },
        { new: true }
      );
    }
    if (!req.body.relatedBank) {
      const msUpdate = await TreatmentVoucher.findOneAndUpdate(
        { _id: id },
        { $unset: { relatedBank: "" } },
        { new: true }
      );
    }
    return res.status(200).send({ success: true, data: updateMedicineSale });
  } catch (error) {
    console.log(error);
    return res.status(200).send({ error: true, message: error.message });
  }
};

exports.excelImportTreatmentVouchers = async (req, res) => {
  try {
    let files = req.files;
    if (files.excel) {
      for (const i of files.excel) {
        const subpath = path.join("app", "controllers"); // Construct the subpath using the platform's path separator
        const newPath = __dirname.replace(subpath, "");
        const dest = path.join(newPath, i.path);
        const data = await UserUtil.readExcelDataForTreatmentVoucher(dest);
        console.log(data);
        await TreatmentVoucher.insertMany(data)
          .then((response) => {
            return res.status(200).send({
              success: true,
              data: response,
            });
          })
          .catch((error) => {
            return res.status(500).send({ error: true, message: error });
          });
      }
    }
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.getRelatedTreatmentVoucher = async (req, res) => {
  try {
    let {
      relatedPatient,
      startDate,
      endDate,
      createdBy,
      bankType,
      tsType,
      relatedDoctor,
      relatedTreatmentSelection,
    } = req.body;
    let query = { isDeleted: false };
    if (startDate && endDate)
      query.createdAt = { $gte: startDate, $lte: endDate };
    if (relatedPatient) query.relatedPatient = relatedPatient;
    if (bankType) query.bankType = bankType;
    if (createdBy) query.createdBy = createdBy;
    if (tsType) query.tsType = tsType;
    if (relatedTreatmentSelection)
      query.relatedTreatmentSelection = relatedTreatmentSelection;
    console.log(query, relatedDoctor);
    let result = await TreatmentVoucher.find(query)
      .populate(
        "relatedTreatment relatedBank relatedCash relatedPatient relatedTreatmentSelection relatedAccounting payment createdBy"
      )
      .populate({
        path: "relatedTreatmentSelection",
        model: "TreatmentSelections",
        populate: {
          path: "relatedAppointments",
          model: "Appointments",
          populate: {
            path: "relatedDoctor",
            model: "Doctors",
          },
        },
      })
      .populate({
        path: "repay",
        populate: {
          path: "repayId",
          populate: [
            {
              path: "relatedTreatmentVoucher",
            },
            {
              path: "relatedPatient",
            },
            {
              path: "relatedBank",
            },
            {
              path: "relatedCash",
            },
          ],
        },
      });
    if (relatedDoctor) {
      result = result.filter((item) => {
        if (
          item.relatedTreatmentSelection &&
          Array.isArray(item.relatedTreatmentSelection.relatedAppointments)
        ) {
          const hasMatchingAppointment =
            item.relatedTreatmentSelection.relatedAppointments.some(
              (i) =>
                i.relatedDoctor &&
                i.relatedDoctor._id &&
                i.relatedDoctor._id.toString() === relatedDoctor
            );
          console.log(hasMatchingAppointment);
          return hasMatchingAppointment;
        } else {
          return false; // Or handle the case when there are no relatedAppointments as needed
        }
      });
    }

    if (!result)
      return res.status(404).json({ error: true, message: "No Record Found" });
    return res.status(200).send({ success: true, data: result });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      error: true,
      message: "An Error Occured While Fetching Related Treatment Vouchers",
    });
  }
};

exports.searchTreatmentVoucher = async (req, res, next) => {
  try {
    let query = { isDeleted: false };
    let { search, relatedPatient } = req.body;
    if (relatedPatient) query.relatedPatient = relatedPatient;
    if (search) query.$text = { $search: search };
    const result = await TreatmentVoucher.find(query)
      .populate(
        "createdBy relatedTreatment relatedAppointment relatedPatient relatedTreatmentSelection"
      )
      .populate({
        path: "repay",
        populate: {
          path: "repayId",
          populate: [
            {
              path: "relatedTreatmentVoucher",
            },
            {
              path: "relatedPatient",
            },
            {
              path: "relatedBank",
            },
            {
              path: "relatedCash",
            },
          ],
        },
      });
    if (result.length === 0)
      return res.status(404).send({ error: true, message: "No Record Found!" });
    return res.status(200).send({ success: true, data: result });
  } catch (err) {
    return res.status(500).send({ error: true, message: err.message });
  }
};

exports.getCode = async (req, res) => {
  let data = {};
  try {
    console.log("this is  get code ");
    const latestDocument = await TreatmentVoucher.find({}, { seq: 1 })
      .sort({ _id: -1 })
      .limit(1)
      .exec();
    if (latestDocument.length === 0)
      data = { ...data, seq: 1, code: "TVC-" + "-1" }; // if seq is undefined set initial patientID and seq
    if (latestDocument.length > 0) {
      const increment = (latestDocument[0].seq || 0) + 1;
      data = { ...data, code: "TVC-" + "-" + increment, seq: increment };
    }
    return res.status(200).send({ success: true, data: data });
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.getCodeMS = async (req, res) => {
  let data = {};
  try {
    console.log("this si today");
    const latestDocument = await TreatmentVoucher.find(
      { tsType: "MS" },
      { seq: 1 }
    )
      .sort({ _id: -1 })
      .limit(1)
      .exec();
    if (latestDocument.length === 0)
      data = { ...data, seq: 1, code: "MVC-" + "-1" }; // if seq is undefined set initial patientID and seq
    if (latestDocument.length > 0) {
      const increment = (latestDocument[0].seq || 0) + 1;
      data = { ...data, code: "MVC-" + "-" + increment, seq: increment };
    }
    return res.status(200).send({ success: true, data: data });
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.createTreatmentVoucher = async (req, res, next) => {
  let data = req.body;
  try {
    const newTreatmentVoucher = new TreatmentVoucher(data);
    const result = await newTreatmentVoucher.save();
    res.status(200).send({
      message: "TreatmentVoucher create success",
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.updateTreatmentVoucher = async (req, res, next) => {
  try {
    let data = req.body;
    let result;
    const {
      tsType,
      multiTreatment,
      relatedTreatmentSelection,
      id,
      relatedCash,
      relatedBank,
      totalAmount,
      totalPaidAmount,
      relatedPatient,
    } = req.body;

    console.log(req.body);

    let parsedMulti = JSON.parse(multiTreatment);
    let query = {
      _id: id,
    };
    relatedBank
      ? (query.relatedBank = { $exists: true })
      : (query.relatedCash = { $exists: true });
    // console.log("parse Multi is ", parsedMulti)
    let TSArray = [];
    let files = req.files;
    let findVoucherById = await TreatmentVoucher.findOne(query);
    let findDebt = await Debt.findOne({ relatedTreatmentVoucher: id });
    if (files.payment) {
      for (const element of files.payment) {
        let imgPath = element.path.split("cherry-k")[1];
        const attachData = {
          fileName: element.originalname,
          imgUrl: imgPath,
          image: "payment",
        };
        const attachResult = await Attachment.create(attachData);
        console.log(attachResult, "result");
        attachID = attachResult._id;
      }
    }
    // for Debt
    let debtAmount = totalAmount - totalPaidAmount;
    if (debtAmount === 0) {
      if (findDebt) {
        let updateDebt = await Debt.findOneAndUpdate(
          { relatedTreatmentVoucher: id },
          { isPaid: true, balance: debtAmount }
        );
      }
    } else {
      if (findDebt) {
        let updateDebt = await Debt.findOneAndUpdate(
          { relatedTreatmentVoucher: id },
          { balance: debtAmount }
        );
      } else {
        let debt = await Debt.create({
          relatedPatient: relatedPatient,
          balance: debtAmount,
          relatedTreatmentVoucher: id,
        });
      }
    }
    if (tsType === "TSMulti") {
      for (const item of JSON.parse(relatedTreatmentSelection)) {
        await TreatmentSelection.findByIdAndDelete(item).then((res) => {
          console.log(item + " is Deleted");
        });
      }
      for (const i of parsedMulti) {
        data.multiTreatment = parsedMulti;
        data.relatedTreatment = i.item_id;
        data.discount = i.discountAmount;
        let result = await TreatmentSelection.create(data);
        TSArray.push(result._id);
      }
      data = { ...data, relatedTreatmentSelection: TSArray };
      data.multiTreatment = parsedMulti;
    }
    // console.log("this is data before relatedBank ", findVoucherById, relatedBank)
    if (findVoucherById) {
      result = await TreatmentVoucher.findOneAndUpdate({ _id: id }, data, {
        new: true,
      }).populate(
        "createdBy relatedTreatment relatedTherapist relatedAppointment relatedPatient"
      );
    } else {
      let removeItem;
      relatedBank
        ? (removeItem = { relatedCash: "" })
        : (removeItem = { relatedBank: "", bankType: "" });
      // console.log(removeItem)
      result = await TreatmentVoucher.findOneAndUpdate(
        { _id: id },
        { ...data, $unset: removeItem },
        { new: true }
      ).populate(
        "createdBy relatedTreatment relatedTherapist relatedAppointment relatedPatient"
      );
    }

    return res.status(200).send({ success: true, data: result });
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.activateTreatmentVoucher = async (req, res, next) => {
  try {
    const result = await TreatmentVoucher.findOneAndUpdate(
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

exports.getTodaysTreatmentVoucher = async (req, res) => {
  try {
    let query = { isDeleted: false };
    var start = new Date();
    var end = new Date();
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    if (start && end) query.originalDate = { $gte: start, $lt: end };
    const result = await TreatmentVoucher.find(query)
      .populate("createdBy relatedAppointment relatedPatient")
      .populate({
        path: "relatedTreatment",
        model: "Treatments",
        populate: {
          path: "treatmentName",
          model: "TreatmentLists",
        },
      })
      .populate({
        path: "repay",
        populate: {
          path: "repayId",
          populate: [
            {
              path: "relatedTreatmentVoucher",
            },
            {
              path: "relatedPatient",
            },
            {
              path: "relatedBank",
            },
            {
              path: "relatedCash",
            },
          ],
        },
      });
    if (result.length === 0)
      return res.status(404).json({ error: true, message: "No Record Found!" });
    return res.status(200).send({ success: true, data: result });
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
  }
};

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

exports.TreatmentVoucherFilter = async (req, res) => {
  let query = {
    // relatedBank: { $exists: true },
    isDeleted: false,
  };

  let response = {
    success: true,
    data: {},
  };

  const {
    discountType,
    income,
    startDate,
    endDate,
    skip,
    limit,
    createdBy,
    purchaseType,
    relatedDoctor,
    bankType,
    tsType,
    relatedPatient,
    bankID,
    townShip,
    salesPerson,
  } = req.query;

  limit ? (limit = parseInt(limit)) : 10;
  skip ? (skip = parseInt(skip)) : 1;

  const startDay = new Date(startDate);
  startDay.setHours(0, 0, 0, 0);
  const endDay = new Date(endDate);
  endDay.setHours(23, 59, 59, 999);

  const FilterByDate = {
    isDeleted: false,
    createdAt: { $gte: startDay, $lte: endDay },
  };

  const FilterByTownShip = {
    isDeleted: false,
    townShip: { $regex: new RegExp(townShip, "i") },
  };

  if (townShip) query = { ...query, ...FilterByTownShip };

  if (startDate && endDate && townShip)
    query = { ...query, ...FilterByDate, ...FilterByTownShip };

  if (discountType) query.discountType = discountType;
  if (relatedPatient) query.relatedPatient = relatedPatient;
  if (bankType) query.bankType = bankType;
  if (createdBy) query.createdBy = createdBy;
  if (tsType) query.tsType = tsType;
  if (bankID) query.relatedBank = bankID;
  if (purchaseType) query.purchaseType = purchaseType;
  if (relatedDoctor) query.relatedDoctor = relatedDoctor;
  if (salesPerson) query.salesPerson = salesPerson;

  response.data = await filterTreatmentVoucherService(query);

  res.status(200).send({
    success: true,
    meta_data: {
      totalPage: Math.ceil(response.data.length / limit),
      totalData: response.data.length,
      currentPage: Math.ceil(skip / limit) + 1,
    },
    data: response.data,
  });
};

exports.filterTreatmentVoucher = async (req, res, next) => {
  try {
    let query = { isDeleted: false };
    let { startDate, endDate, relatedDoctor, relatedPatient } = req.query;
    if (startDate && endDate)
      query.createdAt = { $gte: startDate, $lte: endDate };
    if (relatedDoctor) query.relatedDoctor = relatedDoctor;
    if (relatedPatient) query.relatedPatient = relatedPatient;
    if (Object.keys(query).length === 0)
      return res.status(404).send({
        error: true,
        message: "Please Specify A Query To Use This Function",
      });
    const result = await TreatmentVoucher.find(query).populate(
      "createdBy relatedTreatment relatedAppointment relatedPatient payment relatedTreatmentSelection "
    );
    if (result.length === 0)
      return res.status(404).send({ error: true, message: "No Record Found!" });
    res.status(200).send({ success: true, data: result });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ error: true, message: err.message });
  }
};

exports.createSingleMedicineSale = async (req, res) => {
  let data = req.body;

  let {
    remark,
    relatedBank,
    relatedCash,
    totalAmount,
    msPaidAmount,
    medicineItems,
    balance,
    userType,
    add_point,
  } = req.body;

  let createdBy = req.credentials.id;
  //if add point exists then

  if (add_point) {
    const percentByAmount = await CalculateTotalAmountByPercent(req, res);
    if (!percentByAmount.success)
      return res
        .status(500)
        .send({ success: false, message: percentByAmount.message });
    data.pay_point_to_customer = percentByAmount.point;
    data.giftedPoints = percentByAmount.gift_point;
  }

  if (medicineItems !== undefined) {
    for (const e of medicineItems) {
      const result = await MedicineItems.find({ _id: e.item_id });
      let totalUnit = result[0].totalUnit - e.qty;
      const from = result[0].fromUnit;
      const to = result[0].toUnit;
      const currentQty = (from * totalUnit) / to;

      try {
        const result = await MedicineItems.findOneAndUpdate(
          { _id: e.item_id },
          { totalUnit: totalUnit, currentQuantity: currentQty },
          { new: true }
        );
      } catch (error) {
        return res.status(500).send({ error: true, message: error.message });
      }

      const logResult = await Log.create({
        relatedTreatmentSelection: null,
        relatedAppointment: null,
        relatedMedicineItems: e.item_id,
        currentQty: e.stock,
        actualQty: e.actual,
        finalQty: totalUnit,
        type: "Medicine Sale",
        createdBy: createdBy,
        salesPerson: userType,
      });
    }
  }

  //_________COGS___________
  const medicineResult = await MedicineItems.find({
    _id: { $in: medicineItems.map((item) => item.item_id) },
  });

  const purchaseTotal = medicineResult.reduce(
    (accumulator, currentValue) => accumulator + currentValue.purchasePrice,
    0
  );

  const inventoryResult = Transaction.create({
    amount: purchaseTotal,
    date: Date.now(),
    remark: remark,
    relatedAccounting: "64a8e06755a87deaea39e17b", //Medicine inventory
    type: "Credit",
    createdBy: createdBy,
    salesPerson: userType,
  });

  var inventoryAmountUpdate = await Accounting.findOneAndUpdate(
    { _id: "64a8e06755a87deaea39e17b" }, // Medicine inventory
    { $inc: { amount: -purchaseTotal } }
  );

  const COGSResult = Transaction.create({
    amount: purchaseTotal,
    date: Date.now(),
    remark: remark,
    relatedAccounting: "64a8e10b55a87deaea39e193", //Medicine Sales COGS
    type: "Debit",
    relatedTransaction: inventoryResult._id,
    createdBy: createdBy,
    salesPerson: userType,
  });

  var inventoryUpdate = await Transaction.findOneAndUpdate(
    { _id: inventoryResult._id },
    {
      relatedTransaction: COGSResult._id,
    },
    { new: true }
  );

  var COGSUpdate = await Accounting.findOneAndUpdate(
    { _id: "64a8e10b55a87deaea39e193" }, //Medicine Sales COGS
    { $inc: { amount: purchaseTotal } }
  );
  //_________END_OF_COGS___________

  //..........Transaction.............................
  const fTransaction = new Transaction({
    amount: data.msPaidAmount,
    date: Date.now(),
    remark: remark,
    relatedAccounting: "648095b57d7e4357442aa457", //Sales Medicines
    type: "Credit",
    createdBy: createdBy,
    salesPerson: userType,
  });

  const fTransResult = await fTransaction.save();

  var amountUpdate = await Accounting.findOneAndUpdate(
    { _id: "648095b57d7e4357442aa457" }, //Sales Medicines
    { $inc: { amount: data.msPaidAmount } }
  );

  //sec transaction
  const secTransaction = new Transaction({
    amount: data.msPaidAmount,
    date: Date.now(),
    remark: remark,
    relatedBank: relatedBank,
    relatedCash: relatedCash,
    type: "Debit",
    relatedTransaction: fTransResult._id,
    createdBy: createdBy,
    salesPerson: userType,
  });

  const secTransResult = await secTransaction.save();

  var fTransUpdate = await Transaction.findOneAndUpdate(
    { _id: fTransResult._id },
    {
      relatedTransaction: secTransResult._id,
    },
    { new: true }
  );

  if (relatedBank) {
    var amountUpdate = await Accounting.findOneAndUpdate(
      { _id: relatedBank },
      { $inc: { amount: data.msPaidAmount } }
    );
  } else if (relatedCash) {
    var amountUpdate = await Accounting.findOneAndUpdate(
      { _id: relatedCash },
      { $inc: { amount: data.msPaidAmount } }
    );
  }
  let objID = "";
  if (relatedBank) objID = relatedBank;
  if (relatedCash) objID = relatedCash;
  //transaction
  const acc = await Accounting.find({ _id: objID });
  if (acc.length > 0) {
    const accResult = await Accounting.findOneAndUpdate(
      { _id: objID },
      { amount: data.msPaidAmount + parseInt(acc[0].amount) },
      { new: true }
    );
  }

  data = {
    ...data,
    relatedTransaction: [fTransResult._id, secTransResult._id],
    createdBy: createdBy,
    purchaseTotal: purchaseTotal,
    salesPerson: userType,
  };

  if (purchaseTotal) data.purchaseTotal = purchaseTotal;

  //..........END OF TRANSACTION.....................
  console.log(data);
  const newMedicineSale = new TreatmentVoucher(data);
  const medicineSaleResult = await newMedicineSale.save();

  if (req.body.msBalance) {
    const debtCreate = await Debt.create({
      balance: req.body.msBalance,
      relatedPatient: data.relatedPatient,
      relatedTreatmentVoucher: medicineSaleResult._id,
    });
  }

  if (balance) {
    console.log("this is balance ", balance);
  }

  if (req.body.add_point) {
    await AddPointByInput(data.relatedPatient, data.pay_point_to_customer);
    await checkAndUpdateTierOfPatient(data.relatedPatient);
    await createPointHistory({
      type: "point_earned",
      relatedPatient: data.relatedPatient,
      point: data.pay_point_to_customer,
      relatedTreatmentVoucher: medicineSaleResult._id,
    });
  }

  res.status(200).send({
    message: "MedicineSale Transaction success",
    success: true,
    data: medicineSaleResult,
  });
};

exports.combineMedicineSale = async (req, res) => {
  let data = req.body;
  let { remark, relatedBank, relatedCash, msPaidAmount, medicineItems, id } =
    req.body;
  let createdBy = req.credentials.id;
  if (medicineItems !== undefined) {
    for (const e of medicineItems) {
      const result = await MedicineItems.find({ _id: e.item_id });
      let totalUnit = result[0].totalUnit - e.qty;
      const from = result[0].fromUnit;
      const to = result[0].toUnit;
      const currentQty = (from * totalUnit) / to;
      try {
        const result = await MedicineItems.findOneAndUpdate(
          { _id: e.item_id },
          { totalUnit: totalUnit, currentQuantity: currentQty },
          { new: true }
        );
      } catch (error) {
        return res.status(500).send({ error: true, message: error.message });
      }
      const logResult = await Log.create({
        relatedTreatmentSelection: null,
        relatedAppointment: null,
        relatedMedicineItems: e.item_id,
        currentQty: e.stock,
        actualQty: e.actual,
        finalQty: totalUnit,
        type: "Medicine Sale",
        createdBy: createdBy,
      });
    }
  }
  if (req.body.msBalance) {
    const debtCreate = await Debt.create({
      balance: req.body.msBalance,
      relatedPatient: data.relatedPatient,
      relatedTreatmentVoucher: treatmentVoucherResult._id,
    });
    var updateDebt = await Patient.findOneAndUpdate(
      { _id: relatedPatient },
      { $inc: { debtBalance: req.body.msBalance } }
    );
  }
  //_________COGS___________
  const medicineResult = await MedicineItems.find({
    _id: { $in: medicineItems.map((item) => item.item_id) },
  });
  const purchaseTotal = medicineResult.reduce(
    (accumulator, currentValue) => accumulator + currentValue.purchasePrice,
    0
  );

  const inventoryResult = Transaction.create({
    amount: purchaseTotal,
    date: Date.now(),
    remark: remark,
    relatedAccounting: "64a8e06755a87deaea39e17b", //Medicine inventory
    type: "Credit",
    createdBy: createdBy,
  });
  var inventoryAmountUpdate = await Accounting.findOneAndUpdate(
    { _id: "64a8e06755a87deaea39e17b" }, // Medicine inventory
    { $inc: { amount: -purchaseTotal } }
  );
  const COGSResult = Transaction.create({
    amount: purchaseTotal,
    date: Date.now(),
    remark: remark,
    relatedAccounting: "64a8e10b55a87deaea39e193", //Medicine Sales COGS
    type: "Debit",
    relatedTransaction: inventoryResult._id,
    createdBy: createdBy,
  });
  var inventoryUpdate = await Transaction.findOneAndUpdate(
    { _id: inventoryResult._id },
    {
      relatedTransaction: COGSResult._id,
    },
    { new: true }
  );
  var COGSUpdate = await Accounting.findOneAndUpdate(
    { _id: "64a8e10b55a87deaea39e193" }, //Medicine Sales COGS
    { $inc: { amount: purchaseTotal } }
  );
  //_________END_OF_COGS___________

  //..........Transaction.............................
  const fTransaction = new Transaction({
    amount: data.msPaidAmount,
    date: Date.now(),
    remark: remark,
    relatedAccounting: "648095b57d7e4357442aa457", //Sales Medicines
    type: "Credit",
    createdBy: createdBy,
  });
  const fTransResult = await fTransaction.save();
  var amountUpdate = await Accounting.findOneAndUpdate(
    { _id: "648095b57d7e4357442aa457" }, //Sales Medicines
    { $inc: { amount: data.msPaidAmount } }
  );
  //sec transaction
  const secTransaction = new Transaction({
    amount: data.msPaidAmount,
    date: Date.now(),
    remark: remark,
    relatedBank: relatedBank,
    relatedCash: relatedCash,
    type: "Debit",
    relatedTransaction: fTransResult._id,
    createdBy: createdBy,
  });
  const secTransResult = await secTransaction.save();
  var fTransUpdate = await Transaction.findOneAndUpdate(
    { _id: fTransResult._id },
    {
      relatedTransaction: secTransResult._id,
    },
    { new: true }
  );
  if (relatedBank) {
    var amountUpdate = await Accounting.findOneAndUpdate(
      { _id: relatedBank },
      { $inc: { amount: data.msPaidAmount } }
    );
  } else if (relatedCash) {
    var amountUpdate = await Accounting.findOneAndUpdate(
      { _id: relatedCash },
      { $inc: { amount: data.msPaidAmount } }
    );
  }
  let objID = "";
  if (relatedBank) objID = relatedBank;
  if (relatedCash) objID = relatedCash;
  //transaction
  const acc = await Accounting.find({ _id: objID });
  if (acc.length > 0) {
    const accResult = await Accounting.findOneAndUpdate(
      { _id: objID },
      { amount: parseInt(msPaidAmount) + parseInt(acc[0].amount) },
      { new: true }
    );
  }
  data = {
    ...data,
    relatedTransaction: [fTransResult._id, secTransResult._id],
    createdBy: createdBy,
    purchaseTotal: purchaseTotal,
  };
  if (purchaseTotal) data.purchaseTotal = purchaseTotal;
  //..........END OF TRANSACTION.....................

  const medicineSaleResult = await TreatmentVoucher.findOneAndUpdate(
    { _id: id },
    data,
    { new: true }
  );
  if (req.body.msBalance) {
    const debtCreate = await Debt.create({
      balance: req.body.msBalance,
      relatedPatient: data.relatedPatient,
      relatedTreatmentVoucher: medicineSaleResult._id,
    });
  }
  res.status(200).send({
    message: "MedicineSale Combination success",
    success: true,
    data: medicineSaleResult,
  });
};

//get treatment voucher by doctor id
exports.getTreatmentVoucherByDoctorId = async (req, res) => {
  let findDoctorOrTherapist;
  let { name, code, isDoctor, startDate, endDate } = req.body;
  let query = { isDeleted: false, name: name, code: code };
  if (isDoctor) {
    findDoctorOrTherapist = await Doctor.find(query).select("-code");
  } else {
    findDoctorOrTherapist = await Therapist.find(query).select("-code");
  }

  let query2 = { isDeleted: false };
  let doctor = await Doctor.find({ name: name });
  let therapist = await Therapist.find({ name: name });
  console.log("this is getTreament voucer by doctor id", name, code);
  if (findDoctorOrTherapist[0]._id) {
    isDoctor
      ? (query2.relatedDoctor = findDoctorOrTherapist[0]._id)
      : (query2.relatedTherapist = findDoctorOrTherapist[0]._id);
    query2.tsType = "TS";
    startDate && endDate
      ? (query2.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        })
      : startDate
      ? (query2.createdAt = { $gte: new Date(startDate) })
      : endDate
      ? (query2.createdAt = { $lte: new Date(endDate) })
      : "";
    let querySingleTreatmentVoucherById = await TreatmentVoucher.find(query2)
      .populate(
        "createdBy relatedTreatment relatedAppointment relatedPatient multiTreatment.item_id relatedCash relatedBank relatedDoctor medicineItems.item_id relatedPackageSelection relatedPackage"
      )
      .populate({
        path: "relatedTreatmentSelection",
        model: "TreatmentSelections",
        populate: [
          {
            path: "relatedTreatment",
            model: "Treatments",
          },
          {
            path: "relatedAppointments",
            model: "Appointments",
            populate: [
              {
                path: "relatedPatient",
                model: "Patients",
              },
              {
                path: "relatedDoctor",
                model: "Doctors",
              },
              {
                path: "relatedTherapist",
                model: "Therapists",
              },
              {
                path: "relatedNurse",
                model: "Nurses",
              },
              {
                path: "relatedTreatment",
                model: "Treatments",
              },
            ],
          },
        ],
      });
    let { tsType, ...query3 } = query2;
    query3.tsType = "TSMulti";
    startDate && endDate
      ? (query3.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        })
      : startDate
      ? (query3.createdAt = { $gte: new Date(startDate) })
      : endDate
      ? (query3.createdAt = { $lte: new Date(endDate) })
      : "";
    console.log("tstype is ", query3);
    let queryTsMultiTreatmentVoucherById = await TreatmentVoucher.find(query3)
      .populate(
        "createdBy relatedTreatment relatedAppointment relatedPatient multiTreatment.item_id relatedCash relatedBank relatedDoctor medicineItems.item_id relatedPackageSelection relatedPackage"
      )
      .populate({
        path: "relatedTreatmentSelection",
        model: "TreatmentSelections",
        populate: [
          {
            path: "relatedTreatment",
            model: "Treatments",
          },
          {
            path: "relatedAppointments",
            model: "Appointments",
            populate: [
              {
                path: "relatedPatient",
                model: "Patients",
              },
              {
                path: "relatedDoctor",
                model: "Doctors",
              },
              {
                path: "relatedTherapist",
                model: "Therapists",
              },
              {
                path: "relatedNurse",
                model: "Nurses",
              },
              {
                path: "relatedTreatment",
                model: "Treatments",
              },
            ],
          },
        ],
      });

    query3.tsType = "Combined";
    console.log("query3 ", query3);
    let queryCombinedTreatmentVoucherById = await TreatmentVoucher.find(query3)
      .populate(
        "createdBy relatedTreatment relatedAppointment relatedPatient multiTreatment.item_id relatedCash relatedBank relatedDoctor medicineItems.item_id relatedPackageSelection relatedPackage"
      )
      .populate({
        path: "relatedTreatmentSelection",
        model: "TreatmentSelections",
        populate: [
          {
            path: "relatedTreatment",
            model: "Treatments",
          },
          {
            path: "relatedAppointments",
            model: "Appointments",
            populate: [
              {
                path: "relatedPatient",
                model: "Patients",
              },
              {
                path: "relatedDoctor",
                model: "Doctors",
              },
              {
                path: "relatedTherapist",
                model: "Therapists",
              },
              {
                path: "relatedNurse",
                model: "Nurses",
              },
              {
                path: "relatedTreatment",
                model: "Treatments",
              },
            ],
          },
        ],
      });
    return res.status(200).send({
      success: true,
      TSSingle: querySingleTreatmentVoucherById,
      TSMulti: queryTsMultiTreatmentVoucherById,
      TSCombined: queryCombinedTreatmentVoucherById,
      doctor: doctor || null,
      therapist: therapist || null,
    });
  } else {
    return res.status(200).send({
      success: true,
      data: "There is no treatment voucher",
      doctor: doctor || null,
      therapist: therapist || null,
    });
  }
};

exports.deleteTreatmentVoucher = async (req, res, next) => {
  let { id } = req.params;
  await TreatmentVoucher.findByIdAndUpdate(id, { isDeleted: true });
  return res
    .status(200)
    .send({ success: true, message: "Successfully Deleted " });
};

exports.getTreatmentVoucherLists = async (req, res) => {
  try {
    let { treatmentName } = req.query;

    const result = await FilterTreatmentInVoucherLists(treatmentName);

    return res.status(200).send({ success: true, data: result });
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
  }
};
