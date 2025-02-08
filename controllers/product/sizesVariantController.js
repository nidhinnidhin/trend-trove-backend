const SizeVariant = require("../../models/product/sizesVariantModel");
const Variant = require("../../models/product/variantModel");
const asyncHandler = require("express-async-handler");

const getSizeVariantsByVariantId = asyncHandler(async (req, res) => {
  try {
    const { variantId } = req.params;
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

module.exports = {
  getSizeVariantsByVariantId,
};
