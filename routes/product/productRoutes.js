const express = require("express");
const { getAllProducts, getProductById, getProductDetail, fetchRelatedProducts, searchProducts, searchAndFetchRelatedProducts } = require("../../controllers/product/productController");

const router = express.Router();

router.get("/get", getAllProducts);

router.get("/:id", getProductById);
router.get("/:id/details", getProductDetail);
router.get("/related/:category/:productId", fetchRelatedProducts);
router.get("/product/search", searchProducts);
router.get("/product/search/related", searchAndFetchRelatedProducts);

module.exports = router;
