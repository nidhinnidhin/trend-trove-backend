const Wishlist = require("../../models/wishlist/wishlistModal");
const Product = require("../../models/product/productModel");
const Variant = require("../../models/product/variantModel");
const SizeVariant = require("../../models/product/sizesVariantModel");
const asyncHandler = require("express-async-handler");

const addToWishlist = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, variantId, sizeVariantId } = req.body;

    console.log("Received IDs:", { productId, variantId, sizeVariantId });

    if (!productId || !variantId || !sizeVariantId) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const product = await Product.findById(productId);
    const variant = await Variant.findById(variantId);
    const sizeVariant = await SizeVariant.findById(sizeVariantId);

    console.log("Found Documents:", { product, variant, sizeVariant });

    if (!product || !variant || !sizeVariant) {
      return res
        .status(404)
        .json({ message: "Product, variant, or size variant not found" });
    }

    let wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist) {
      wishlist = new Wishlist({
        user: userId,
        items: [],
      });
    }

    wishlist.items = wishlist.items.filter(
      (item) => item.variant && item.sizeVariant
    );

    const itemExists = wishlist.items.some(
      (item) =>
        item.product.toString() === productId &&
        item.variant.toString() === variantId &&
        item.sizeVariant.toString() === sizeVariantId
    );

    if (!itemExists) {
      wishlist.items.push({
        product: productId,
        variant: variantId,
        sizeVariant: sizeVariantId,
      });

      await wishlist.save();
      return res.status(201).json({
        message: "Product added to wishlist successfully",
        wishlist,
      });
    }

    res.status(400).json({ message: "Product already in wishlist" });
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
  }
});

const getWishlist = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;

    const wishlist = await Wishlist.findOne({ user: userId }) 
      .populate({
        path: "items.product",
        select:
          "name description category brand material pattern ratings gender",
      })
      .populate({
        path: "items.variant",
        model: "Variant",
        select: "color mainImage",
      })
      .populate({
        path: "items.sizeVariant",
        model: "SizeVariant",
        select: "size price stockCount",
      });

    if (!wishlist || wishlist.items.length === 0) {
      return res.status(404).json({ message: "Wishlist is empty" });
    }

    res.status(200).json({
      message: "Wishlist retrieved successfully",
      Wishlist: wishlist.items, 
    });
  } catch (error) {
    console.error("Error fetching Wishlist:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

const deleteProductFromWhishlist = asyncHandler(async (req, res) => {
  console.log("Hitetedd");

  console.log("Userrrrrr", req.user.id);

  const { productId, variantId, sizeVariantId } = req.body;

  if (!productId || !variantId || !sizeVariantId) {
    return res.status(400).json({
      message: "Product ID, Variant ID, and Size Variant ID are required",
    });
  }

  try {
    const wishlist = await Wishlist.findOne({ user: req.user.id });

    if (!wishlist) {
      return res.status(404).json({ message: "Wishlist not found" });
    }

    const itemIndex = wishlist.items.findIndex(
      (item) =>
        item.product.toString() === productId &&
        item.variant.toString() === variantId &&
        item.sizeVariant.toString() === sizeVariantId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Product not found in wishlist" });
    }

    // Remove the item from the wishlist
    wishlist.items.splice(itemIndex, 1);

    // Update totalItems to the length of the items array
    wishlist.totalItems = wishlist.items.length;

    // Save the updated wishlist
    await wishlist.save();

    res.status(200).json({
      message: "Product removed from wishlist successfully",
      wishlist,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error removing product from wishlist",
      error: error.message,
    });
  }
});
module.exports = { addToWishlist, getWishlist, deleteProductFromWhishlist };
