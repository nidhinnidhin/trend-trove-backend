const Checkout = require("../../../models/checkout/checkoutModal");
const Cart = require("../../../models/cart/cartModal");
const Wallet = require("../../../models/wallet/walletModel");
const Address = require("../../../models/address/addressModal");
const Size = require("../../../models/product/sizesVariantModel");
const asyncHandler = require("express-async-handler");
const { default: mongoose } = require("mongoose");
const nodemailer = require("nodemailer");

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
    select: 'fullName address city state pincode mobileNumber addressType',
    match: { $or: [{ isActive: true }, { isUsedInOrder: true }] }
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
        status: item.status,
        returnRequested: item.returnRequested || false,
        returnStatus: item.returnStatus,
        returnReason: item.returnReason,
        additionalDetails: item.additionalDetails
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
    const validStatuses = ["pending", "Processing","Shiped", "Delivered", "Cancelled"];
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

// const approveReturn = asyncHandler(async (req, res) => {
//   const { orderId, itemId } = req.params;
//   const { approved } = req.body;

//   try {
//     const order = await Checkout.findOne({
//       _id: orderId,
//       "items._id": itemId,
//     });

//     if (!order) {
//       return res.status(404).json({ success: false, message: "Order or item not found" });
//     }

//     const itemIndex = order.items.findIndex((item) => item._id.toString() === itemId);
    
//     if (itemIndex === -1) {
//       return res.status(404).json({ success: false, message: "Item not found in this order" });
//     }

//     if (approved) {
//       order.items[itemIndex].status = "Returned";
//       order.items[itemIndex].returnStatus = "Return Approved";
//     } else {
//       order.items[itemIndex].returnStatus = "Return Rejected";
//       order.items[itemIndex].returnRequested = false;
//     }

//     await order.save();

//     res.status(200).json({ 
//       success: true, 
//       message: `Return ${approved ? 'approved' : 'rejected'} successfully`,
//       order 
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ 
//       success: false, 
//       message: "An error occurred while processing the return request" 
//     });
//   }
// });

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const approveReturn = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orderId, itemId } = req.params;
    const { approved, rejectionReason } = req.body;

    const order = await Checkout.findById(orderId)
      .populate({
        path: "items.sizeVariant",
        select: "stockCount inStock",
      })
      .populate({
        path: "user",
        select: "email name"
      });

    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const itemIndex = order.items.findIndex((item) => item._id.toString() === itemId);

    if (itemIndex === -1) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Item not found in this order" });
    }

    const item = order.items[itemIndex];

    if (approved) {
      // Update item return status
      order.items[itemIndex].status = "Returned";
      order.items[itemIndex].returnStatus = "Return Approved";

      // Increase stock count for the returned item
      if (item.sizeVariant) {
        const sizeVariant = await Size.findById(item.sizeVariant._id);

        if (sizeVariant) {
          sizeVariant.stockCount += item.quantity;
          if (sizeVariant.stockCount > 0) {
            sizeVariant.inStock = true;
          }
          await sizeVariant.save({ session });
        }
      }
    } else {
      order.items[itemIndex].returnStatus = "Return Rejected";
      order.items[itemIndex].returnRequested = false;
      order.items[itemIndex].rejectionReason = rejectionReason;

      // Send rejection email
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: order.user.email,
        subject: "Return Request Rejected",
        html: `
          <h2>Return Request Rejected</h2>
          <p>Dear ${order.user.name},</p>
          <p>Your return request for Order #${order._id} has been rejected.</p>
          <p><strong>Reason for rejection:</strong></p>
          <p>${rejectionReason}</p>
          <p>If you have any questions, please contact our customer support.</p>
          <p>Thank you for shopping with us!</p>
        `
      };

      await transporter.sendMail(mailOptions);
    }

    await order.save({ session });
    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: `Return ${approved ? "approved" : "rejected"} successfully`,
      order,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error(error);
    res.status(500).json({
      success: false,
      message: "An error occurred while processing the return request",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
});


module.exports = {
  getAllOrders,
  updateOrderStatus,
  orderHistory,
  approveReturn
};
