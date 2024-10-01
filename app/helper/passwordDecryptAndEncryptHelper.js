const bcrypt = require("bcrypt")
const config = require("../../config/db")
const jwt = require("jsonwebtoken")

exports.encryptPassword = async (password) => {
    const saltRounds = 10
    // Generate salt
    // const serverSalt = await bcrypt.genSalt(saltRounds);
    // // Combine server-generated salt with user-defined salt
    // const combinedSalt = serverSalt + config["salt"];
    const combinedSalt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, combinedSalt)
    return hashedPassword
}

exports.comparePassword = (plainPassword, hashedPassword) => {
    return new Promise((resolve, reject) => {
        bcrypt.compare(plainPassword, hashedPassword, (err, isMatch) => {
            if (err) {
                return reject(err); // Reject the promise if there's an error
            }
            return resolve(isMatch); // Resolve the promise with the comparison result
        });
    });
};

exports.generateToken = (id,name,email) => {
    const token = jwt.sign(
        { credentials: `${id}.${config["jwtKey"]}.${name}.${email}` },
        config.jwtSecret,
        { expiresIn: config.defaultPasswordExpire },
      )
    return token
}