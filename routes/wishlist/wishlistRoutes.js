const express = require('express');
const router = express.Router();
const { addToWishlist, getWishlist } = require('../../controllers/wishlist/WishlistController');
const authMiddleware = require('../../middleware/authMiddleware');


router.post('/add',authMiddleware, addToWishlist);
router.get('/get',authMiddleware, getWishlist);

module.exports = router;