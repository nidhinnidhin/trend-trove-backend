const express = require("express");
const {
  addProduct,
  updateProduct,
  blockProduct,
  unBlockProduct,
  getAllProductsAdmin,
} = require("../../../admin/controllers/product/ProductController");
const adminAuthMiddleware = require("../../middleware/adminAuthMiddleware");

const router = express.Router();

router.get("/get", adminAuthMiddleware, getAllProductsAdmin);
router.post("/add", adminAuthMiddleware, addProduct);
router.put("/update/:id", adminAuthMiddleware, updateProduct);
router.patch("/block/:id", adminAuthMiddleware, blockProduct);
router.patch("/unblock/:id", adminAuthMiddleware, unBlockProduct);

module.exports = router;
