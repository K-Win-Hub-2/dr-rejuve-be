const fs = require("fs");

exports.unlink = (filepath) => {
  fs.unlink(filepath, (err) => {
    if (err) throw err;
    console.log("File is deleted.");
  });
};
