const express = require('express');
const { addCategory, editCategory, blockCategory, unblockCategory, getAllCategoriesAdmin } = require('../../../admin/controllers/product/CategoryController');
const adminAuthMiddleware = require('../../middleware/adminAuthMiddleware')
const router = express.Router();

router.get('/get/admin',adminAuthMiddleware, getAllCategoriesAdmin);
router.post('/add',adminAuthMiddleware, addCategory);
router.put('/edit/:id',adminAuthMiddleware, editCategory)
router.patch("/block/:id",adminAuthMiddleware, blockCategory);
router.patch("/unblock/:id",adminAuthMiddleware, unblockCategory);

module.exports = router;