const Coupon = require("../../models/coupon/couponModal");
const asyncHandler = require("express-async-handler");

const getCoupons = asyncHandler(async (req, res) => {
  try {
    const { totalPrice } = req.query;
    const query = {
      minOrderAmount: { $lte: totalPrice },
      endDate: { $gte: new Date() },
      isExpired: false,
      usedBy: { $exists: false }
    };

    const coupons = await Coupon.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      totalCoupons: coupons.length,
      coupons,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching coupons", error });
  }
});

const applyCoupon = asyncHandler(async (req, res) => {
  try {
    const { couponCode, totalPrice, userId } = req.body;

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

    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (totalPrice * coupon.discountValue) / 100;
    } else {
      discountAmount = coupon.discountValue;
    }

    const finalTotal = totalPrice - discountAmount;

    // Mark coupon as used
    coupon.usedBy = userId;
    coupon.isExpired = true;
    await coupon.save();

    res.status(200).json({
      message: "Coupon applied successfully",
      discountAmount,
      finalTotal,
    });
  } catch (error) {
    res.status(500).json({ message: "Error applying coupon", error });
  }
});

module.exports = {
  getCoupons,
  applyCoupon,
};