const express = require('express');
const router = express.Router();
const { addToCart, getCart, deleteProductFromCart, updateProductQuantity } = require('../../controllers/cart/cartController');
const authMiddleware = require('../../middleware/authMiddleware');

// Route for adding product to cart
router.post('/add-to-cart', authMiddleware, addToCart); 
router.get('/get-cart', authMiddleware, getCart); 
router.delete("/delete-product", authMiddleware, deleteProductFromCart);
router.put("/update-quantity", authMiddleware, updateProductQuantity);
module.exports = router;
