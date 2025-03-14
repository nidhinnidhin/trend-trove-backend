// Import core dependencies
const express = require("express");
const http = require('http');
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require('express-session');
const passport = require("passport");
const mongoose = require('mongoose');
require("dotenv").config();

// Import security middleware
const helmet = require('helmet');
const csrf = require('csurf');
const morgan = require('morgan');

// Import database connection
const connectDb = require("./db/connection");

// Import socket.io
const { Server } = require('socket.io');

// Import models
const Chat = require('./models/chat/chatModel');
const User = require('./models/userModel'); 
const Admin = require('./models/admin/adminModel');
const Review = require("./models/review/reviewModel");

// Import helpers
const { updateOfferStatus } = require('./admin/helper/offerHelpers');
const { createInitialAdmin } = require('./admin/controllers/authentication/adminController');
const cron = require('node-cron');

// Initialize express app and server
const app = express();
const server = http.createServer(app);

// Define allowed origins
const allowedOrigins = [
  'https://www.trendrove.shop',
  'https://trendrove.shop',
  'http://localhost:3000',
  'https://www.api.trendrove.shop',
  'https://api.trendrove.shop',
  'https://trend-trove-frontend-git-master-nidhinbabu171gmailcoms-projects.vercel.app'
];

// Configure socket.io
const io = new Server(server, { 
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Socket.io event handlers
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join', async (userId) => {
    console.log(`User ${userId} joined the chat`);
    socket.join(userId);
  });

  socket.on('admin-join', () => {
    console.log('Admin joined the chat');
    socket.join('admin-room');
  });

  socket.on('send-message', async (data) => {
    try {
      const { userId, message, senderType } = data;
      
      let senderId;
      if (senderType === 'Admin') {
        const admin = await Admin.findOne({ email: 'admin@gmail.com' });
        senderId = admin._id;
      } else {
        senderId = userId;
      }
      
      const messageObj = {
        _id: new mongoose.Types.ObjectId(),
        sender: senderId,
        senderType,
        message,
        timestamp: new Date(),
        read: false
      };

      let chat = await Chat.findOne({ user: userId });

      if (!chat) {
        chat = new Chat({
          user: userId,
          messages: [messageObj],
          lastMessage: new Date()
        });
      } else {
        const isDuplicate = chat.messages.some(msg => 
          msg.message === message && 
          msg.senderType === senderType &&
          Math.abs(new Date(msg.timestamp) - new Date()) < 1000 
        );

        if (!isDuplicate) {
          chat.messages.push(messageObj);
          chat.lastMessage = new Date();
        }
      }

      await chat.save();

      if (senderType === 'User') {
        socket.emit('message-sent', { status: 'success', message: messageObj });
        io.to('admin-room').emit('new-message', { 
          chatId: chat._id,
          message: messageObj 
        });
      } else {
        io.to(userId).emit('new-message', { message: messageObj });
        socket.emit('message-sent', { status: 'success', message: messageObj });
      }

    } catch (error) {
      console.error('Error handling message:', error);
      socket.emit('error', { message: 'Failed to process message' });
    }
  });

  socket.on('mark-messages-read', async ({ chatId }) => {
    try {
      await Chat.updateMany(
        { _id: chatId, 'messages.read': false },
        { 
          $set: { 
            'messages.$[elem].read': true,
            'messages.$[elem].delivered': true
          }
        },
        { 
          arrayFilters: [{ 'elem.senderType': 'User', 'elem.read': false }],
          multi: true 
        }
      );

      io.to(chatId).emit('messages-read', { chatId });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Configure Passport
require("./config/passport");

// Middleware setup
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 
  }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'x-csrf-token',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  exposedHeaders: ['x-csrf-token']
}));

// CSRF protection setup
const csrfProtection = csrf({
  cookie: {
    key: '_csrf',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/'
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({
      status: 'error',
      message: 'Invalid CSRF token',
    });
  }
  
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error'
  });
});

// CSRF token generation endpoint
app.get('/api/csrf-token', (req, res) => {
  const token = csrf({
    cookie: {
      key: '_csrf',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/'
    }
  })(req, res, () => {
    res.json({ csrfToken: req.csrfToken() });
  });
});

// CSRF middleware with path exclusions
const csrfMiddleware = (req, res, next) => {
  const excludedPaths = [
    '/api/csrf-token',
    '/api/users/logout',
    '/api/admin/adminlogin',
    '/api/admin/logout'
  ];

  if (excludedPaths.includes(req.path) || req.method === 'GET') {
    return next();
  }

  csrfProtection(req, res, next);
};

