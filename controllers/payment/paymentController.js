const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../../models/payment/paymentModel');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const createOrder = async (req, res) => {
  try {
    const { amount, currency } = req.body;
    
    const options = {
      amount: Math.round(amount), // amount in paise
      currency: currency || 'INR',
      receipt: 'order_' + Date.now(),
    };

    const order = await razorpay.orders.create(options);

    // Save order details to database
    await Payment.create({
      userId: req.user.id,
      orderId: order.id,
      amount: amount / 100, // Convert paise to rupees for storage
      currency: currency || 'INR',
      status: 'created'
    });

    res.status(200).json(order);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Failed to create order', error: error.message });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    // Generate signature for verification
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    // Verify signature
    if (expectedSignature === razorpay_signature) {
      // Update payment status in database
      await Payment.findOneAndUpdate(
        { orderId: razorpay_order_id },
        {
          paymentId: razorpay_payment_id,
          signature: razorpay_signature,
          status: 'completed'
        }
      );

      res.json({ status: 'success' });
    } else {
      res.status(400).json({ message: 'Invalid signature' });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ message: 'Payment verification failed', error: error.message });
  }
};

module.exports = {
  createOrder,
  verifyPayment
};