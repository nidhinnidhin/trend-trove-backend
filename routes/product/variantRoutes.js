const express = require("express");
const { addColorVariant, getProductVariants, editColorVariant } = require("../../controllers/product/colorsVariantController");
const { uploadMultiple } = require('../../middleware/multer');

const router = express.Router();

router.post("/color/add", uploadMultiple, addColorVariant);
router.get("/variant/get/:id", getProductVariants);
router.put("/variant/edit/:variantId", uploadMultiple, editColorVariant);

module.exports = router;