// Apply security middleware
app.use(csrfMiddleware);
app.use(morgan('dev')); 
app.use(helmet());

// Test route for CSRF
app.post('/api/protected-route', (req, res) => {
  res.send('CSRF token is valid!');
});

// Database index management
async function dropReviewIndex() {
  try {
    await Review.collection.dropIndex("user_1_product_1_variant_1_sizeVariant_1");
    console.log("Successfully dropped the unique review index");
  } catch (error) {
    console.log("Index drop not needed or failed:", error.message);
  }
}

dropReviewIndex();

// Import user related route modules

const userRoutes = require("./routes/userRoutes");
const userProductRoutes = require("./routes/product/productRoutes");
const userBrandRoutes = require("./routes/product/brandRoutes");
const userColorVariantRoutes = require("./routes/product/variantRoutes");
const userCategoryRoutes = require("./routes/product/categoryRoutes");
const userSizeVariantRoutes = require("./routes/product/sizesRoutes");
const cartRoutes = require("./routes/cart/cartRoutes");
const addressRoutes = require("./routes/address/addressRoutes");
const userCheckoutRoutes = require("./routes/checkout/checkoutRoutes");
const userWishlistRoutes = require("./routes/wishlist/wishlistRoutes");
const userCouponRoutes = require("./routes/coupon/couponRoutes");
const payementRoutes = require("./routes/payment/paymentRoutes");
const walletRoutes = require("./routes/wallet/walletRoutes");
const otpRoutes = require("./routes/otp/signupOtpRoutes");
const reviewRoutes = require("./routes/review/reviewRoute");
const bannerRoutes = require("./routes/banners/bannerRoutes");
const userChatRoutes = require('./routes/chat/chatRoutes');

// Import admin related route modules

const adminRoutes = require("./admin/routes/authentication/AdminRoutes");
const adminProductRoutes = require("./admin/routes/product/ProductRoutes");
const adminBrandRoutes = require("./admin/routes/product/BrandRoutes");
const adminColorVariantRoutes = require("./admin/routes/product/ColorVariantRoutes");
const adminCategoryRoutes = require("./admin/routes/product/CategoryRoutes");
const adminSizeVariantRoutes = require("./admin/routes/product/SizeVariantRoutes");
const adminCheckoutRoutes = require("./admin/routes/checkout/CheckoutRoutes");
const adminCouponRoutes = require("./admin/routes/coupon/couponRoutes");
const adminOfferRoutes = require('./admin/routes/offer/offerRoutes');
const adminChatRoutes = require('./admin/routes/chat/chatRoutes');

// Apply routes
// Chat routes (placed before other routes as in original)
app.use("/api/admin/chat/", adminChatRoutes);
app.use("/api/chat/", userChatRoutes);

// User and admin authentication routes
app.use("/api/users/", userRoutes);
app.use("/api/admin/", adminRoutes);

// Product related routes
app.use("/api/products/", userProductRoutes);
app.use("/api/admin/products/", adminProductRoutes);
app.use("/api/brands/", userBrandRoutes); 
app.use("/api/admin/brands/", adminBrandRoutes);
app.use("/api/categories/", userCategoryRoutes);
app.use("/api/admin/categories/", adminCategoryRoutes);
app.use("/api/variants/", userColorVariantRoutes);
app.use("/api/admin/variants/", adminColorVariantRoutes);
app.use("/api/sizes/", userSizeVariantRoutes);
app.use("/api/admin/sizes/", adminSizeVariantRoutes);

// admin related routes
app.use("/api/admin/checkout/", adminCheckoutRoutes);
app.use("/api/admin/coupon/", adminCouponRoutes);
app.use("/api/admin/offer/", adminOfferRoutes);

// User experience routes
app.use("/api/cart/", cartRoutes);
app.use("/api/address/", addressRoutes);
app.use("/api/checkout/", userCheckoutRoutes);
app.use("/api/user/wishlist/", userWishlistRoutes);
app.use("/api/coupon/", userCouponRoutes);
app.use("/api/payment/", payementRoutes);
app.use('/api/wallet/', walletRoutes);
app.use("/api/user/review/", reviewRoutes);
app.use("/api/banners/", bannerRoutes);

// Utility routes
app.use("/api/otp/", otpRoutes);

// Root route
app.get("/", (req, res) => {
  res.send("Hello world");
});

// Connect to database and start server
connectDb().then(async () => {
  const PORT = process.env.PORT || 9090;
  
  try {
    await createInitialAdmin(); 
    console.log("Admin initialization completed");
    
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Server started on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server initialization error:", error);
  }
});