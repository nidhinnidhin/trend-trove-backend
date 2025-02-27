const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema({
  image: {
    type: String,
    required: [true, "Banner image is required"],
  },
  title: {
    type: String,
    required: [true, "Banner title is required"],
  },
  description: {
    type: String,
    required: [true, "Banner description is required"],
  },
  discount: {
    type: Number,
    required: [true, "Discount percentage is required"],
    min: 0,
    max: 100,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Banner", bannerSchema);
