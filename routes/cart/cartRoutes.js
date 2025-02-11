const express = require('express');
const router = express.Router();
const { addToCart, getCart, deleteProductFromCart, updateProductQuantity, clearCart } = require('../../controllers/cart/cartController');
const authMiddleware = require('../../middleware/authMiddleware');

router.post('/add-to-cart', authMiddleware, addToCart); 
router.get('/get-cart', authMiddleware, getCart); 
router.delete("/delete-product", authMiddleware, deleteProductFromCart);
router.put("/update-quantity", authMiddleware, updateProductQuantity);
router.delete("/clear-cart", authMiddleware, clearCart)
module.exports = router;
