"use strict"

const registerApiServiceHelper = require("../helper/registerApiServiceHelper")

exports.listAllData = async (req,res) => {
    const paths = req.path.split("/v1/")[1]
    console.log("req",paths, registerApiServiceHelper.getMethods(paths))
    let datas = await registerApiServiceHelper.getMethods(paths)[0][paths].list(req.query)
    res.status(200).send({success: true, message: "Get All Datas", data: datas.data, meta_data: datas.meta_data})
}

exports.createData = async (req,res) => {
    const paths = req.path.split("/v1/")[1]
    let datas = await registerApiServiceHelper.getMethods(paths)[0][paths].create(req.body)
    res.status(200).send({success: true, message: "Create Data", data: datas}) 
}

exports.dataById = async (req,res) => {
    const paths = req.path.split("/")[3]
    let datas = await registerApiServiceHelper.getMethods(paths)[0][paths].listById(req.params.id)
    res.status(200).send({success: true, message: "Get Data By Id", data: datas})
}

exports.updateDataById = async (req,res) => {
    const paths = req.path.split("/")[3]
    let datas = await registerApiServiceHelper.getMethods(paths)[0][paths].update(req.params.id, req.body)
    res.status(200).send({success: true, message: "Update Data By Id", data: datas})
}

exports.deleteDataById = async (req,res) => {
    const paths = req.path.split("/")[3]
    let datas = await registerApiServiceHelper.getMethods(paths)[0][paths].delete(req.params.id)
    res.status(200).send({success: true, message: "delete Data By Id", data: datas})
}