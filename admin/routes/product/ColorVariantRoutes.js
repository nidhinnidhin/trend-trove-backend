const express = require("express");
const { addColorVariant, editColorVariant } = require("../../../admin/controllers/product/ColorVariantController");
const { uploadMultiple } = require('../../../middleware/multer');
const adminAuthMiddleware = require("../../middleware/adminAuthMiddleware");

const router = express.Router();

router.post("/color/add",adminAuthMiddleware, uploadMultiple, addColorVariant);
router.put("/variant/edit/:variantId",adminAuthMiddleware, uploadMultiple, editColorVariant);

module.exports = router;
