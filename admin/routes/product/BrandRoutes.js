const express = require('express');
const { addBrand, editBrand, blockBrand, unBlockBrand, getAllBrandsAdmin } = require('../../../admin/controllers/product/BrandController');
const { uploadSingle } = require('../../../middleware/multer');
const adminAuthMiddleware = require("../../middleware/adminAuthMiddleware")

const router = express.Router();

router.get('/get/admin', getAllBrandsAdmin);
router.post('/add',adminAuthMiddleware, uploadSingle, addBrand);
router.patch('/edit/:brandId',adminAuthMiddleware, uploadSingle, editBrand);
router.patch('/block/:id',adminAuthMiddleware, blockBrand);
router.patch('/unblock/:id',adminAuthMiddleware, unBlockBrand);

module.exports = router;
