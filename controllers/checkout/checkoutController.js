const Checkout = require("../../models/checkout/checkoutModal");
const Cart = require("../../models/cart/cartModal");
const Address = require("../../models/address/addressModal");
const Size = require("../../models/checkout/checkoutModal");
const asyncHandler = require("express-async-handler");
const { mongoose } = require("mongoose");

const createCheckout = asyncHandler(async (req, res) => {

  const session = await mongoose.startSession();
  session.startTransaction();
  const {
    cartId,
    addressId,
    shippingMethod,
    paymentMethod,
    transactionId,
    paymentStatus,
  } = req.body;

  // Validate required fields
  if (
    !cartId ||
    !addressId ||
    !shippingMethod ||
    !paymentMethod ||
    !transactionId ||
    !paymentStatus
  ) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Fetch the cart details using the cartId
    const cart = await Cart.findById(cartId)
      .populate({
        path: "items.product",
        select: "name price",
      })
      .populate({
        path: "items.variant",
        select: "color mainImage",
      })
      .populate({
        path: "items.sizeVariant",
        select: "size price stockCount",
      });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Fetch the address details using the addressId
    const address = await Address.findById(addressId);
    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    // Calculate the total amount based on the cart items and shipping method
    const totalAmount = cart.totalPrice; // Add shipping cost if required
    const shippingCost = shippingMethod === "Express" ? 15 : 5; // Example: Add different shipping charges for Express/Standard
    const finalAmount = totalAmount + shippingCost;

    // Create a new checkout object
    const newCheckout = new Checkout({
      user: req.user.id,
      cart: cartId,
      items: cart.items.map((item) => ({
        product: item.product,
        variant: item.variant,
        sizeVariant: item.sizeVariant,
        quantity: item.quantity,
        price: item.price,
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
      orderStatus: "pending", // Initial order status, can be updated later
      totalAmount: finalAmount,
    });

    // Save the checkout data
    await newCheckout.save({ session });

    // Optionally, clear the cart if the checkout is successful
    cart.items = [];
    cart.totalPrice = 0;
    cart.isActive = false;
    await cart.save({ session });

    await session.commitTransaction();
    
    res.status(201).json({
      success: true,
      message: "Checkout completed successfully",
      orderId: newCheckout._id
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error completing checkout", error: error.message });
  }
});

const getOrders = asyncHandler(async (req, res) => {
  try {
    const orders = await Checkout.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate({
        path: "items.product",
        select: "name price",
      })
      .populate({
        path: "items.variant",
        select: "color mainImage",
      })
      .populate({
        path: "items.sizeVariant",
        select: "size price",
      })
      .populate({
        path: "shipping.address",
        select: "fullName address city state pincode mobileNumber addressType",
      });

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
      .populate({
        path: "user",
        select: "name email",
      })
      .populate({
        path: "items.product",
        select: "name",
      })
      .populate({
        path: "items.variant",
        select: "color mainImage",
      })
      .populate({
        path: "items.sizeVariant",
        select: "size price stockCount",
      })
      .populate({
        path: "shipping.address",
        select: "fullName address city state pincode mobileNumber addressType",
      })
      .sort({ createdAt: -1 }); // Sort by newest first

    // Format orders for admin panel display
    const formattedOrders = orders.map((order) => ({
      orderId: order._id,
      customer: {
        name: order.user.name,
        email: order.user.email,
      },
      items: order.items.map((item) => ({
        itemId: item._id,
        productName: item.product.name,
        color: item.variant.color,
        size: item.sizeVariant.size,
        quantity: item.quantity,
        price: item.price,
        image: item.variant.mainImage,
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
  const { orderId, itemId } = req.params;
  const { reason } = req.body; 

  try {
    const order = await Checkout.findById(orderId);

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    const itemIndex = order.items.findIndex(
      (item) => item._id.toString() === itemId
    );

    if (itemIndex === -1) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found" });
    }

    order.items[itemIndex].status = "Cancelled"; 

    const allCancelled = order.items.every(
      (item) => item.status === "Cancelled"
    );

    if (allCancelled) {
      order.orderStatus = "Cancelled";
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: "Order item cancelled successfully",
      order, 
    });
  } catch (error) {
    console.error("Error cancelling item:", error);
    res.status(500).json({
      success: false,
      message: "Error cancelling item",
      error: error.message,
    });
  }
});

module.exports = {
  createCheckout,
  getOrders,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
};
