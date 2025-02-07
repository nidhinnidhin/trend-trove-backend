const express = require("express");
const router = express.Router();
const { createCheckout, getOrders, getAllOrders, updateOrderStatus, cancelOrder, orderHistory } = require("../../controllers/checkout/checkoutController");
const authMiddleware = require('../../middleware/authMiddleware');

router.post("/create-checkout",authMiddleware, createCheckout);
router.get("/get-orders",authMiddleware, getOrders);
router.get("/get-all-order-product", getAllOrders)
router.get("/order-history/:orderId", orderHistory)
router.patch("/update-order-status/:orderId", updateOrderStatus);
router.patch("/cancel-order/:orderId/:itemId", cancelOrder);

// router.get("/user-checkouts",authMiddleware, getUserCheckouts);

module.exports = router;
