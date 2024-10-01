const multer = require("multer");
const path = require("path");
const fs = require("fs");

const imageUploadDir = path.join(__dirname, "../../Uploads");

// Ensure the base upload directory exists
if (!fs.existsSync(imageUploadDir)) {
  fs.mkdirSync(imageUploadDir);
}

const storageConfiguration = multer.diskStorage({
  destination: (req, file, cb) => {
    // Choose the folder based on fieldname
    const uploadFolder =
      file.fieldname === "treatmentBanner"
        ? path.join(imageUploadDir, "bannerUploads")
        : path.join(imageUploadDir, "treatmentUploads");

    // Ensure the folder exists
    if (!fs.existsSync(uploadFolder)) {
      fs.mkdirSync(uploadFolder, { recursive: true });
    }

    cb(null, uploadFolder);
  },
  filename: (req, file, cb) => {
    const suffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${suffix}-${file.originalname}`);
  },
});

const fileFilterConfigure = (req, file, cb) => {
  if (["image/jpeg", "image/png", "image/jpg"].includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type"), false);
  }
};

const upload = multer({
  storage: storageConfiguration,
  fileFilter: fileFilterConfigure,
});

module.exports = upload;
