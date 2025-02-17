const express = require("express");
const Offer = require("../../../models/offers/offerModal");
const asyncHandler = require("express-async-handler");
const {
  updateProductPrices,
  updateCategoryPrices,
} = require("../../helper/offerHelpers");

const addOffer = asyncHandler(async (req, res) => {
  try {
    const { offerName, offerType, discountValue, startDate, endDate, items } =
      req.body;

    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start < now) {
      return res
        .status(400)
        .json({ message: "Start date must be in the future" });
    }
    if (end <= start) {
      return res
        .status(400)
        .json({ message: "End date must be after start date" });
    }

    const offer = await Offer.create({
      offerName,
      offerType,
      discountPercentage: discountValue,
      startDate,
      endDate,
      items,
    });

    if (offerType === "product") {
      await updateProductPrices(items, discountValue);
    } else {
      await updateCategoryPrices(items, discountValue);
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

const getOffers = asyncHandler(async (req, res) => {
  try {
    const offers = await Offer.find();
    res.status(200).json({ offers });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching offers", error: error.message });
  }
});

// Edit Offer
const editOffer = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { offerName, offerType, discountValue, startDate, endDate, items } =
      req.body;

    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start < now) {
      return res
        .status(400)
        .json({ message: "Start date must be in the future" });
    }
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
      },
      { new: true }
    );

    if (!offer) {
      return res.status(404).json({ message: "Offer not found" });
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

// Delete Offer
const deleteOffer = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const offer = await Offer.findByIdAndDelete(id);

    if (!offer) {
      return res.status(404).json({ message: "Offer not found" });
    }

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

module.exports = { addOffer, getOffers, editOffer, deleteOffer };
