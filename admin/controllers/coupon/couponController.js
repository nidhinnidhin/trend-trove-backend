const Coupon = require("../../../models/coupon/couponModal");
const asyncHandler = require("express-async-handler");

// Add Coupon
const addCoupon = asyncHandler(async (req, res) => {
  try {
    const {
      couponCode,
      discountType,
      discountValue,
      startDate,
      endDate,
      minOrderAmount,
    } = req.body;

    const existingCoupon = await Coupon.findOne({ couponCode });
    if (existingCoupon)
      return res.status(400).json({ message: "Coupon code already exists" });

    const newCoupon = new Coupon({
      couponCode,
      discountType,
      discountValue,
      startDate,
      endDate,
      minOrderAmount,
    });
    await newCoupon.save();

    res
      .status(201)
      .json({ message: "Coupon added successfully", coupon: newCoupon });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
  }
});

const getCoupons = asyncHandler(async (req, res) => {
  try {
    let { page = 1, limit = 10, search = "" } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const query = search
      ? {
          $or: [
            { couponCode: { $regex: search, $options: "i" } },
            { discountType: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const totalCoupons = await Coupon.countDocuments(query);
    const coupons = await Coupon.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      totalCoupons,
      currentPage: page,
      totalPages: Math.ceil(totalCoupons / limit),
      coupons,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching coupons", error });
  }
});

const getCouponById = asyncHandler(async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });

    res.status(200).json(coupon);
  } catch (error) {
    res.status(500).json({ message: "Error fetching coupon", error });
  }
});

const updateCoupon = asyncHandler(async (req, res) => {
  try {
    const {
      couponCode,
      discountType,
      discountValue,
      startDate,
      endDate,
      minOrderAmount,
    } = req.body;
    const updatedCoupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      {
        couponCode,
        discountType,
        discountValue,
        startDate,
        endDate,
        minOrderAmount,
      },
      { new: true }
    );

    if (!updatedCoupon)
      return res.status(404).json({ message: "Coupon not found" });

    res
      .status(200)
      .json({ message: "Coupon updated successfully", coupon: updatedCoupon });
  } catch (error) {
    res.status(500).json({ message: "Error updating coupon", error });
  }
});

const deleteCoupon = asyncHandler(async (req, res) => {
  try {
    const deletedCoupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!deletedCoupon)
      return res.status(404).json({ message: "Coupon not found" });

    res.status(200).json({ message: "Coupon deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting coupon", error });
  }
});


// const applyCoupon = asyncHandler(async (req, res) => {
//     try {
//       const { couponCode, userId, totalPrice } = req.body;
  
//       const coupon = await Coupon.findOne({ couponCode });
  
//       if (!coupon) {
//         return res.status(404).json({ message: "Coupon not found" });
//       }
  
//       if (coupon.isExpired || coupon.usedBy) {
//         return res.status(400).json({ message: "Coupon is already used or expired" });
//       }
  
//       if (coupon.minOrderAmount > totalPrice) {
//         return res.status(400).json({ message: "Minimum order amount not met" });
//       }
  
//       if (coupon.endDate < new Date()) {
//         return res.status(400).json({ message: "Coupon has expired" });
//       }
  
//       let discountAmount = 0;
//       if (coupon.discountType === 'percentage') {
//         discountAmount = (totalPrice * coupon.discountValue) / 100;
//       } else {
//         discountAmount = coupon.discountValue;
//       }
  
//       const finalTotal = totalPrice - discountAmount;
  
//       res.status(200).json({
//         message: "Coupon applied successfully",
//         discountAmount,
//         finalTotal,
//       });
//     } catch (error) {
//       res.status(500).json({ message: "Error applying coupon", error });
//     }
//   });

module.exports = {
  addCoupon,
  getCoupons,
  updateCoupon,
  deleteCoupon,
  getCouponById,
  // applyCoupon
};
