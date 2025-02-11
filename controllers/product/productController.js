const Product = require("../../models/product/productModel");
const Variant = require("../../models/product/variantModel");
const SizeVariant = require("../../models/product/sizesVariantModel");
const asyncHandler = require("express-async-handler");

const getAllProducts = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 5, search = "", includeDeleted = false } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    
    if (!includeDeleted) {
      query.isDeleted = false;
    }

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("brand", "name")
      .populate("category", "name")
      .populate({
        path: "variants",
        populate: {
          path: "sizes",
          model: "SizeVariant",
        },
      });

    const totalProducts = await Product.countDocuments(query);

    res.status(200).json({
      products,
      totalPages: Math.ceil(totalProducts / limit),
      currentPage: parseInt(page),
    });
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

    const searchRegex = new RegExp(query, "i");

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
      .limit(10);
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

    const searchRegex = new RegExp(query, "i");
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
      .limit(10);

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No products found matching the query",
      });
    }

    const relatedProductsPromises = products.map(async (product) => {
      const relatedProducts = await Product.find({
        category: product.category._id,
        _id: { $ne: product._id },
      })
        .populate({
          path: "variants",
          populate: {
            path: "sizes",
            model: "SizeVariant",
          },
        })
        .limit(2);

      return {
        product,
        relatedProducts,
      };
    });

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
  getAllProducts,
  getProductById,
  getProductDetail,
  fetchRelatedProducts,
  searchProducts,
  searchAndFetchRelatedProducts,
};
