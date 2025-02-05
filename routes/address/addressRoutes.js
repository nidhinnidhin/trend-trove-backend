const express = require('express');
const router = express.Router();
const {addAddress, getAddresses, editAddress, deleteAddress} = require('../../controllers/addres/addressController')
const authMiddleware = require('../../middleware/authMiddleware');

// Route for adding product to cart
router.post('/add-address', authMiddleware, addAddress); 
router.get('/get-address', authMiddleware, getAddresses); 
router.put('/edit-address/:id', authMiddleware, editAddress);
router.delete("/delete-address/:id", authMiddleware, deleteAddress);

module.exports = router;