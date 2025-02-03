const SizeVariant = require("../../models/product/sizesVariantModel");
const Variant = require("../../models/product/variantModel");
const asyncHandler = require("express-async-handler");

const addSizeVariant = asyncHandler(async (req, res) => {
  try {
    const {
      variantId,
      size,
      price,
      discountPrice,
      inStock,
      stockCount,
      description,
    } = req.body;

    const newSizeVariant = new SizeVariant({
      variant: variantId,
      size,
      price,
      discountPrice,
      inStock,
      stockCount,
      description,
    });

    await newSizeVariant.save();
    await Variant.findByIdAndUpdate(variantId, {
      $push: { sizes: newSizeVariant._id },
    });

    res
      .status(201)
      .json({
        message: "Size variant added successfully",
        sizeVariant: newSizeVariant,
      });
  } catch (error) {
    res.status(500).json({ message: "Error adding size variant", error });
  }
});

const getSizeVariantsByVariantId = asyncHandler(async (req, res) => {
  try {
    const { variantId } = req.params;

    // Find all size variants for the given variantId
    const sizeVariants = await SizeVariant.find({ variant: variantId });

    if (!sizeVariants || sizeVariants.length === 0) {
      return res
        .status(404)
        .json({ message: "No size variants found for this variant." });
    }

    res.status(200).json({
      message: "Size variants retrieved successfully",
      sizeVariants,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching size variants", error });
  }
});

const editSizeVariant = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params; // Get the size variant ID from the URL params
    const { size, price, discountPrice, inStock, stockCount, description } =
      req.body; // Get the updated data from the request body

    // Find the size variant by its ID
    const sizeVariant = await SizeVariant.findById(id);

    if (!sizeVariant) {
      return res.status(404).json({ message: "Size variant not found" });
    }

    // Update the size variant with new data
    sizeVariant.size = size || sizeVariant.size; // Update only if provided
    sizeVariant.price = price || sizeVariant.price;
    sizeVariant.discountPrice = discountPrice || sizeVariant.discountPrice;
    sizeVariant.inStock = inStock !== undefined ? inStock : sizeVariant.inStock;
    sizeVariant.stockCount = stockCount || sizeVariant.stockCount;
    sizeVariant.description = description || sizeVariant.description;

    // Save the updated size variant
    await sizeVariant.save();

    res
      .status(200)
      .json({ message: "Size variant updated successfully", sizeVariant });
  } catch (error) {
    res.status(500).json({ message: "Error updating size variant", error });
  }
});

module.exports = {
  addSizeVariant,
  getSizeVariantsByVariantId,
  editSizeVariant,
};
