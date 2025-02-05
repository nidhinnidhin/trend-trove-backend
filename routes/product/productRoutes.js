// const express = require('express');
// const { addProduct, getAllProducts, getMetaData, getProductDetails, updateProduct, blockProduct, unBlockProduct, getRelatedProducts } = require('../../controllers/product/productController');

// const router = express.Router();

// router.post('/add', addProduct);

// router.get('/', getAllProducts);

// router.put("/edit/:id", updateProduct);

// router.get('/metadata', getMetaData);

// router.get('/:id', getProductDetails);

// router.patch('/block/:id', blockProduct)
// router.patch('/unblock/:id', unBlockProduct)
// router.get("/related/:id", getRelatedProducts);

// module.exports = router;


const express = require("express");
const { addProduct, getAllProducts, getProductById, updateProduct, getProductDetail, fetchRelatedProducts, searchProducts, searchAndFetchRelatedProducts } = require("../../controllers/product/productController");

const router = express.Router();

router.post("/add", addProduct);

router.get("/get", getAllProducts);

router.get("/:id", getProductById);
router.put("/update/:id", updateProduct);
router.get("/:id/details", getProductDetail);
router.get("/related/:category/:productId", fetchRelatedProducts);
router.get("/product/search", searchProducts);
router.get("/product/search/related", searchAndFetchRelatedProducts);

module.exports = router;
