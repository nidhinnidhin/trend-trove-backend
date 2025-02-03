require("dotenv").config();
const asyncHandler = require("express-async-handler");
const nodemailer = require("nodemailer");
const Otp = require("../../models/otp/signUpSendOtpModel");

// Transporter configuration - only created once
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, 
  },
});

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); 
};

const sendEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your OTP Code",
    text: `Your OTP is ${otp}. It will expire in 1 minute.`,
  };

  await transporter.sendMail(mailOptions);
};

const sendOtp = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 1 * 60 * 1000); 

  try {
    await Otp.findOneAndUpdate(
      { email },
      { otp, expiresAt },
      { upsert: true, new: true }
    );

    await sendEmail(email, otp);

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    next(error);
  }
});

// Controller to verify OTP
const verifyOtp = asyncHandler(async (req, res, next) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required" });
  }

  try {
    const otpDoc = await Otp.findOne({ email });

    if (!otpDoc) {
      return res.status(404).json({ message: "No OTP found for this email" });
    }

    if (otpDoc.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (otpDoc.expiresAt < new Date()) {
      await Otp.deleteOne({ email });
      return res
        .status(400)
        .json({ message: "OTP has expired. Please request a new one." });
    }

    await Otp.deleteOne({ email });

    res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    next(error);
  }
});

const resendOtp = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const otpDoc = await Otp.findOne({ email });

    let otp, expiresAt;

    if (!otpDoc || otpDoc.expiresAt < new Date()) {
      otp = generateOtp();
      expiresAt = new Date(Date.now() + 1 * 60 * 1000);

      await Otp.findOneAndUpdate(
        { email },
        { otp, expiresAt },
        { upsert: true, new: true }
      );
    } else {
      otp = otpDoc.otp;
      expiresAt = otpDoc.expiresAt;
    }

    await sendEmail(email, otp);

    res
      .status(200)
      .json({
        message: `OTP resent successfully. It will expire in 1 minute.`,
      });
  } catch (error) {
    next(error);
  }
});

module.exports = {
  sendOtp,
  verifyOtp,
  resendOtp,
};
