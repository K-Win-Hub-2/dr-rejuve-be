const { createPoints, getPoints, updatePoints, getAllPoints } = require('../services/pointService')

exports.listAllPointModel = async (req,res) => {
    let points = await getAllPoints()
    res.status(200).send({success: true, message: "Get All Points", data: points})
}

exports.createPoint = async (req,res) => {
    let pointData = await createPoints(req.body)
    res.status(200).send({success: true, message: "Create Point", data: pointData})
}

exports.pointById = async (req,res) => {
    let pointData = await getPoints(req.params.id)
    res.status(200).send({success: true, message: "Get Point By Id", data: pointData})
}

exports.updatePointById = async (req,res) => {
    let updatedPoint = await updatePoints(req.params.id, req.body)
    res.status(200).send({success: true, message: "Update Point By Id", data: updatedPoint})
}