// const Product = require("../../models/product/productModel");
// const Brand = require("../../models/product/brandModel");
// const Category = require("../../models/product/categoryModel");
// const cloudinary = require("../../config/cloudinary"); // Cloudinary config
// const asyncHandler = require("express-async-handler");
// const Variant = require("../../models/product/variantModel");

// // Add a new product with image upload
// const addProduct = asyncHandler(async (req, res) => {
//   try {
//     const {
//       name,
//       description,
//       brand,
//       category,
//       gender,
//       variants,
//     } = req.body;

//     if (!variants || !Array.isArray(variants) || variants.length === 0) {
//       return res
//         .status(400)
//         .json({ message: "At least one variant ID is required." });
//     }

//     const product = new Product({
//       name,
//       description,
//       brand,
//       category,
//       gender,
//       variants,
//     });

//     await product.save();

//     res.status(201).json({
//       message: "Product added successfully with associated variants.",
//       product,
//     });
//   } catch (error) {
//     console.error("Error adding product:", error.message);
//     res.status(500).json({
//       message: "Error adding product.",
//       error: error.message,
//     });
//   }
// });

// const getAllProducts = asyncHandler(async (req, res) => {
//   try {
//     const products = await Product.find().sort({createdAt:-1})
//       .populate("brand", "name")
//       .populate("category", "name")
//       .populate("variants")
//       .lean();

//     res.status(200).json(products);
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Error fetching products.", error: error.message });
//   }
// });

// const getProductDetails = asyncHandler(async (req, res) => {
//   try {
//     const { id } = req.params;

//     const product = await Product.findById(id)
//       .populate("brand", "name")
//       .populate("category", "name")
//       .populate({
//         path: "variants",
//         select: "-__v",
//       })
//       .lean();

//     if (!product) {
//       return res.status(404).json({ message: "Product not found." });
//     }

//     res.status(200).json(product);
//   } catch (error) {
//     console.error("Error fetching product details:", error.message);
//     res.status(500).json({
//       message: "Error fetching product details.",
//       error: error.message,
//     });
//   }
// });

// const updateProduct = asyncHandler(async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { name, description, gender } = req.body;

//     const product = await Product.findById(id);

//     if (!product) {
//       return res.status(404).json({ message: "Product not found." });
//     }

//     product.name = name || product.name;
//     product.description = description || product.description;
//     product.gender = gender || product.gender;

//     const updatedProduct = await product.save();

//     res.status(200).json({
//       message: "Product updated successfully.",
//       product: updatedProduct,
//     });
//   } catch (error) {
//     console.error("Error updating product:", error.message);
//     res.status(500).json({
//       message: "Error updating product.",
//       error: error.message,
//     });
//   }
// });

// // Block product
// const blockProduct = asyncHandler(async (req, res) => {
//   const { id } = req.params;

//   try {
//     const product = await Product.findById(id);

//     if (!product) {
//       return res.status(404).json({ message: "Product not found" });
//     }

//     product.isDeleted = true;
//     await product.save();

//     res.status(200).json({ message: "Product blocked successfully", product });
//   } catch (error) {
//     res.status(500).json({ message: "Error blocking product", error: error.message });
//   }
// });

// // unblock product
// const unBlockProduct = asyncHandler(async (req, res) => {
//   const { id } = req.params;

//   try {
//     const product = await Product.findById(id);

//     if (!product) {
//       return res.status(404).json({ message: "Product not found" });
//     }

//     product.isDeleted = false;
//     await product.save();

//     res.status(200).json({ message: "Product unblocked successfully", product });
//   } catch (error) {
//     res.status(500).json({ message: "Error unblocking product", error: error.message });
//   }
// });

// const getRelatedProducts = asyncHandler(async (req, res) => {
//   const { id } = req.params;

//   try {
//     const product = await Product.findById(id);

//     if (!product) {
//       return res.status(404).json({ message: "Product not found." });
//     }

//     const relatedProducts = await Product.find({
//       _id: { $ne: id },
//       category: product.category,
//       brand: product.brand,
//       gender: product.gender,
//       isDeleted: false,
//     })
//       .populate("category", "name")
//       .populate("brand", "name")
//       .populate({
//         path: "variants",
//         select: "-__v",
//       })
//       .lean();

//     res.status(200).json({
//       message: "Related products fetched successfully.",
//       relatedProducts,
//     });
//   } catch (error) {
//     console.error("Error fetching related products:", error.message);
//     res.status(500).json({
//       message: "Error fetching related products.",
//       error: error.message,
//     });
//   }
// });

// // Get all brands and categories for dropdown
// const getMetaData = asyncHandler(async (req, res) => {
//   try {
//     const brands = await Brand.find();
//     const categories = await Category.find();
//     res.status(200).json({ brands, categories });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Error fetching metadata.", error: error.message });
//   }
// });

// module.exports = {
//   addProduct,
//   getAllProducts,
//   getMetaData,
//   getProductDetails,
//   updateProduct,
//   blockProduct,
//   unBlockProduct,
//   getRelatedProducts
// };

const Product = require("../../models/product/productModel");
const Variant = require("../../models/product/variantModel");
const SizeVariant = require("../../models/product/sizesVariantModel");
const asyncHandler = require("express-async-handler");

