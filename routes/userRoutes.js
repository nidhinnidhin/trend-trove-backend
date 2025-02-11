const express = require("express");
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  forgotPasswordSendOtp,
  resetPassword,
  verifyForgotPasswordOtp,
  resendForgotPasswordOtp,
  resetUserPassword,
} = require("../controllers/userController");
const { upload } = require("../middleware/multer");
const passport = require("passport");
const User = require("../models/userModel");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", upload.single("image"), registerUser);
router.post("/login", loginUser);
router.get("/profile", authMiddleware, getUserProfile);
router.post('/reset-password', authMiddleware, resetUserPassword);
router.post('/forgot-password-send-otp', forgotPasswordSendOtp);
router.post('/reset-password', resetPassword);
router.post("/verify-forgot-password-otp", verifyForgotPasswordOtp);
router.post("/resend-forgot-password-otp", resendForgotPasswordOtp);
router.put(
  "/editProfile/:id",
  authMiddleware,
  upload.single("image"),
  updateUserProfile
);

router.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
  "/auth/google/callback",
  passport.authenticate("google", { session: false }),
  async (req, res) => {
    const { token, user } = req.user;

    const existingUser = await User.findById(user.id);
    if (!existingUser || existingUser.isDeleted) {
      return res
        .status(400)
        .json({
          message: "You are temporarily blocked. Please contact admin.",
        });
    }

    res.redirect(`http://localhost:3000?token=${token}`);
  }
);

module.exports = router;
