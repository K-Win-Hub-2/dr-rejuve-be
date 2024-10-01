"use strict"

const FixedDiscountPercents = require("../models/fixedDiscountPercent");

exports.listAllFixedDiscountPercent = async (params) =>{
    try{
        let { percent, startDate, endDate } = params
        let query = {}
        percent ? query.percent = { $gte: percent } : ""
        startDate && endDate? query.date = { $gte: new Date(startDate), $lt: new Date(endDate) } : ""
        let result = await FixedDiscountPercents.find(query)
        return { data: result }; 
     }
     catch(err){
         console.log("Error is", err.message)
     }
}

exports.createFixedDiscountPercent = async (datas) => {
    // Implement points creation logic here
    try{
       let result = await FixedDiscountPercents.create(datas)
       return result; 
    }
    catch(err){
        console.log("Error is", err.message)
    }
}

exports.getFixedDiscountPercentById = async (id) => {
    try{
       let result = await FixedDiscountPercents.findById(id)
        return result; 
    }catch(err){
        console.log("Error is", err.message)
    }
    
}

exports.updateFixedDiscountPercentById = async (id, datas) => {
    try{
       let result = await FixedDiscountPercents.findByIdAndUpdate(id, datas, { new: true })
       return result; 
    }catch(err){
        console.log("Error is", err.message)
    }
}

exports.deleteFixedDiscountPercentById = async (id) => {
    try{
       let result = await FixedDiscountPercents.findByIdAndUpdate(id,{isDeleted: true},{new: true})
       return result; 
    }catch(err){
        console.log("Error is", err.message)
    }
}