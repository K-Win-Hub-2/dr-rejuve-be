const { mergeObject } = require("../helper/mergeandfilterobject");
const { tierData } = require("../helper/tierHelpers");
const tierLevel = require("../models/tierLevel");

exports.listAllTiers = async (params) =>{
    let tiersData = mergeObject( tierData, params)
    try{
        let Tiers = await tierLevel.find(tiersData).populate("relatedFixedDiscountPercent")
        return Tiers; 
     }
     catch(err){
         console.log("Error is", err.message)
     }
}

exports.createTiers = async (datas) => {
    // Implement points creation logic here
    try{
       let createTiers = await tierLevel.create(datas)
       return createTiers; 
    }
    catch(err){
        console.log("Error is", err.message)
    }
}

exports.getTiers = async (id) => {
    try{
       let tiers = await tierLevel.findById(id).populate("relatedFixedDiscountPercent")
        return tiers; 
    }catch(err){
        console.log("Error is", err.message)
    }
    
}

exports.updateTiers = async (id, tierDatas) => {
    try{
       let result = await tierLevel.findByIdAndUpdate(id, tierDatas, { new: true })
       return result; 
    }catch(err){
        console.log("Error is", err.message)
    }
}

exports.deleteTiers = async (id) => {
    try{
       let result = await tierLevel.findByIdAndUpdate(id, {isDeleted: true}, { new: true })
       return result; 
    }catch(err){
        console.log("Error is", err.message)
    }
}