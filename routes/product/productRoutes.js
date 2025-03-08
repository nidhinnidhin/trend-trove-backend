const express = require("express");
const { getAllProducts, getProductById, getProductDetail, fetchRelatedProducts, searchProducts, searchAndFetchRelatedProducts, getProductsByBrand, getProductsByCategory, getProductsByGender, getProductFilters } = require("../../controllers/product/productController");
const filterDeletedProducts = require('../../middleware/filterNotDeletedProducts')
const router = express.Router();

router.use(filterDeletedProducts);

router.get("/filters", getProductFilters);
router.get("/get", getAllProducts);

router.get("/:id", getProductById);
router.get("/:id/details", getProductDetail);
router.get("/related/:category/:productId", fetchRelatedProducts);
router.get("/product/search", searchProducts);
router.get("/product/search/related", searchAndFetchRelatedProducts);
router.get("/brand/:brandId", getProductsByBrand);
router.get("/category/:categoryId", getProductsByCategory);
router.get("/gender/:gender", getProductsByGender);

module.exports = router;
