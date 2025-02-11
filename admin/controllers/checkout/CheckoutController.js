const Checkout = require("../../../models/checkout/checkoutModal");
const Cart = require("../../../models/cart/cartModal");
const Address = require("../../../models/address/addressModal");
const Size = require("../../../models/product/sizesVariantModel");
const asyncHandler = require("express-async-handler");
const { default: mongoose } = require("mongoose");

const orderPopulateConfig = [
  {
    path: 'user',
    select: 'name email'
  },
  {
    path: 'items.product',
    select: 'name price'
  },
  {
    path: 'items.variant',
    select: 'color mainImage'
  },
  {
    path: 'items.sizeVariant',
    select: 'size price stockCount'
  },
  {
    path: 'shipping.address',
    select: 'fullName address city state pincode mobileNumber addressType'
  }
];

const getAllOrders = asyncHandler(async (req, res) => {
  try {
    const orders = await Checkout.find()
      .populate(orderPopulateConfig)
      .sort({ createdAt: -1 });

    const formattedOrders = orders.map((order) => ({
      orderId: order._id,
      customer: {
        name: order.user?.name,
        email: order.user?.email,
      },
      items: order.items.map((item) => ({
        itemId: item._id,
        productName: item.product?.name,
        color: item.variant?.color,
        size: item.sizeVariant?.size,
        quantity: item.quantity,
        price: item.price,
        image: item.variant?.mainImage,
        status: item.status
      })),
      shippingAddress: order.shipping.address,
      shippingMethod: order.shipping.shippingMethod,
      payment: {
        method: order.payment.method,
        status: order.payment.status,
        transactionId: order.payment.transactionId,
        amount: order.payment.amount,
        date: order.payment.paymentDate,
      },
      orderStatus: order.orderStatus,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
    }));

    res.status(200).json({
      success: true,
      orders: formattedOrders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching orders",
      error: error.message,
    });
  }
});

const orderHistory = asyncHandler(async (req, res) => {
  try {
    const order = await Checkout.findById(req.params.orderId)
      .populate(orderPopulateConfig);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching order history",
      error: error.message,
    });
  }
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orderId, itemId } = req.params;
    const { newStatus } = req.body;

    // Validate status
    const validStatuses = ["pending", "Processing", "Delivered", "Cancelled"];
    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    const order = await Checkout.findById(orderId).session(session);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const item = order.items.id(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    // If item is being cancelled, restore product quantities
    if (newStatus === "Cancelled" && item.status !== "Cancelled") {
      const sizeVariant = await Size.findById(item.sizeVariant).session(session);
      if (sizeVariant) {
        sizeVariant.stockCount += item.quantity;
        if (sizeVariant.stockCount > 0) {
          sizeVariant.inStock = true;
        }
        await sizeVariant.save({ session });
      }
    }

    // Update item status
    item.status = newStatus;

    // Check if all items are cancelled
    const allCancelled = order.items.every((item) => item.status === "Cancelled");
    if (allCancelled) {
      order.orderStatus = "Cancelled";
    } else {
      order.orderStatus = order.items.some((item) => item.status === "Processing") ? "Processing" : "pending";
    }

    await order.save({ session });
    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: "Item status updated successfully",
      order,
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({
      success: false,
      message: "Error updating item status",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
});

module.exports = {
  getAllOrders,
  updateOrderStatus,
  orderHistory
};
