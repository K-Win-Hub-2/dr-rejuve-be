const { listAllTiers, createTiers, getTiers, updateTiers, deleteTiers } = require('../services/tierService')

exports.listTier = async (req,res) => {
    let tierData = await listAllTiers(req.query)
    res.status(200).send({success: true, message: "Get All Tier", data: tierData})
}

exports.createTier = async (req,res) => {
    let tierData = await createTiers(req.body)
    res.status(200).send({success: true, message: "Create Tiers", data: tierData})
}

exports.tierById = async (req,res) => {
    let tierData = await getTiers(req.params.id)
    res.status(200).send({success: true, message: "Get Tier By Id", data: tierData})
}

exports.updateTierById = async (req,res) => {
    let tierData = await updateTiers(req.params.id, req.body)
    res.status(200).send({success: true, message: "Update Tier By Id", data: tierData})
}

exports.deleteTierById = async (req,res) => {
    let tierData = await deleteTiers(req.params.id)
    res.status(200).send({success: true, message: "Delete Tier By Id", data: tierData})
}