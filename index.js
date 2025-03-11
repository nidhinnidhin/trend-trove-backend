const express = require("express");
const connectDb = require("./db/connection");
const app = express();
const cors = require("cors");
const { updateOfferStatus } = require('./admin/helper/offerHelpers')
const morgan = require('morgan');
const helmet = require('helmet');
const csrf = require('csurf');
const cron = require('node-cron');
const userRoutes = require("./routes/userRoutes");
// const adminRoutes = require("./routes/adminRoutes");
const adminRoutes = require("./admin/routes/authentication/AdminRoutes");
const userProductRoutes = require("./routes/product/productRoutes");
const adminProductRoutes = require("./admin/routes/product/ProductRoutes");
const userBrandRoutes = require("./routes/product/brandRoutes");
const adminBrandRoutes = require("./admin/routes/product/BrandRoutes");
const userColorVariantRoutes = require("./routes/product/variantRoutes");
const adminColorVariantRoutes = require("./admin/routes/product/ColorVariantRoutes");
const userCategoryRoutes = require("./routes/product/categoryRoutes");
const adminCategoryRoutes = require("./admin/routes/product/CategoryRoutes");
const userSizeVariantRoutes = require("./routes/product/sizesRoutes");
const adminSizeVariantRoutes = require("./admin/routes/product/SizeVariantRoutes");
const cartRoutes = require("./routes/cart/cartRoutes");
const addressRoutes = require("./routes/address/addressRoutes");
const userCheckoutRoutes = require("./routes/checkout/checkoutRoutes");
const adminCheckoutRoutes = require("./admin/routes/checkout/CheckoutRoutes");
const userWishlistRoutes = require("./routes/wishlist/wishlistRoutes")
const adminCouponRoutes = require("./admin/routes/coupon/couponRoutes")
const userCouponRoutes = require("./routes/coupon/couponRoutes")
const adminOfferRoutes = require('./admin/routes/offer/offerRoutes')
const payementRoutes = require("./routes/payment/paymentRoutes")
const walletRoutes = require("./routes/wallet/walletRoutes")
const otpRoutes = require("./routes/otp/signupOtpRoutes");
const reviewRoutes = require("./routes/review/reviewRoute");
const bodyParser = require("body-parser");
const passport = require("passport");
const cookieParser = require("cookie-parser");
const session = require('express-session');
require("./config/passport");
const Review = require("./models/review/reviewModel")
const bannerRoutes = require("./routes/banners/bannerRoutes");
const { createInitialAdmin } = require('./admin/controllers/authentication/adminController');
const userChatRoutes = require('./routes/chat/chatRoutes');
const adminChatRoutes = require('./admin/routes/chat/chatRoutes');
const http = require('http');
const { Server } = require('socket.io');
const Chat = require('./models/chat/chatModel');
const User = require('./models/userModel'); // Adjust path as needed
const Admin = require('./models/admin/adminModel');
const mongoose = require('mongoose');


const server = http.createServer(app);

const allowedOrigins = [
  'https://trend-trove-frontend-liwllg90g-nidhinbabu171gmailcoms-projects.vercel.app',
  'https://www.trendrove.shop',
  'https://trendrove.shop'
];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Handle user joining
  socket.on('join', async (userId) => {
    console.log(`User ${userId} joined the chat`);
    socket.join(userId);
  });

  // Handle admin joining
  socket.on('admin-join', () => {
    console.log('Admin joined the chat');
    socket.join('admin-room');
  });

  // Handle sending messages
  socket.on('send-message', async (data) => {
    try {
      const { userId, message, senderType } = data;
      
      // Get admin ID from the database using the token
      let senderId;
      if (senderType === 'Admin') {
        const admin = await Admin.findOne({ email: 'admin@gmail.com' });
        senderId = admin._id;
      } else {
        senderId = userId;
      }
      
      // Create message object with a unique _id
      const messageObj = {
        _id: new mongoose.Types.ObjectId(),
        sender: senderId,
        senderType,
        message,
        timestamp: new Date(),
        read: false
      };

      // Find or create chat
      let chat = await Chat.findOne({ user: userId });

      if (!chat) {
        chat = new Chat({
          user: userId,
          messages: [messageObj],
          lastMessage: new Date()
        });
      } else {
        // Check for duplicate message before adding
        const isDuplicate = chat.messages.some(msg => 
          msg.message === message && 
          msg.senderType === senderType &&
          Math.abs(new Date(msg.timestamp) - new Date()) < 1000 // Within 1 second
        );

        if (!isDuplicate) {
          chat.messages.push(messageObj);
          chat.lastMessage = new Date();
        }
      }

      await chat.save();

      // Emit to appropriate rooms
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

  // Handle message read status
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

require("dotenv").config();

// Move these configurations to the top of your file, before any routes
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure session before passport
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize passport after session
app.use(passport.initialize());
app.use(passport.session());

// 1. Configure CORS

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
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

// 2. Configure CSRF protection
const csrfProtection = csrf({
  cookie: {
    key: '_csrf',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/'
  }
});

// 3. Global error handler
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({
      status: 'error',
      message: 'Invalid CSRF token',
    });
  }
  
  // Handle other errors
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error'
  });
});

