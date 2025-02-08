const express = require("express");
const { addColorVariant, editColorVariant } = require("../../../admin/controllers/product/ColorVariantController");
const { uploadMultiple } = require('../../../middleware/multer');

const router = express.Router();

router.post("/color/add", uploadMultiple, addColorVariant);
router.put("/variant/edit/:variantId", uploadMultiple, editColorVariant);

module.exports = router;
