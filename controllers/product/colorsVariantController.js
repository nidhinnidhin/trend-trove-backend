const Variant = require("../../models/product/variantModel");
const Product = require("../../models/product/productModel")
const cloudinary = require("../../config/cloudinary");
const asyncHandler = require("express-async-handler");

const getProductVariants = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;

        const variants = await Variant.find({ product: id });

        if (!variants || variants.length === 0) {
            return res.status(404).json({ message: "No variants found for this product." });
        }

        res.status(200).json({
            message: "Variants retrieved successfully",
            variants,
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching variants", error });
    }
});

module.exports = {getProductVariants};
