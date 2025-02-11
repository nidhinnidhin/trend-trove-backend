const Product = require("../../../models/product/productModel");
const asyncHandler = require("express-async-handler");

// const getAllProducts = asyncHandler(async (req, res) => {
//   try {
//     const { page = 1, limit = 5 } = req.query;
//     const skip = (page - 1) * limit;

//     const products = await Product.find({})
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(parseInt(limit))
//       .populate("brand", "name")
//       .populate("category", "name")
//       .populate({
//         path: "variants",
//         populate: {
//           path: "sizes",
//           model: "SizeVariant",
//         },
//       });

//     const totalProducts = await Product.countDocuments({});

//     res.status(200).json({
//       products,
//       totalPages: Math.ceil(totalProducts / limit),
//       currentPage: parseInt(page),
//     });
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching products", error });
//   }
// });


const getAllProductsAdmin = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 5, search = "" } = req.query;
    const skip = (page - 1) * limit;
    
    const query = {};

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

const blockProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.isDeleted = true;
    await product.save();

    res.status(200).json({ message: "Product blocked successfully", product });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error blocking product", error: error.message });
  }
});

const unBlockProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    product.isDeleted = false;
    await product.save();
    res
      .status(200)
      .json({ message: "Product unblocked successfully", product });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error unblocking product", error: error.message });
  }
});

module.exports = {
  addProduct,
  updateProduct,
  blockProduct,
  unBlockProduct,
  getAllProductsAdmin,
};