// 4. CSRF Token endpoint
app.get('/api/csrf-token', (req, res) => {
  // Generate CSRF token without protection
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

// 5. CSRF Protection Middleware
const csrfMiddleware = (req, res, next) => {
  // Exclude certain paths from CSRF protection
  const excludedPaths = [
    '/api/csrf-token',
    '/api/users/logout',
    '/api/admin/adminlogin',
    '/api/admin/logout'
  ];

  if (excludedPaths.includes(req.path) || req.method === 'GET') {
    return next();
  }

  // Apply CSRF protection
  csrfProtection(req, res, next);
};


app.use(csrfMiddleware);

app.use(morgan('dev')); 
app.use(helmet());

app.post('/api/protected-route', (req, res) => {
  res.send('CSRF token is valid!');
});

async function dropReviewIndex() {
  try {
    await Review.collection.dropIndex("user_1_product_1_variant_1_sizeVariant_1");
    console.log("Successfully dropped the unique review index");
  } catch (error) {
    console.log("Index drop not needed or failed:", error.message);
  }
}

dropReviewIndex();

// Add chat routes before the error handler
app.use("/api/admin/chat/", adminChatRoutes);
app.use("/api/chat/", userChatRoutes);

app.use("/api/users/", userRoutes);
app.use("/api/admin/", adminRoutes);
app.use("/api/products/", userProductRoutes);
app.use("/api/admin/products/", adminProductRoutes);
app.use("/api/brands/", userBrandRoutes); 
app.use("/api/admin/brands/", adminBrandRoutes);
app.use("/api/categories/", userCategoryRoutes);
app.use("/api/admin/categories/", adminCategoryRoutes);
app.use("/api/otp/", otpRoutes); 
app.use("/api/variants/", userColorVariantRoutes);
app.use("/api/admin/variants/", adminColorVariantRoutes);
app.use("/api/sizes/", userSizeVariantRoutes);
app.use("/api/admin/sizes/", adminSizeVariantRoutes);
app.use("/api/cart/", cartRoutes);
app.use("/api/address/", addressRoutes);
app.use("/api/checkout/", userCheckoutRoutes);
app.use("/api/admin/checkout/", adminCheckoutRoutes);
app.use("/api/user/wishlist/", userWishlistRoutes);
app.use("/api/admin/coupon/", adminCouponRoutes)
app.use("/api/coupon/", userCouponRoutes)
app.use("/api/admin/offer/", adminOfferRoutes)
app.use("/api/payment/", payementRoutes)
app.use('/api/wallet/', walletRoutes);
app.use("/api/user/review/", reviewRoutes);
app.use("/api/banners/", bannerRoutes);

connectDb().then(async () => {
  const PORT = process.env.PORT || 9090;
  
  try {
    await createInitialAdmin(); 
    console.log("Admin initialization completed");
    
    server.listen(PORT,'0.0.0.0', () => {
      console.log(`Server started on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server initialization error:", error);
  }
});
    
app.get("/", (req, res) => {
  res.send("Hello world");
});

// app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
