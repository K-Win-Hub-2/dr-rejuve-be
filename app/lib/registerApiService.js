"use strict";

const { ServiceDatas } = require("../constants/apiServiceConstant");
const registerApiServiceHelper = require("../helper/registerApiServiceHelper")
exports.run = () => {
    //Register Service
    registerApiServiceHelper.setMethods(ServiceDatas)
    console.log("Services registered successfully")
}   