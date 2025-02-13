const mongoose = require("mongoose");

const WishlistSchema = new mongoose.Schema(
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
        addedAt: { type: Date, default: Date.now },
      },
    ],
    totalItems: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Wishlist = mongoose.model("Wishlist", WishlistSchema);
module.exports = Wishlist;
