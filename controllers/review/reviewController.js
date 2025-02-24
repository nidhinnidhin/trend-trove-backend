const express = require("express");
const Review = require("../../models/review/reviewModel");
const Product = require("../../models/product/productModel");
const asyncHandler = require("express-async-handler");

const addReview = asyncHandler(async (req, res) => {
  try {
    const { productId, variantId, sizeVariantId, rating, comment } = req.body;
    const userId = req.user.id;

    console.log("Review Data:", {
      productId,
      variantId,
      sizeVariantId,
      rating,
      comment,
      userId,
    });

    if (!productId || !variantId || !sizeVariantId) {
      return res.status(400).json({
        message: "Missing required fields",
        required: { productId, variantId, sizeVariantId },
      });
    }

    const productExists = await Product.findById(productId);
    if (!productExists) {
      return res.status(404).json({
        message: "Product not found",
        productId: productId,
      });
    }

    const newReview = new Review({
      product: productId,
      variant: variantId,
      sizeVariant: sizeVariantId,
      user: userId,
      rating,
      comment,
    });

    await newReview.save();
    res.status(201).json({
      success: true,
      message: "Review added successfully!",
    });
  } catch (error) {
    console.error("Error adding review:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add review",
      error: error.message,
    });
  }
});

const getReviews = asyncHandler(async (req, res) => {
  try {
    const productId = req.params.productId;

    const reviews = await Review.find({ product: productId })
      .populate("user", "username image")
      .populate("variant", "color")
      .populate("sizeVariant", "size");

    res.status(200).json({ reviews });
  } catch (error) {
    res.status(500).json({ message: "Failed to get reviews", error });
  }
});

module.exports = { addReview, getReviews };
