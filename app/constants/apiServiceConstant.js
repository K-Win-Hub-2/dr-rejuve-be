"use strict"

const { getFixedDiscountPercentById, listAllFixedDiscountPercent, createFixedDiscountPercent, updateFixedDiscountPercentById, deleteFixedDiscountPercentById } = require("../services/fixDiscountPercentService")
const { listAllGiftPoint, createAllGiftPoint, updateAllGiftPointById, getAllGiftPointById, deleteAllGiftPointById } = require("../services/giftPointService")
const { getAllPointRuleDiscount, createPointRuleDiscount, updatePointRuleDiscountById, getPointRuleDiscountById, deletePointRuleDiscountById } = require("../services/pointDiscountRuleService")

exports.ServiceDatas = {
    "point-discount-rule": {
        list: getAllPointRuleDiscount, 
        create: createPointRuleDiscount, 
        update: updatePointRuleDiscountById, 
        listById: getPointRuleDiscountById,
        delete: deletePointRuleDiscountById,  //add delete functionality here
    },
    "gift-point": {
        list: listAllGiftPoint, 
        create: createAllGiftPoint, 
        update: updateAllGiftPointById, 
        listById: getAllGiftPointById,
        delete: deleteAllGiftPointById,
    },
    "fix-discount-percent": {
        list: listAllFixedDiscountPercent, 
        create: createFixedDiscountPercent, 
        update: updateFixedDiscountPercentById, 
        listById: getFixedDiscountPercentById,
        delete: deleteFixedDiscountPercentById,
    }
}