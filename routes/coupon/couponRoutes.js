const express = require('express');
const {  getCoupons, applyCoupon } = require('../../controllers/coupon/couponController');
const validateCoupon = require('../../admin/middleware/validateCouponMiddleware');
const authMiddleware = require('../../middleware/authMiddleware');
const asyncHandler = require('express-async-handler');
const Coupon = require('../../models/coupon/couponModal');

const router = express.Router();

router.get('/get',authMiddleware, getCoupons);
router.post('/apply', authMiddleware, applyCoupon);

router.get('/active', asyncHandler(async (req, res) => {
  try {
    const { totalPrice } = req.query;
    const query = {
      minOrderAmount: { $lte: totalPrice },
      endDate: { $gte: new Date() },
      isExpired: false,
      usedBy: { $nin: [req.user.id] }
    };

    const coupons = await Coupon.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      totalCoupons: coupons.length,
      coupons,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching coupons", error });
  }
}));

module.exports = router;
