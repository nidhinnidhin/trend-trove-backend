const express = require("express");
const Offer = require("../../../models/offers/offerModal");
const asyncHandler = require("express-async-handler");
const Product = require("../../../models/product/productModel");
const Variant = require("../../../models/product/variantModel");
const SizeVariant = require("../../../models/product/sizesVariantModel");

const addOffer = asyncHandler(async (req, res) => {
  try {
    const {
      offerName,
      offerType,
      discountPercentage,
      startDate,
      endDate,
      items,
    } = req.body;

    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      return res
        .status(400)
        .json({ message: "End date must be after start date" });
    }

    const offer = await Offer.create({
      offerName,
      offerType,
      discountPercentage,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      items,
      isActive: start <= now && end >= now,
    });

    if (offerType === "product") {
      const products = await Product.find({ _id: { $in: items } });
      for (const product of products) {
        product.activeOffer = {
          _id: offer._id,
          discountPercentage: offer.discountPercentage,
          offerName: offer.offerName,
        };
        await product.save();

        const variants = await Variant.find({ product: product._id });
        for (const variant of variants) {
          const sizes = await SizeVariant.find({ variant: variant._id });
          for (const size of sizes) {
            const originalPrice = size.price;
            size.discountPrice = Math.round(
              originalPrice * (1 - offer.discountPercentage / 100)
            );
            await size.save();
          }
        }
      }
    } else if (offerType === "category") {
      const products = await Product.find({ category: { $in: items } });
      for (const product of products) {
        product.activeOffer = {
          _id: offer._id,
          discountPercentage: offer.discountPercentage,
          offerName: offer.offerName,
        };
        await product.save();

        const variants = await Variant.find({ product: product._id });
        for (const variant of variants) {
          const sizes = await SizeVariant.find({ variant: variant._id });
          for (const size of sizes) {
            const originalPrice = size.price;
            size.discountPrice = Math.round(
              originalPrice * (1 - offer.discountPercentage / 100)
            );
            await size.save();
          }
        }
      }
    }

    res.status(201).json({
      message: "Offer created successfully",
      offer,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating offer",
      error: error.message,
    });
  }
});

const editOffer = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { offerName, offerType, discountValue, startDate, endDate, items } =
      req.body;

    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      return res
        .status(400)
        .json({ message: "End date must be after start date" });
    }

    const offer = await Offer.findByIdAndUpdate(
      id,
      {
        offerName,
        offerType,
        discountPercentage: discountValue,
        startDate,
        endDate,
        items,
        isActive: start <= now && end >= now,
      },
      { new: true }
    );

    if (!offer) {
      return res.status(404).json({ message: "Offer not found" });
    }

    if (offerType === "product") {
      await Product.updateMany(
        { _id: { $in: items } },
        { activeOffer: offer._id }
      );
    }

    res.status(200).json({
      message: "Offer updated successfully",
      offer,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating offer",
      error: error.message,
    });
  }
});

const resetOffer = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const offer = await Offer.findById(id);

    if (!offer) {
      return res.status(404).json({ message: "Offer not found" });
    }

    // Deactivate the offer
    offer.isActive = false;
    await offer.save();

    // Update products affected by the offer
    if (offer.offerType === "product") {
      // For product-specific offers
      const products = await Product.find({ _id: { $in: offer.items } });
      for (const product of products) {
        product.activeOffer = null;
        await product.save();

        const variants = await Variant.find({ product: product._id });
        for (const variant of variants) {
          const sizes = await SizeVariant.find({ variant: variant._id });
          for (const size of sizes) {
            size.discountPrice = size.price; // Revert to original price
            await size.save();
          }
        }
      }
    } else if (offer.offerType === "category") {
      // For category-specific offers
      const products = await Product.find({ category: { $in: offer.items } });
      for (const product of products) {
        product.activeOffer = null;
        await product.save();

        const variants = await Variant.find({ product: product._id });
        for (const variant of variants) {
          const sizes = await SizeVariant.find({ variant: variant._id });
          for (const size of sizes) {
            size.discountPrice = size.price; // Revert to original price
            await size.save();
          }
        }
      }
    }

    res.status(200).json({
      message: "Offer reset successfully",
      offer,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error resetting offer",
      error: error.message,
    });
  }
});

const deleteOffer = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const offer = await Offer.findByIdAndDelete(id);

    if (!offer) {
      return res.status(404).json({ message: "Offer not found" });
    }

    await Product.updateMany(
      { activeOffer: id },
      { $unset: { activeOffer: "" } }
    );

    res.status(200).json({
      message: "Offer deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting offer",
      error: error.message,
    });
  }
});

const getOffers = asyncHandler(async (req, res) => {
  try {
    const offers = await Offer.find()
      .sort({ createdAt: -1 })
      .populate({
        path: "items",
      });

    res.status(200).json({ offers });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching offers", error: error.message });
  }
});

module.exports = {
  addOffer,
  getOffers,
  editOffer,
  deleteOffer,
  resetOffer,
};