const addProduct = asyncHandler(async (req, res) => {
  try {
    const { name, description, category, brand, gender, material, pattern } =
      req.body;

    const newProduct = new Product({
      name,
      description,
      category,
      brand,
      gender,
      material,
      pattern,
    });

    await newProduct.save();
    res
      .status(201)
      .json({ message: "Product created successfully", product: newProduct });
  } catch (error) {
    res.status(500).json({ message: "Error creating product", error });
  }
});

const getAllProducts = asyncHandler(async (req, res) => {
  try {
    const { brand, category, gender } = req.query; // optional filters
    const filters = {};

    if (brand) {
      filters.brand = brand;
    }

    if (category) {
      filters.category = category;
    }

    if (gender) {
      filters.gender = gender;
    }

    const products = await Product.find(filters)
      .populate("brand", "name")
      .populate("category", "name")
      .populate({
        path: "variants",
        populate: {
          path: "sizes",
          model: "SizeVariant",
        },
      });

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Error fetching products", error });
  }
});

const getProductDetail = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id)
      .populate("category", "name")
      .populate("brand", "name")
      .populate({
        path: "variants",
        populate: {
          path: "sizes",
          model: "SizeVariant",
        },
      });

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    res.status(200).json({
      message: "Product details retrieved successfully",
      product,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching product details", error });
  }
});

const getProductById = asyncHandler(async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate({
      path: "variants",
      populate: {
        path: "sizes",
        model: "SizeVariant",
      },
    });

    if (!product) return res.status(404).json({ message: "Product not found" });

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: "Error fetching product", error });
  }
});

// productController.js
const updateProduct = asyncHandler(async (req, res) => {
  console.log("Hited");

  try {
    const { id } = req.params;
    const { name, description, gender, material, pattern } = req.body;

    const product = await Product.findById(id);
    console.log(product);

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    product.name = name || product.name;
    product.description = description || product.description;
    product.gender = gender || product.gender;
    product.material = material || product.material;
    product.pattern = pattern || product.pattern;

    const updatedProduct = await product.save();

    res.status(200).json({
      message: "Product updated successfully.",
      product: updatedProduct,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating product.",
      error: error.message,
    });
  }
});

const searchProducts = asyncHandler(async (req, res) => {
  console.log("Hited");

  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
        products: [],
      });
    }

    // Create a case-insensitive regular expression from the query string
    const searchRegex = new RegExp(query, "i");

    // Search for products matching the query in specified fields (excluding _id)
    const products = await Product.find({
      $or: [
        { name: searchRegex },
        { description: searchRegex },
        { material: searchRegex },
        { pattern: searchRegex },
        { gender: searchRegex },
      ],
    })
      .populate("brand", "name")
      .populate("category", "name")
      .populate({
        path: "variants",
        populate: {
          path: "sizes",
          model: "SizeVariant",
        },
      })
      .limit(10); // Optional: You can limit the number of products returned

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({
      success: false,
      message: "Error searching products",
      error: error.message,
    });
  }
});

const fetchRelatedProducts = async (req, res) => {
  try {
    const { productId } = req.params;

    const currentProduct = await Product.findById(productId);
    if (!currentProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    const relatedProducts = await Product.find({
      category: currentProduct.category,
      _id: { $ne: productId },
    })
      .limit(2) 
      .populate({
        path: "variants",
        options: { limit: 3 },
        populate: {
          path: "sizes",
          model: "SizeVariant",
        },
      });

    res.status(200).json({ relatedProducts });
  } catch (error) {
    res.status(500).json({ message: "Error fetching related products", error });
  }
};

const searchAndFetchRelatedProducts = asyncHandler(async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
        products: [],
      });
    }

    // Create a case-insensitive regular expression from the query string
    const searchRegex = new RegExp(query, "i");

    // Search for products matching the query in specified fields
    const products = await Product.find({
      $or: [
        { name: searchRegex },
        { description: searchRegex },
        { material: searchRegex },
        { pattern: searchRegex },
        { gender: searchRegex },
      ],
    })
      .populate("brand", "name")
      .populate("category", "name")
      .populate({
        path: "variants",
        populate: {
          path: "sizes",
          model: "SizeVariant",
        },
      })
      .limit(10); // Optional: You can limit the number of products returned

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No products found matching the query",
      });
    }

    // Create a list of related products
    const relatedProductsPromises = products.map(async (product) => {
      const relatedProducts = await Product.find({
        category: product.category._id,
        _id: { $ne: product._id }, // Exclude the current product
      })
        .populate({
          path: "variants",
          populate: {
            path: "sizes",
            model: "SizeVariant",
          },
        })
        .limit(2); // Limit the number of related products returned for each product

      return {
        product,
        relatedProducts,
      };
    });

    // Wait for all related products to be fetched
    const productsWithRelated = await Promise.all(relatedProductsPromises);

    res.status(200).json({
      success: true,
      count: products.length,
      productsWithRelated,
    });
  } catch (error) {
    console.error("Search and related products error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching search and related products",
      error: error.message,
    });
  }
});

module.exports = {
  addProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  getProductDetail,
  fetchRelatedProducts,
  searchProducts,
  searchAndFetchRelatedProducts,
};
