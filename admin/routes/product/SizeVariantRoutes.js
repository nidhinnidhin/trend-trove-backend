const express = require("express");
const { addSizeVariant, editSizeVariant } = require("../../../admin/controllers/product/SizeVariantController");

const router = express.Router();

router.post("/size/add", addSizeVariant);
router.put("/sizeVariants/:id", editSizeVariant);

module.exports = router;
