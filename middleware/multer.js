const multer = require("multer");
const path = require("path");

// Temporary file storage in 'uploads' directory
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// File filter to accept images only
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  fileFilter,
});

module.exports = {
  uploadSingle: upload.single("image"), // Single image upload
  uploadMultiple: upload.fields([
    { name: "mainImage", maxCount: 1 }, // Single main image
    { name: "colorImage", maxCount: 1 },
    { name: "subImages", maxCount: 10 }, // Multiple subimages
  ]),
  upload
};
