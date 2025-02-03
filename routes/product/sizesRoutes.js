const express = require("express");
const { addSizeVariant, getSizeVariantsByVariantId, editSizeVariant } = require("../../controllers/product/sizesVariantController");

const router = express.Router();

router.post("/size/add", addSizeVariant);
router.get("/sizes/:variantId", getSizeVariantsByVariantId)
router.put("/sizeVariants/:id", editSizeVariant);

module.exports = router;
