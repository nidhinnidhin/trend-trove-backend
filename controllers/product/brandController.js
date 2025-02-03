const Brand = require('../../models/product/brandModel');
const cloudinary = require('../../config/cloudinary');
const asyncHandler = require("express-async-handler");



// Add a new brand with image upload
const addBrand = asyncHandler (async (req, res) => {
    try {
      const { name } = req.body;
  
      if (!req.file) {
        return res.status(400).json({ message: "Brand image is required." });
      }
  
      const cloudinaryResponse = await cloudinary.uploader.upload(req.file.path, {
        folder: 'brands',
        use_filename: true,
        unique_filename: false,
      });
  
      const image = cloudinaryResponse.secure_url;
  
      const brand = new Brand({ name, image });
      await brand.save();
  
      res.status(201).json({ message: 'Brand added successfully.', brand });
    } catch (error) {
      res.status(500).json({ message: 'Error adding brand.', error: error.message });
    }
  });
  
// Get all brands
const getAllBrands =asyncHandler (async (req, res) => {
  try {
    const brands = await Brand.find({ isDeleted: false}).sort({createdAt:-1});
    res.status(200).json(brands);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching brands.', error: error.message });
  }
});

// Get all brands admin
const getAllBrandsAdmin =asyncHandler (async (req, res) => {
  try {
    const brands = await Brand.find({ }).sort({createdAt:-1});
    res.status(200).json(brands);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching brands.', error: error.message });
  }
});

// Edit an existing brand (name and image)
const editBrand = asyncHandler(async (req, res) => {
  try {
    const { brandId } = req.params;
    const { name } = req.body;

    const brand = await Brand.findById(brandId);
    if (!brand) {
      return res.status(404).json({ message: 'Brand not found.' });
    }

    if (req.file) {
      const publicId = brand.image.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(publicId);

      const cloudinaryResponse = await cloudinary.uploader.upload(req.file.path, {
        folder: 'brands',
        use_filename: true,
        unique_filename: false,
      });

      brand.image = cloudinaryResponse.secure_url;
    }

    brand.name = name;

    await brand.save();

    res.status(200).json({ message: 'Brand updated successfully.', brand });
  } catch (error) {
    res.status(500).json({ message: 'Error updating brand.', error: error.message });
  }
});

// Block brand
const blockBrand = asyncHandler(async (req, res) => {
  const { id } = req.params; 
  console.log({id});

  try {
    const brand = await Brand.findById(id);
    console.log(brand);
    
    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    brand.isDeleted = true; 
    await brand.save();

    res.status(200).json({ message: "Brand blocked successfully", brand });
  } catch (error) {
    res.status(500).json({ message: "Error blocking Brand", error: error.message });
  }
});

// unBlock brand
const unBlockBrand = asyncHandler(async (req, res) => {
  const { id } = req.params; 
  
  try {
    const brand = await Brand.findById(id);

    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    brand.isDeleted = false; 
    await brand.save();

    res.status(200).json({ message: "Brand blocked successfully", brand });
  } catch (error) {
    res.status(500).json({ message: "Error blocking Brand", error: error.message });
  }
});



module.exports = {addBrand, getAllBrands, editBrand, blockBrand, unBlockBrand, getAllBrandsAdmin}
