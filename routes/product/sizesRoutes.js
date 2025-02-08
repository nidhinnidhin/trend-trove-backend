const express = require("express");
const { getSizeVariantsByVariantId } = require("../../controllers/product/sizesVariantController");

const router = express.Router();

router.get("/sizes/:variantId", getSizeVariantsByVariantId)

module.exports = router;
