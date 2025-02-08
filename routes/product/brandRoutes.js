// routes/brandRoutes.js
const express = require('express');
const { getAllBrands } = require('../../controllers/product/brandController');

const router = express.Router();

router.get('/', getAllBrands);

module.exports = router;
