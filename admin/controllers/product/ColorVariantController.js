const Variant = require("../../../models/product/variantModel");
const Product = require("../../../models/product/productModel")
const cloudinary = require("../../../config/cloudinary");
const asyncHandler = require("express-async-handler");

const addColorVariant = asyncHandler(async (req, res) => {
    try {
        const { productId, color } = req.body;
        
        if (!req.files || !req.files.mainImage || !req.files.colorImage) {
            return res.status(400).json({ message: "Main image and color image are required." });
        }
        const colorImage = req.files.colorImage[0];
        const colorImageResponse = await cloudinary.uploader.upload(colorImage.path, {
            folder: "variants/colorImages",
            use_filename: true,
            unique_filename: false,
        });
        const colorImageURL = colorImageResponse.secure_url;
        const mainImage = req.files.mainImage[0];
        const mainImageResponse = await cloudinary.uploader.upload(mainImage.path, {
            folder: "variants/mainImages",
            use_filename: true,
            unique_filename: false,
        });
        const mainImageURL = mainImageResponse.secure_url;
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
        const newVariant = new Variant({
            product: productId,
            color,
            colorImage: colorImageURL, 
            mainImage: mainImageURL,
            subImages: subImages,
        });
        await newVariant.save();
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


const editColorVariant = asyncHandler(async (req, res) => {
    try {
      const { variantId } = req.params;
      const { color, category } = req.body;
      const updatedData = {};
      
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
  

module.exports = { addColorVariant, editColorVariant };
