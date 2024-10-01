"use strict"

const pointDiscount = require("../models/pointDiscount");

exports.getAllPointRuleDiscount = async (datas) => {
    try{
       const result = await pointDiscount.find(datas)
      return { data: result }; 
    }catch(err){
        console.log("Error is", err.message)
    }
    
}

exports.createPointRuleDiscount = async (datas) => {
    try{
       let result = await pointDiscount.create(datas)
       return result; 
    }
    catch(err){
        console.log("Error is", err.message)
    }
}

exports.getPointRuleDiscountById = async (id) => {
    try{
       let result = await pointDiscount.findById(id)
        return result; 
    }catch(err){
        console.log("Error is", err.message)
    }
    
}

exports.updatePointRuleDiscountById = async (id, datas) => {
    try{
       let result = await pointDiscount.findByIdAndUpdate(id, datas, { new: true })
       return result; 
    }catch(err){
        console.log("Error is", err.message)
    }
}

exports.deletePointRuleDiscountById = async (id) => {
    try{
       let result = await pointDiscount.findByIdAndUpdate(id, {isDeleted: true}, { new: true })
       return result; 
    }catch(err){
        console.log("Error is", err.message)
    }
}

