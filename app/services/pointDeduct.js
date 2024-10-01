const patient = require("../models/patient");

exports.deductSuccessOrFailure =  (total_point, deduct_point) => {
    let updated_point = total_point - deduct_point;
    if (updated_point >= 0) {
        return true
    } else {
        return false;
    }
}

exports.deductPointFromPatient = async (id, points) => {
    await patient.findByIdAndUpdate(id, {$inc: {total_point: -points}})
}