const Coupon = require("../../models/coupon/couponModal");
const asyncHandler = require("express-async-handler");

const getCoupons = asyncHandler(async (req, res) => {
  try {
    const { totalPrice } = req.query;
    const userId = req.user.id;
    
    console.log("Getting coupons for user:", userId, "totalPrice:", totalPrice);
    
    const query = {
      minOrderAmount: { $lte: totalPrice },
      endDate: { $gte: new Date() },
      isExpired: false,
      usedBy: { $nin: [userId] }
    };
    
    console.log("Coupon query:", JSON.stringify(query));
    
    const coupons = await Coupon.find(query).sort({ createdAt: -1 });
    
    console.log("Found coupons count:", coupons.length);
    
    res.status(200).json({
      totalCoupons: coupons.length,
      coupons,
    });
  } catch (error) {
    console.error("Error fetching coupons:", error);
    res.status(500).json({ message: "Error fetching coupons", error: error.message });
  }
});

const applyCoupon = asyncHandler(async (req, res) => {
  try {
    const { couponCode, totalPrice, userId } = req.body;
    
    console.log("Request data:", { couponCode, totalPrice, userId });
    
    const coupon = await Coupon.findOne({ couponCode });
    console.log("---------------------------------")
    console.log("Coupon", coupon);
    
    
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    console.log("Found coupon:", {
      id: coupon._id,
      code: coupon.couponCode,
      isExpired: coupon.isExpired,
      endDate: coupon.endDate,
      usedBy: coupon.usedBy
    });
    
    // Check if coupon is expired by date
    if (coupon.endDate < new Date()) {
      console.log("Coupon expired by date");
      return res.status(400).json({ message: "Coupon has expired by date" });
    }
    
    // Check if coupon is marked as expired
    if (coupon.isExpired) {
      console.log("Coupon marked as expired");
      return res.status(400).json({ message: "Coupon is marked as expired" });
    }
    
    // Check if usedBy is an array
    if (!Array.isArray(coupon.usedBy)) {
      console.log("usedBy is not an array:", coupon.usedBy);
      return res.status(500).json({ message: "Server error: usedBy field is not properly configured" });
    }
    
    // Convert userId to string to ensure consistent comparison
    const userIdStr = userId.toString();
    
    // Check if any item in usedBy matches the userId
    const userHasUsed = coupon.usedBy.some(id => id.toString() === userIdStr);
    
    console.log("User has used coupon:", userHasUsed);
    console.log("usedBy IDs:", coupon.usedBy.map(id => id.toString()));
    console.log("Current userId:", userIdStr);
    
    if (userHasUsed) {
      return res.status(400).json({ message: "You have already used this coupon" });
    }
    
    if (coupon.minOrderAmount > totalPrice) {
      console.log("Minimum order not met");
      return res.status(400).json({ message: "Minimum order amount not met" });
    }
    
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (totalPrice * coupon.discountValue) / 100;
    } else {
      discountAmount = coupon.discountValue;
    }
    
    const finalTotal = totalPrice - discountAmount;
    
    res.status(200).json({
      message: "Coupon applied successfully",
      discountAmount,
      finalTotal,
    });
  } catch (error) {
    console.error("Coupon application error:", error);
    res.status(500).json({ message: "Error applying coupon", error: error.message });
  }
});

module.exports = {
  getCoupons,
  applyCoupon,
};