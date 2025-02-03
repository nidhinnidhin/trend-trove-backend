const express = require('express');
const router = express.Router();
const {addAddress} = require('../../controllers/addres/addressController')
const authMiddleware = require('../../middleware/authMiddleware');

// Route for adding product to cart
router.post('/add-address', authMiddleware, addAddress); 
module.exports = router;