const express = require("express");
const { addProduct, updateProduct, blockProduct, unBlockProduct } = require("../../../admin/controllers/product/ProductController");

const router = express.Router();

router.post("/add", addProduct);

router.put("/update/:id", updateProduct);
router.patch('/block/:id', blockProduct)
router.patch('/unblock/:id', unBlockProduct)

module.exports = router;