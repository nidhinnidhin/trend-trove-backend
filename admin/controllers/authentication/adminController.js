const asyncHandler = require("express-async-handler");
const Jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Admin = require("../../../models/admin/adminModel");
const User = require("../../../models/userModel");

// Create initial admin account if none exists
const createInitialAdmin = async () => {
  try {
    const adminExists = await Admin.findOne({ email: "admin@gmail.com" });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash("admin@123", 10);
      await Admin.create({
        email: "admin@gmail.com",
        password: hashedPassword,
        role: "admin",
        isActive: true
      });
      console.log("Initial admin account created successfully");
    }
  } catch (error) {
    console.error("Error creating initial admin:", error);
  }
};

const adminLogin = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Find admin by email
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(403).json({ message: "Account is deactivated" });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = Jwt.sign(
      { 
        id: admin._id,
        email: admin.email, 
        role: admin.role 
      }, 
      process.env.JWT_SECRET || "1921u0030",
      { expiresIn: "30d" }
    );

    // Update last login
    await Admin.findByIdAndUpdate(admin._id, {
      lastLogin: new Date()
    });

    // Set cookie
    res.cookie("adminToken", token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    res.status(200).json({ 
      message: "Login successful",
      admin: {
        email: admin.email,
        role: admin.role
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

const logoutAdmin = asyncHandler(async (req, res) => {
  try {
    res.clearCookie('adminToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    res.clearCookie('_csrf', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Error during logout' });
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

module.exports = { 
  adminLogin, 
  userList, 
  blockUser, 
  unblockUser, 
  logoutAdmin,
  createInitialAdmin  // Make sure this is exported
};
