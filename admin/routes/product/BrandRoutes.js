const express = require('express');
const { addBrand, editBrand, blockBrand, unBlockBrand, getAllBrandsAdmin } = require('../../../admin/controllers/product/BrandController');
const { uploadSingle } = require('../../../middleware/multer');

const router = express.Router();

router.get('/get/admin', getAllBrandsAdmin);
router.post('/add', uploadSingle, addBrand);
router.put('/edit/:brandId', uploadSingle, editBrand);
router.patch('/block/:id', blockBrand);
router.patch('/unblock/:id', unBlockBrand);

module.exports = router;
