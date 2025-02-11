const express = require("express");
const { addSizeVariant, editSizeVariant } = require("../../../admin/controllers/product/SizeVariantController");
const adminAuthMiddleware = require("../../middleware/adminAuthMiddleware");

const router = express.Router();

router.post("/size/add",adminAuthMiddleware, addSizeVariant);
router.put("/sizeVariants/:id",adminAuthMiddleware, editSizeVariant);

module.exports = router;
