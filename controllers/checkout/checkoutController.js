const Checkout = require("../../models/checkout/checkoutModal");
const Cart = require("../../models/cart/cartModal");
const Address = require("../../models/address/addressModal");
const Size = require("../../models/product/sizesVariantModel");
const asyncHandler = require("express-async-handler");
const { mongoose } = require("mongoose");

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

const createCheckout = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const {
      cartId,
      addressId,
      shippingMethod,
      paymentMethod,
      transactionId,
      paymentStatus,
    } = req.body;

    if (!cartId || !addressId || !shippingMethod || !paymentMethod || !transactionId || !paymentStatus) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const cart = await Cart.findById(cartId)
      .populate([
        { path: 'items.product', select: 'name price' },
        { path: 'items.variant', select: 'color mainImage' },
        { path: 'items.sizeVariant', select: 'size price stockCount' }
      ]);

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const address = await Address.findById(addressId);
    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    const totalAmount = cart.totalPrice;
    const shippingCost = shippingMethod === "Express" ? 15 : 5;
    const finalAmount = totalAmount + shippingCost;

    const newCheckout = new Checkout({
      user: req.user.id,
      cart: cartId,
      items: cart.items.map((item) => ({
        product: item.product._id,
        variant: item.variant._id,
        sizeVariant: item.sizeVariant._id,
        quantity: item.quantity,
        price: item.sizeVariant.price,
        status: 'pending'
      })),
      shipping: {
        address: addressId,
        shippingMethod,
      },
      payment: {
        method: paymentMethod,
        status: paymentStatus,
        transactionId,
        amount: finalAmount,
        paymentDate: new Date(),
      },
      orderStatus: "pending",
      totalAmount: finalAmount,
    });
    await newCheckout.save({ session });

    for (const item of cart.items) {
      const sizeVariant = await Size.findById(item.sizeVariant._id);
      console.log("------------",sizeVariant.stockCount );
      
      if (sizeVariant) {
        sizeVariant.stockCount -= item.quantity;
        if (sizeVariant.stockCount <= 0) {
          sizeVariant.inStock = false;
        }
        await sizeVariant.save({ session });
      }
    }
    cart.items = [];
    cart.totalPrice = 0;
    cart.isActive = false;
    await cart.save({ session });

    await session.commitTransaction();
    const completedOrder = await Checkout.findById(newCheckout._id)
      .populate(orderPopulateConfig);

    res.status(201).json({
      success: true,
      message: "Checkout completed successfully",
      order: completedOrder
    });

  } catch (error) {
    await session.abortTransaction();
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: "Error completing checkout", 
      error: error.message 
    });
  } finally {
    session.endSession();
  }
});

const getOrders = asyncHandler(async (req, res) => {
  try {
    const orders = await Checkout.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate(orderPopulateConfig);

    if (!orders || orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No orders found",
      });
    }

    const formattedOrders = orders.map((order) => ({
      orderId: order._id,
      orderDate: order.createdAt,
      orderStatus: order.orderStatus,
      shippingAddress: order.shipping.address,
      shippingMethod: order.shipping.shippingMethod,
      payment: {
        method: order.payment.method,
        status: order.payment.status,
        amount: order.payment.amount,
      },
      items: order.items.map((item) => ({
        itemId: item._id,
        status: item.status,
        productName: item.product?.name || "N/A",
        price: item.sizeVariant?.price || 0,
        quantity: item.quantity,
        color: item.variant?.color || "N/A",
        size: item.sizeVariant?.size || "N/A",
        image: item.variant?.mainImage || "N/A",
      })),
      totalAmount: order.totalAmount,
    }));

    res.status(200).json({
      success: true,
      orders: formattedOrders,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching orders",
      error: error.message,
    });
  }
});

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
  try {
    const { orderId } = req.params;
    const { newStatus } = req.body;

    // Validate status
    const validStatuses = ["pending", "Processing", "Delivered", "Cancelled"];
    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    const order = await Checkout.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // If order is being cancelled, restore product quantities
    if (newStatus === "Cancelled" && order.orderStatus !== "Cancelled") {
      for (const item of order.items) {
        const sizeVariant = await Size.findById(item.sizeVariant);
        if (sizeVariant) {
          sizeVariant.stockCount += item.quantity;
          await sizeVariant.save();
        }
      }
    }

    // Update order status
    order.orderStatus = newStatus;
    await order.save();

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating order status",
      error: error.message,
    });
  }
});

const cancelOrder = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orderId, itemId } = req.params;
    const { reason } = req.body;

    const order = await Checkout.findById(orderId).populate({
      path: "items.sizeVariant",
      select: "stockCount inStock",
    });

    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const itemIndex = order.items.findIndex(
      (item) => item._id.toString() === itemId
    );

    if (itemIndex === -1) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    const item = order.items[itemIndex];

    // Only restore stock if item wasn't already cancelled
    if (item.status !== "Cancelled") {
      const sizeVariant = await Size.findById(item.sizeVariant._id);

      if (sizeVariant) {
        sizeVariant.stockCount += item.quantity;
        if (sizeVariant.stockCount > 0) {
          sizeVariant.inStock = true;
        }
        await sizeVariant.save({ session });
      }
    }

    order.items[itemIndex].status = "Cancelled";
    order.items[itemIndex].cancellationReason = reason;

    const allCancelled = order.items.every(
      (item) => item.status === "Cancelled"
    );

    if (allCancelled) {
      order.orderStatus = "Cancelled";
      order.reason = reason;
    }

    await order.save({ session });
    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: "Order item cancelled successfully",
      order,
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({
      success: false,
      message: "Error cancelling item",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
});
module.exports = {
  createCheckout,
  getOrders,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
  orderHistory
};
