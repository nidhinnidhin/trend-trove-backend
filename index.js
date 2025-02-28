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
require("./config/passport");
const Review = require("./models/review/reviewModel")
const bannerRoutes = require("./routes/banners/bannerRoutes");

require("dotenv").config();

// Move these configurations to the top of your file, before any routes
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 1. Configure CORS
app.use(cors({
  origin: "http://localhost:3000",
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

// 6. Apply CSRF middleware globally
app.use(csrfMiddleware);

app.use(passport.initialize());
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

connectDb();
    
app.get("/", (req, res) => {
  res.send("Hello world");
});

const PORT = process.env.PORT || 9090;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
