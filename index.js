const express = require('express');
const connectDb = require('./db/connection');
const app = express();
const cors = require("cors");
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes')
const productRoutes = require('./routes/product/productRoutes')
const brandRoutes = require('./routes/product/brandRoutes')
const variantRoutes = require('./routes/product/variantRoutes')
const categoryRoutes = require('./routes/product/categoryRoutes')
const sizesRoutes = require('./routes/product/sizesRoutes')
const cartRoutes = require('./routes/cart/cartRoutes')
const addressRoutes = require('./routes/address/addressRoutes')
const otpRoutes = require('./routes/otp/signupOtpRoutes')
const bodyParser = require("body-parser");
const passport = require("passport");
// const { addReview } = require('./controllers/product/reviewController');
require('./config/passport')

require('dotenv').config()

// Middlewares

app.use(passport.initialize());
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const corsOptions = {
    origin: "http://localhost:3000", // React frontend URL  
  }; 
  app.use(cors(corsOptions));

// Routes
app.use("/api/users/", userRoutes);
app.use("/api/admin/", adminRoutes);
app.use("/api/products/", productRoutes); // Add product routes
app.use("/api/brands/", brandRoutes); // Add brand routes
app.use("/api/categories/", categoryRoutes); // Add brand category
app.use('/api/otp/', otpRoutes); //otp
app.use('/api/variants/', variantRoutes);
app.use('/api/sizes/', sizesRoutes);
app.use('/api/cart/', cartRoutes);
app.use('/api/address/', addressRoutes);
// app.use('/api/review/', addReview); //otp


// Mongodb Connection
connectDb()

app.get("/", (req, res) => {
    res.send("Hello world")
})

const PORT = process.env.PORT || 9090
app.listen(PORT, () => console.log(`Server started on port ${PORT}`))