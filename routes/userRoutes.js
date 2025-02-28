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
router.post("/reset-password", authMiddleware, resetUserPassword);
router.post("/forgot-password-send-otp", forgotPasswordSendOtp);
router.post("/reset-password", resetPassword);
router.post("/verify-forgot-password-otp", verifyForgotPasswordOtp);
router.post("/resend-forgot-password-otp", resendForgotPasswordOtp);
router.put(
  "/editProfile/:id",
  authMiddleware,
  upload.single("image"),
  updateUserProfile
);

router.get("/auth/google",
  passport.authenticate("google", { 
    scope: ["profile", "email"],
    prompt: "select_account"
  })
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", { 
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=Google authentication failed`,
    session: false 
  }),
  (req, res) => {
    try {
      const { token, user } = req.user;

      if (!user || user.isDeleted) {
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=Account blocked`);
      }

      res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
    } catch (error) {
      console.error('Google callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=Authentication failed`);
    }
  }
);

router.post("/logout", authMiddleware, (req, res) => {
  try {
    // Clear CSRF token cookie
    res.cookie('_csrf', '', {
      expires: new Date(0),
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/'
    });
    
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error during logout", error: error.message });
  }
});

router.get("/referral-code", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ referralCode: user.referralCode });
  } catch (error) {
    res.status(500).json({ message: "Error fetching referral code" });
  }
});

router.get('/validate-referral/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const user = await User.findOne({ referralCode: code });
    if (!user) {
      return res.status(404).json({ message: 'Invalid referral code' });
    }
    res.status(200).json({ message: 'Valid referral code' });
  } catch (error) {
    res.status(500).json({ message: 'Error validating referral code' });
  }
});

module.exports = router;
