const express = require("express");
const router = express.Router();
const { createCheckout, getOrders } = require("../../controllers/checkout/checkoutController");
const authMiddleware = require('../../middleware/authMiddleware');

router.post("/create-checkout",authMiddleware, createCheckout);
router.get("/get-orders",authMiddleware, getOrders);

// router.get("/user-checkouts",authMiddleware, getUserCheckouts);

module.exports = router;
