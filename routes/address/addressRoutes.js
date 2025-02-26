const express = require('express');
const router = express.Router();
const {addAddress, getAddresses, editAddress, deleteAddress, getCheckoutAddresses} = require('../../controllers/addres/addressController')
const authMiddleware = require('../../middleware/authMiddleware');

router.post('/add-address', authMiddleware, addAddress); 
router.get('/get-address', authMiddleware, getAddresses); 
router.put('/edit-address/:id', authMiddleware, editAddress);
router.delete("/delete-address/:id", authMiddleware, deleteAddress);
router.get("/checkout-addresses", authMiddleware, getCheckoutAddresses);

module.exports = router;