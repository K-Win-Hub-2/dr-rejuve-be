const { getPointHistory } = require("../services/pointHistoryService")

exports.listAllPointHistories = async (req, res) => {
    let data = await getPointHistory(req.query)
    res.status(200).send({ success: true, message: "Get All Point History", data: data })
}