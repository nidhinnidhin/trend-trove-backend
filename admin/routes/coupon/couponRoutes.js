const express = require('express');
const { addCoupon, getCoupons, updateCoupon, applyCoupon, deleteCoupon } = require('../../controllers/coupon/couponController');
const adminAuthMiddleware = require("../../middleware/adminAuthMiddleware");
const validateCoupon = require('../../middleware/validateCouponMiddleware');

const router = express.Router();

router.post('/add',adminAuthMiddleware, addCoupon);
router.get('/get',adminAuthMiddleware, getCoupons);
router.put('/edit/:id', adminAuthMiddleware, updateCoupon);
router.post('/apply', validateCoupon, applyCoupon);
router.delete('/delete/:id', adminAuthMiddleware, deleteCoupon)

module.exports = router;
