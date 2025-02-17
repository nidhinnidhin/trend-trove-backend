const mongoose = require('mongoose');

const BrandSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  image: { type: String, required: true },
  isDeleted: {type: Boolean, default: false},
}, { timestamps: true });

const Brand = mongoose.model('Brand', BrandSchema);
module.exports = Brand