const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const {
  addBanner,
  getAllBanners,
  updateBanner,
  deleteBanner,
  toggleBannerStatus,
} = require("../../controllers/banners/bannerController");
const authMiddleware = require("../../middleware/admin/authmiddleware");

// Admin routes (protected)
router.post("/add", upload.single("image"), addBanner);
router.put("/update/:id", upload.single("image"), updateBanner);
router.delete("/delete/:id", deleteBanner);
router.patch("/toggle/:id", toggleBannerStatus);

// Public route
router.get("/", getAllBanners);

module.exports = router;
