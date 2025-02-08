const express = require('express');
const router = express.Router();
const { getAllCategories } = require('../../controllers/product/categoryController');

router.get('/', getAllCategories);

module.exports = router;