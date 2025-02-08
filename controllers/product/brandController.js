const Brand = require('../../models/product/brandModel');
const asyncHandler = require("express-async-handler");

const getAllBrands =asyncHandler (async (req, res) => {
  try {
    const brands = await Brand.find({ isDeleted: false}).sort({createdAt:-1});
    res.status(200).json(brands);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching brands.', error: error.message });
  }
});

module.exports = {getAllBrands}
