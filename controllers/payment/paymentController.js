const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../../models/payment/paymentModel');
const Checkout = require('../../models/checkout/checkoutModal');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const createOrder = async (req, res) => {
  try {
    const { amount, currency, checkoutId } = req.body;
    
    if (!checkoutId) {
      return res.status(400).json({ message: "Checkout ID is required" });
    }

    // Verify checkout exists
    const checkout = await Checkout.findById(checkoutId);
    if (!checkout) {
      return res.status(404).json({ message: "Checkout not found" });
    }

    const options = {
      amount: Math.round(amount), // amount in paise
      currency: currency || 'INR',
      receipt: 'order_' + Date.now(),
    };

    const order = await razorpay.orders.create(options);

    // Save order details to database
    const payment = await Payment.create({
      userId: req.user.id,
      orderId: order.id,
      amount: amount / 100,
      currency: currency || 'INR',
      status: 'created',
      checkoutId: checkoutId
    });

    res.status(200).json({
      ...order,
      paymentId: payment._id
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ 
      message: 'Failed to create order', 
      error: error.message 
    });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      checkoutId
    } = req.body;

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      await Payment.findOneAndUpdate(
        { orderId: razorpay_order_id },
        {
          paymentId: razorpay_payment_id,
          signature: razorpay_signature,
          status: 'completed'
        }
      );

      await Checkout.findByIdAndUpdate(
        checkoutId,
        { 
          'payment.status': 'completed',
          'payment.transactionId': razorpay_payment_id
        }
      );

      res.json({ status: 'success' });
    } else {
      res.status(400).json({ message: 'Invalid signature' });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ message: 'Payment verification failed' });
  }
};

const handlePaymentCancel = async (req, res) => {
  try {
    const { orderId, checkoutId } = req.body;
    
    await Payment.findOneAndUpdate(
      { orderId },
      { status: 'retry_pending' }
    );

    await Checkout.findByIdAndUpdate(
      checkoutId,
      { 
        'payment.status': 'retry_pending'
      }
    );

    res.json({ status: 'success' });
  } catch (error) {
    console.error('Payment cancellation error:', error);
    res.status(500).json({ message: 'Failed to handle payment cancellation' });
  }
};

// Make sure all functions are exported
module.exports = {
  createOrder,
  verifyPayment,
  handlePaymentCancel
};