const { model, Schema } = require("mongoose");

const adminBannerSchema = new Schema({
  isDeleted: {
    type: Boolean,
    default: false,
  },
  image: {
    type: String,
  },
});

const AdminBanner = model("AdminBanner", adminBannerSchema);
module.exports = AdminBanner;
