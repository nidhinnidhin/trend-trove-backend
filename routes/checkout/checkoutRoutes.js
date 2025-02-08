const express = require("express");
const router = express.Router();
const { createCheckout, getOrders, cancelOrder } = require("../../controllers/checkout/checkoutController");
const authMiddleware = require('../../middleware/authMiddleware');

router.post("/create-checkout",authMiddleware, createCheckout);
router.get("/get-orders",authMiddleware, getOrders);
router.patch("/cancel-order/:orderId/:itemId", cancelOrder);

module.exports = router;
