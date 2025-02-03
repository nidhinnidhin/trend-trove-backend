// const asyncHandler = require("express-async-handler");
// const Product = require("../../models/product/productModel");
// const Variant = require("../../models/product/variantModel");
// const cloudinary = require("../../config/cloudinary");

// const addVariant = asyncHandler(async (req, res) => {
//   try {
//     const {
//       name,
//       description,
//       price,
//       discountPrice,
//       size,
//       color,
//       material,
//       pattern,
//       inStock,
//       stockCount,
//     } = req.body;

//     const existingVariant = await Variant.findOne({ size, color });
//     if (existingVariant) {
//       return res.status(400).json({
//         message: "Variant with this size and color already exists for the product.",
//       });
//     }

//     if (!req.files || !req.files.mainImage) {
//       return res.status(400).json({ message: "Main image is required." });
//     }

//     const mainImage = req.files.mainImage[0];
//     const mainImageResponse = await cloudinary.uploader.upload(mainImage.path, {
//       folder: "variants/mainImages",
//       use_filename: true,
//       unique_filename: false,
//     });
//     const mainImageURL = mainImageResponse.secure_url;

//     const subImages = [];
//     if (req.files.subImages) {
//       for (const file of req.files.subImages) {
//         const response = await cloudinary.uploader.upload(file.path, {
//           folder: "variants/subImages",
//           use_filename: true,
//           unique_filename: false,
//         });
//         subImages.push(response.secure_url);
//       }
//     }

//     const variant = new Variant({
//       name,
//       description,
//       price,
//       discountPrice,
//       size,
//       color,
//       material,
//       pattern,
//       inStock: inStock ? "Available" : "Not Available",
//       stockCount,
//       mainImage: mainImageURL,
//       subImages,
//     });

//     await variant.save();

//     res.status(201).json({ message: "Variant added successfully.", variant });
//   } catch (error) {
//     console.error("Error adding variant:", error.message);
//     res.status(500).json({ message: "Error adding variant.", error: error.message });
//   }
// });


// // Fetch all variants
// const getAllVariants = asyncHandler(async (req, res) => {
//   try {
//     const variants = await Variant.find().sort({createdAt:-1});

//     if (variants.length === 0) {
//       return res.status(404).json({ message: "No variants found." });
//     }

//     res.status(200).json({ message: "Variants fetched successfully.", variants });
//   } catch (error) {
//     res.status(500).json({
//       message: "Error fetching variants.",
//       error: error.message,
//     });
//   }
// });

// //fetches all variants for a specific product.
// const getVariantsByProduct = asyncHandler(async (req, res) => {
//   try {
//     const { productId } = req.params;

//     const product = await Product.findById(productId);
//     if (!product) {
//       return res.status(404).json({ message: "Product not found." });
//     }

//     const populatedProduct = await Product.findById(productId).sort({createdAt:-1})
//       .populate('variants')
//       .populate('category')
//       .populate('brand'); 

//     res.status(200).json({
//       product: populatedProduct
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: "Error fetching variants.",
//       error: error.message
//     });
//   }
// });


// //get variant detail
// const getVariantDetails = asyncHandler(async (req, res) => {
//   try {
//     const { id } = req.params;

//     const variant = await Variant.findById(id).populate("product", "name");

//     if (!variant) {
//       return res.status(404).json({ message: "Variant not found." });
//     }

//     res.status(200).json(variant);
//   } catch (error) {
//     res.status(500).json({
//       message: "Error fetching variant details.",
//       error: error.message,
//     });
//   }
// });

// //Update variant
// const updateVariant = asyncHandler(async (req, res) => {
//   try {
//     const { id } = req.params;
//     const {
//       name,
//       description,
//       price,
//       discountPrice,
//       size,
//       color,
//       material,
//       pattern,
//       inStock,
//       stockCount,
//     } = req.body;

//     const variant = await Variant.findById(id);
//     if (!variant) {
//       return res.status(404).json({ message: "Variant not found." });
//     }

//     if (req.files && req.files.mainImage) {
//       const mainImage = req.files.mainImage[0];
//       const mainImageResponse = await cloudinary.uploader.upload(mainImage.path, {
//         folder: "variants/mainImages",
//         use_filename: true,
//         unique_filename: false,
//       });
//       variant.mainImage = mainImageResponse.secure_url;
//     }

//     if (req.files && req.files.subImages) {
//       const subImages = [];
//       for (const file of req.files.subImages) {
//         const response = await cloudinary.uploader.upload(file.path, {
//           folder: "variants/subImages",
//           use_filename: true,
//           unique_filename: false,
//         });
//         subImages.push(response.secure_url);
//       }
//       variant.subImages = subImages;
//     }

//     // Update other fields
//     if (name !== undefined) variant.name = name;
//     if (description !== undefined) variant.description = description;
//     if (price !== undefined) variant.price = price;
//     if (discountPrice !== undefined) variant.discountPrice = discountPrice;
//     if (size !== undefined) variant.size = size;
//     if (color !== undefined) variant.color = color;
//     if (material !== undefined) variant.material = material;
//     if (pattern !== undefined) variant.pattern = pattern;
//     if (inStock !== undefined) variant.inStock = inStock;
//     if (stockCount !== undefined) variant.stockCount = stockCount;

//     await variant.save();

//     res.status(200).json({ message: "Variant updated successfully.", variant });
//   } catch (error) {
//     console.error("Error updating variant:", error.message);
//     res.status(500).json({ message: "Error updating variant.", error: error.message });
//   }
// });


// //Delete variant
// const deleteVariant = asyncHandler(async (req, res) => {
//   try {
//     const { id } = req.params;

//     const variant = await Variant.findByIdAndDelete(id);

//     if (!variant) {
//       return res.status(404).json({ message: "Variant not found." });
//     }

//     res.status(200).json({ message: "Variant deleted successfully." });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Error deleting variant.", error: error.message });
//   }
// });

// module.exports = {
//   addVariant,
//   getVariantsByProduct,
//   updateVariant,
//   getVariantDetails,
//   deleteVariant,
//   getAllVariants
// };
