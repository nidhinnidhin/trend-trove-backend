const asyncHandler = require("express-async-handler");
const Category = require("../../../models/product/categoryModel");

const addCategory = asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Category name is required" });
  }

  try {
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const category = await Category.create({ name });
    res
      .status(201)
      .json({ message: "Category created successfully", category });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error adding category", error: error.message });
  }
});

const getAllCategoriesAdmin = asyncHandler(async (req, res) => {
  try {
    const categories = await Category.find({}).sort({createdAt:-1});
    res.status(200).json({ categories });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching categories", error: error.message });
  }
});

const editCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name } = req.body; 

  try {
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    if (!name) {
      return res.status(200).json({ category });
    }

    category.name = name;
    await category.save();

    res
      .status(200)
      .json({ message: "Category updated successfully", category });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating category", error: error.message });
  }
});

const blockCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    category.isDeleted = true;
    await category.save();

    res
      .status(200)
      .json({ message: "Category blocked successfully", category });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error blocking category", error: error.message });
  }
});

const unblockCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    category.isDeleted = false;
    await category.save();

    res
      .status(200)
      .json({ message: "Category unblocked successfully", category });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error unblocking category", error: error.message });
  }
});

module.exports = {
  addCategory,
  editCategory,
  blockCategory,
  unblockCategory,
  getAllCategoriesAdmin
};
