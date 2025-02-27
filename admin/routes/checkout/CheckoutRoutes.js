const express = require("express");
const router = express.Router();
const { getAllOrders, updateOrderStatus, orderHistory, approveReturn } = require("../../controllers/checkout/CheckoutController");
const adminAuthMiddleware = require('../../middleware/adminAuthMiddleware')

router.get("/get-all-order-product",adminAuthMiddleware, getAllOrders)
router.get("/order-history/:orderId",adminAuthMiddleware, orderHistory)
router.patch("/update-order-status/:orderId/:itemId",adminAuthMiddleware, updateOrderStatus);
router.patch("/approve-return/:orderId/:itemId", adminAuthMiddleware, approveReturn);

module.exports = router;
