const Coupon = require("../../models/coupon/couponModal");
const asyncHandler = require('express-async-handler');

const validateCoupon = asyncHandler(async (req, res, next) => {
  const { couponCode, userId, totalPrice } = req.body;

  const coupon = await Coupon.findOne({ couponCode });

  if (!coupon) {
    return res.status(404).json({ message: "Coupon not found" });
  }

  if (coupon.isExpired || coupon.usedBy) {
    return res.status(400).json({ message: "Coupon is already used or expired" });
  }

  if (coupon.minOrderAmount > totalPrice) {
    return res.status(400).json({ message: "Minimum order amount not met" });
  }

  if (coupon.endDate < new Date()) {
    return res.status(400).json({ message: "Coupon has expired" });
  }

  req.coupon = coupon;
  next();
});

module.exports = validateCoupon;