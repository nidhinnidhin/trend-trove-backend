const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },
    material: { type: String },
    pattern: { type: String },
    reviews: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Review",
      required: true,
    },
    gender: { type: String, required: true },
    variants: [{ type: mongoose.Schema.Types.ObjectId, ref: "Variant" }],
    activeOffer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Offer",
    },
    discountedPrice: { type: Number },
    isDeleted: { type: Boolean, default: false },
    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", ProductSchema);
module.exports = Product;
