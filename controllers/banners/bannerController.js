const Banner = require("../../models/banners/bannerModel");
const asyncHandler = require("express-async-handler");
const cloudinary = require("../../config/cloudinary");

// Add new banner
const addBanner = asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Banner image is required" });
    }

    const { title, description, discount } = req.body;

    // Upload image to cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "banners",
    });

    const banner = new Banner({
      image: result.secure_url,
      title,
      description,
      discount: parseInt(discount),
    });

    await banner.save();
    res.status(201).json({
      message: "Banner added successfully",
      banner,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error adding banner",
      error: error.message,
    });
  }
});

// Get all banners
const getAllBanners = asyncHandler(async (req, res) => {
  try {
    const banners = await Banner.find().sort({ createdAt: -1 });
    res.status(200).json(banners);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching banners",
      error: error.message,
    });
  }
});

// Update banner
const updateBanner = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, discount, isActive, buttonLink } = req.body;

    let updateData = {
      title,
      description,
      discount: parseInt(discount),
      isActive,
    };

    // If new image is uploaded
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "banners",
      });
      updateData.image = result.secure_url;
    }

    const banner = await Banner.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    res.status(200).json({
      message: "Banner updated successfully",
      banner,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating banner",
      error: error.message,
    });
  }
});

// Delete banner
const deleteBanner = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findByIdAndDelete(id);

    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    res.status(200).json({
      message: "Banner deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting banner",
      error: error.message,
    });
  }
});

// Toggle banner status
const toggleBannerStatus = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findById(id);

    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    banner.isActive = !banner.isActive;
    await banner.save();

    res.status(200).json({
      message: "Banner status updated successfully",
      banner,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating banner status",
      error: error.message,
    });
  }
});

module.exports = {
  addBanner,
  getAllBanners,
  updateBanner,
  deleteBanner,
  toggleBannerStatus,
};
