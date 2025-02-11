const mongoose = require("mongoose");

const CartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        variant: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Variant",
          required: true,
        },
        sizeVariant: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SizeVariant",
          required: true,
        },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true },
        discountPrice: { type: Number },
        totalPrice: { type: Number, required: true },
        addedAt: { type: Date, default: Date.now },
      },
    ],
    totalItems: { type: Number, default: 0 },
    totalPrice: { type: Number, default: 0 },
    isCheckedOut: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    expiresAt: {
      type: Date,
      default: () => Date.now() + 7 * 24 * 60 * 60 * 1000,
    },
    discountCode: { type: String },
    discountAmount: { type: Number, default: 0 },
    shipping: {
      address: { type: String },
      method: { type: String },
      cost: { type: Number, default: 0 },
    },
    taxes: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Cart = mongoose.model("Cart", CartSchema);
module.exports = Cart;
