const express = require('express');
const {  getCoupons, applyCoupon } = require('../../controllers/coupon/couponController');
const validateCoupon = require('../../admin/middleware/validateCouponMiddleware');
const authMiddleware = require('../../middleware/authMiddleware');

const router = express.Router();

router.get('/get',authMiddleware, getCoupons);
router.post('/apply', authMiddleware, validateCoupon, applyCoupon);

module.exports = router;
