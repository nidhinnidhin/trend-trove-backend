const Variant = require("../../models/product/variantModel");
const Product = require("../../models/product/productModel")
const cloudinary = require("../../config/cloudinary");
const asyncHandler = require("express-async-handler");

const addColorVariant = asyncHandler(async (req, res) => {
    try {
        const { productId, color } = req.body;
        
        if (!req.files || !req.files.mainImage || !req.files.colorImage) {
            return res.status(400).json({ message: "Main image and color image are required." });
        }

        // Upload color image
        const colorImage = req.files.colorImage[0];
        const colorImageResponse = await cloudinary.uploader.upload(colorImage.path, {
            folder: "variants/colorImages",
            use_filename: true,
            unique_filename: false,
        });
        const colorImageURL = colorImageResponse.secure_url;

        // Upload main image
        const mainImage = req.files.mainImage[0];
        const mainImageResponse = await cloudinary.uploader.upload(mainImage.path, {
            folder: "variants/mainImages",
            use_filename: true,
            unique_filename: false,
        });
        const mainImageURL = mainImageResponse.secure_url;

        // Upload sub images if provided
        const subImages = [];
        if (req.files.subImages) {
            for (const file of req.files.subImages) {
                const response = await cloudinary.uploader.upload(file.path, {
                    folder: "variants/subImages",
                    use_filename: true,
                    unique_filename: false,
                });
                subImages.push(response.secure_url);
            }
        }

        // Create new variant
        const newVariant = new Variant({
            product: productId,
            color,
            colorImage: colorImageURL, // Added color image
            mainImage: mainImageURL,
            subImages: subImages,
        });

        await newVariant.save();

        // Add the variant ID to the product's variant list
        await Product.findByIdAndUpdate(productId, {
            $push: { variants: newVariant._id },
        });

        res.status(201).json({
            message: "Color variant added successfully",
            variant: newVariant,
        });

    } catch (error) {
        res.status(500).json({ message: "Error adding color variant", error });
    }
});

const getProductVariants = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;

        // Find all variants for the given product
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

const editColorVariant = asyncHandler(async (req, res) => {
    try {
      const { variantId } = req.params;
      const { color, category } = req.body;
      const updatedData = {};
      
      // Check if any file is uploaded and handle the update accordingly
      if (req.files) {
        if (req.files.colorImage) {
          const colorImage = req.files.colorImage[0];
          const colorImageResponse = await cloudinary.uploader.upload(colorImage.path, {
            folder: "variants/colorImages",
            use_filename: true,
            unique_filename: false,
          });
          updatedData.colorImage = colorImageResponse.secure_url;
        }
  
        if (req.files.mainImage) {
          const mainImage = req.files.mainImage[0];
          const mainImageResponse = await cloudinary.uploader.upload(mainImage.path, {
            folder: "variants/mainImages",
            use_filename: true,
            unique_filename: false,
          });
          updatedData.mainImage = mainImageResponse.secure_url;
        }
  
        // Handle subImages if provided
        if (req.files.subImages) {
          const subImages = [];
          for (const file of req.files.subImages) {
            const subImageResponse = await cloudinary.uploader.upload(file.path, {
              folder: "variants/subImages",
              use_filename: true,
              unique_filename: false,
            });
            subImages.push(subImageResponse.secure_url);
          }
          updatedData.subImages = subImages;
        }
      }
  
      if (color) updatedData.color = color;
      if (category) updatedData.category = category;
  
      // Update the variant in the database
      const updatedVariant = await Variant.findByIdAndUpdate(variantId, updatedData, { new: true });
  
      if (!updatedVariant) {
        return res.status(404).json({ message: "Variant not found" });
      }
  
      res.status(200).json({
        message: "Variant updated successfully",
        variant: updatedVariant,
      });
    } catch (error) {
      res.status(500).json({ message: "Error updating variant", error });
    }
  });
  

module.exports = { addColorVariant, getProductVariants, editColorVariant };
