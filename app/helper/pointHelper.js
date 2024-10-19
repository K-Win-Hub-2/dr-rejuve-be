"use strict";
const fixedDiscountPercent = require("../models/fixedDiscountPercent");
const giftPointRule = require("../models/giftPointRule");
const patient = require("../models/patient");
const pointDiscount = require("../models/pointDiscount");
const pointRule = require("../models/pointRule");
const tierLevel = require("../models/tierLevel");
const { return404Response } = require("./404ErrorHelper");

//query Point Rule
// async function getPointDiscountRule(req,res){
//     let { treatmentType } = req.body
//     const pointData = await pointDiscount.find({type: treatmentType}).sort({from: -1, to: -1})
//     // if(pointData.length < 0) {
//     //     return res.status(404).send(return404Response("Specific Point Rule"))
//     // }
//     return pointData
// }

//query Tier Level And Calculate Discount
async function getPointDiscountRule(data) {
  let gift_Rule;

  let {
    discountId,
    totalAmount,
    treatmentType,
    relatedGiftPointRules,
    tsType,
    msTotalAmount,
    relatedExtraPoint,
  } = data;

  const { point, amount } = await pointRule.findOne({ type: treatmentType });

  relatedGiftPointRules
    ? (gift_Rule = await giftPointRule.findById(relatedGiftPointRules))
    : (gift_Rule = { point: 0 });

  const giftPoint = gift_Rule.point;

  if (tsType === "MS") {
    const pointAmount =
      (Number(msTotalAmount) * Number(point)) / Number(amount) +
      giftPoint +
      relatedExtraPoint;
    return { point: pointAmount, gift_point: giftPoint };
  }

  const { percent } = await fixedDiscountPercent.findById(discountId);

  const pointAmount =
    (Number(totalAmount) * Number(point)) / Number(amount) +
    giftPoint +
    relatedExtraPoint;

  const discountAmount =
    Number(totalAmount) - (Number(totalAmount) * Number(percent)) / 100;

  const realAmount = Number(totalAmount);

  return {
    point: pointAmount,
    discountTotalAmount: discountAmount,
    realTotalAmount: realAmount,
    percent: percent,
    gift_point: giftPoint,
    extraPoint: relatedExtraPoint,
  };
}

async function getPointRule(treatmentType) {
  const pointData = await pointRule
    .find({ type: treatmentType })
    .sort({ amount: -1 });
  return pointData[0];
}

exports.calculateDiscountByTotalAmount = (pointData, total, percent) => {
  const totalAmount = Number(total);
  for (let i = 0; i < pointData.length; i++) {
    const nextIndex = i + 1;
    const firstAmount = pointData[i].from;
    const secondAmount = pointData[i].to;
    console.log("fir", firstAmount, secondAmount);
    if (percent) {
      const pointRule = [30, 50];
      const percentFromArray =
        pointRule.filter((po) => po === Number(percent))[0] || 0;
      return { percent: percentFromArray, point: 1000 };
    } else if (firstAmount === secondAmount && totalAmount >= firstAmount) {
      return pointData[i];
    } else if (
      firstAmount === totalAmount ||
      (totalAmount > firstAmount && totalAmount < secondAmount)
    ) {
      return pointData[i];
    } else if (nextIndex === pointData.length) {
      return { from: 0, to: 0, percent: 0 };
    }
  }
};

// exports.PointData = {

//     point: null,
//     money: null,
//     minimum_point: null,
//     maximum_point: null
// }

exports.CalculateWithExtraPoint = async (id, extraPoint) => {
  await patient.findByIdAndUpdate(id, { $inc: { total_point: extraPoint } });
};

exports.AddPointByInput = async (id, totalPoint) => {
  await patient.findByIdAndUpdate(id, { $inc: { total_point: totalPoint } });
};

exports.checkWithTierRule = async (totalPoint) => {
  let id;
  const tierRule = await tierLevel.find().sort({ total_point: -1 });
  for (let i = 0; i < tierRule.length; i++) {
    if (totalPoint >= tierRule[i].total_point) {
      id = tierRule[i]._id;
      break;
    }
  }
  return id;
};

exports.checkAndUpdateTierOfPatient = async (id) => {
  const patientData = await patient.findById(id);
  const tierId = await this.checkWithTierRule(patientData.total_point);
  await patient.findByIdAndUpdate(id, { $set: { tierLevel: tierId } });
};

exports.CalculateAndPointToUserWithPointRule = async (req, res) => {
  let { totalAmount, percentFromInput } = req.body;
  const pointData = await getPointDiscountRule(req, res);
  let result = this.calculateDiscountByTotalAmount(
    pointData,
    totalAmount,
    percentFromInput
  );
  let addPoint = result.point;
  await patient.findByIdAndUpdate(req.body.relatedPatient, {
    $inc: { total_point: addPoint },
  });
  return addPoint;
};

exports.CalculateTotalAmountByPercent = async (req, res) => {
  let pointData;
  const {
    relatedPatient,
    totalAmount,
    treatmentType,
    relatedGiftPointRules,
    tsType,
    msTotalAmount,
    relatedExtraPoint,
  } = req.body;

  const patientData = await patient
    .findOne({ _id: relatedPatient, walletUser: true })
    .populate("tierLevel");

  if (!patientData)
    return { success: false, message: "Current User is not a wallet user." };

  tsType === "TSMulti"
    ? (pointData = await getPointDiscountRule({
        // discountId: patientData.tierLevel.relatedFixedDiscountPercent,
        totalAmount: totalAmount,
        treatmentType: treatmentType,
        relatedGiftPointRules: relatedGiftPointRules,
        relatedExtraPoint: relatedExtraPoint,
      }))
    : (pointData = await getPointDiscountRule({
        tsType: tsType,
        treatmentType: treatmentType,
        relatedGiftPointRules: relatedGiftPointRules,
        msTotalAmount: msTotalAmount,
        relatedExtraPoint: relatedExtraPoint,
      }));

  return { success: true, ...pointData };
};

//previous point rule with amount
// exports.CalculateTotalAmountByPercent = async (req,res) => {
//     // calculate total amount by percent
//     let { totalAmount, percentFromInput, treatmentType } = req.body
//     const pointData = await getPointDiscountRule(req,res)
//     let result = this.calculateDiscountByTotalAmount(pointData, totalAmount, percentFromInput)
//     if(Number(result.from) === 0 && Number(result.to) === 0) return {success: false, message: "Your Amount doesn't have enough to buy discount with point"}
//     const discountTotalAmount = Number(totalAmount * (1-(result.percent /100)))
//     const pointRuleData = await getPointRule(treatmentType)
//     const point = Math.floor((totalAmount * pointRuleData.point) / pointRuleData.amount)
//     return { success: true, percent: result.percent, realTotalAmount: totalAmount, discountTotalAmount: discountTotalAmount, point: point  }
// }
