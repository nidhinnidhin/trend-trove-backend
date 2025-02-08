const asyncHandler = require("express-async-handler");
const Category = require("../../models/product/categoryModel");


const getAllCategories = asyncHandler(async (req, res) => {
  try {
    const categories = await Category.find({ isDeleted: false }).sort({createdAt:-1});
    res.status(200).json({ categories });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching categories", error: error.message });
  }
});

module.exports = {
  getAllCategories,
};
