const express = require("express");
const router = express.Router();
const { getAllOrders, updateOrderStatus, orderHistory } = require("../../controllers/checkout/CheckoutController");

router.get("/get-all-order-product", getAllOrders)
router.get("/order-history/:orderId", orderHistory)
router.patch("/update-order-status/:orderId/:itemId", updateOrderStatus);

module.exports = router;
