"use strict"

const giftPoint = require("../models/giftPointRule")

exports.listAllGiftPoint = async (params) =>{
    try{
        let { point, startDate, endDate } = params
        let query = {}
        point ? query.point = { $gte: point } : ""
        startDate && endDate? query.date = { $gte: new Date(startDate), $lt: new Date(endDate) } : ""
        let result = await giftPoint.find(query)
        return { data: result }; 
     }
     catch(err){
         console.log("Error is", err.message)
     }
}

exports.createAllGiftPoint = async (datas) => {
    // Implement points creation logic here
    try{
       let result = await giftPoint.create(datas)
       return result; 
    }
    catch(err){
        console.log("Error is", err.message)
    }
}

exports.getAllGiftPointById = async (id) => {
    try{
       let result = await giftPoint.findById(id)
        return result; 
    }catch(err){
        console.log("Error is", err.message)
    }
    
}

exports.updateAllGiftPointById = async (id, datas) => {
    try{
       let result = await giftPoint.findByIdAndUpdate(id, datas, { new: true })
       return result; 
    }catch(err){
        console.log("Error is", err.message)
    }
}

exports.deleteAllGiftPointById = async (id) => {
    try{
       let result = await giftPoint.findByIdAndDelete(id)
       return result; 
    }catch(err){
        console.log("Error is", err.message)
    }
}