const express = require("express");
const connectDb = require("./db/connection");
const app = express();
const cors = require("cors");
const { updateOfferStatus } = require('./admin/helper/offerHelpers')
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


app.use(passport.initialize());
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

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
