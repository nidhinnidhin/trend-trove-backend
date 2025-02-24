const express = require('express');
const router = express.Router();
const { addReview, getReviews } = require('../../controllers/review/reviewController');
const authMiddleware = require('../../middleware/authMiddleware');


router.post('/add',authMiddleware, addReview);
router.get('/get/:productId', getReviews);

module.exports = router;