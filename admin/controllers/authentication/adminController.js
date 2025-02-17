const asyncHandler = require("express-async-handler");
const Jwt = require("jsonwebtoken");
const User = require("../../../models/userModel");


const adminLogin = asyncHandler(async (req, res) => {
  const EMAIL = "admin@gmail.com";
  const PASSWORD = "admin@123";
  const JWT_SECRET = process.env.JWT_SECRET || "1921u0030";

  try {
    const { email, password } = req.body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
    if (password.length < 8 || !specialCharRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long and contain at least one special character.",
      });
    }

    if (email !== EMAIL || password !== PASSWORD) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = Jwt.sign({ email, role: "admin" }, JWT_SECRET, {
      expiresIn: "1h",
    });

    res.cookie("adminToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
    });

    res.status(200).json({ message: "Login successful" });
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.log("Something went wrong..");
  }
});

const blockUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { isDeleted: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User blocked successfully", user });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Something went wrong while blocking user." });
  }
});


const unblockUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { isDeleted: false },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User unblocked successfully", user });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Something went wrong while unblocking user." });
  }
});

const userList = asyncHandler(async (req, res) => {
  try {
    let users = await User.find({}).select("-password").sort({createdAt:-1}); 
    if (users.length === 0) {
      return res.status(404).json({ message: "No users found." });
    }
    res.status(200).json(users);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Something went wrong while fetching users." });
  }
});

module.exports = { adminLogin, userList, blockUser, unblockUser };
