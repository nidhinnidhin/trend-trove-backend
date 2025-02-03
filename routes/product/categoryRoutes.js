const express = require('express');
const router = express.Router();
const { addCategory, getAllCategories, editCategory, blockCategory, unblockCategory, getAllCategoriesAdmin } = require('../../controllers/product/categoryController');

router.get('/', getAllCategories);
router.get('/get/admin', getAllCategoriesAdmin);
router.post('/add', addCategory);
router.put('/edit/:id', editCategory)
router.patch("/block/:id", blockCategory);
router.patch("/unblock/:id", unblockCategory);

module.exports = router;