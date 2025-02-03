// const express = require('express');
// const { 
//   addVariant, 
//   getVariantsByProduct, 
//   // getVariantDetails, 
//   updateVariant, 
//   // deleteVariant, 
//   getAllVariants 
// } = require('../../controllers/product/variantController');
// const { uploadMultiple } = require('../../middleware/multer');

// const router = express.Router();

// router.post('/',uploadMultiple, addVariant); 
// router.put('/edit/:id',uploadMultiple, updateVariant); 

// router.get('/product/:productId', getVariantsByProduct);

// router.get('/get', getAllVariants);

// module.exports = router;


const express = require("express");
const { addColorVariant, getProductVariants, editColorVariant } = require("../../controllers/product/colorsVariantController");
const { uploadMultiple } = require('../../middleware/multer');

const router = express.Router();

router.post("/color/add", uploadMultiple, addColorVariant);
router.get("/variant/get/:id", getProductVariants);
router.put("/variant/edit/:variantId", uploadMultiple, editColorVariant);

module.exports = router;
