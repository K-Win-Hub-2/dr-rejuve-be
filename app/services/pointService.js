const { mergeObject } = require("../helper/mergeandfilterobject");
const pointRule = require("../models/pointRule")

exports.getAllPoints = async () => {
    try{
       let points = await pointRule.find()
        return points; 
    }catch(err){
        console.log("Error is", err.message)
    }
    
}

exports.createPoints = async (datas) => {
    // Implement points creation logic here
    try{
       let createPoint = await pointRule.create(datas)
       return createPoint; 
    }
    catch(err){
        console.log("Error is", err.message)
    }
}

exports.getPoints = async (userId) => {
    try{
       let points = await pointRule.findById(userId)
        return points; 
    }catch(err){
        console.log("Error is", err.message)
    }
    
}

exports.updatePoints = async (userId, newPoints) => {
    try{
       let points = await pointRule.findByIdAndUpdate(userId, newPoints, { new: true })
       return points; 
    }catch(err){
        console.log("Error is", err.message)
    }
}