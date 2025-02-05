const Checkout = require("../../models/checkout/checkoutModal");
const Cart = require("../../models/cart/cartModal");
const Address = require("../../models/address/addressModal");
const asyncHandler = require("express-async-handler");

const createCheckout = asyncHandler(async (req, res) => {
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
    const savedCheckout = await newCheckout.save();

    // Optionally, clear the cart if the checkout is successful
    cart.isActive = false;
    await cart.save();

    res.status(201).json({
      message: "Checkout completed successfully",
      checkout: savedCheckout,
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
      .sort({ createdAt: -1 }) // Sort by newest first
      .populate({
        path: "items.product",
        select: "name price", // Add any other product fields you need
      })
      .populate({
        path: "items.variant",
        select: "color mainImage", // Add image and color info
      })
      .populate({
        path: "items.sizeVariant",
        select: "size price", // Add size and price info
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

    // Transform the orders data to a more friendly format
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

module.exports = { createCheckout, getOrders };
