"use strict"

exports.return404Response = (data) => {
    return {
        statusCode: 404,
        success: false,
        message: `${data} doesn't exist`
    }
}