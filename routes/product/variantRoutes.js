const express = require("express");
const { getProductVariants } = require("../../controllers/product/colorsVariantController");

const router = express.Router();

router.get("/variant/get/:id", getProductVariants);

module.exports = router;
