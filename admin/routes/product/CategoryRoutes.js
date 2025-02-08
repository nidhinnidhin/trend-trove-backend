const express = require('express');
const { addCategory, editCategory, blockCategory, unblockCategory, getAllCategoriesAdmin } = require('../../../admin/controllers/product/CategoryController');

const router = express.Router();

router.get('/get/admin', getAllCategoriesAdmin);
router.post('/add', addCategory);
router.put('/edit/:id', editCategory)
router.patch("/block/:id", blockCategory);
router.patch("/unblock/:id", unblockCategory);

module.exports = router;