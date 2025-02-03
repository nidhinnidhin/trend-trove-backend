const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const Jwt = require("jsonwebtoken");
const cloudinary = require("../config/cloudinary");


const validateEmail = (email) => {
  const emailRegex = /^[A-Za-z0-9._%+-]{3,}@gmail\.com$/;
  return emailRegex.test(email);
};

// Signup view
const registerUser = asyncHandler(async (req, res) => {
  console.log("Body: ", req.body);
  console.log("File: ", req.file);

  const { firstname, lastname, username, email, password, confirmpassword } =
    req.body;

  if (!req.file) {
    return res.status(400).json({ message: "Profile image is required" });
  }
  const allowedFileTypes = ["image/jpeg", "image/png"];
  if (!allowedFileTypes.includes(req.file.mimetype)) {
    return res
      .status(400)
      .json({
        message: "Invalid file type. Only JPEG or PNG images are allowed.",
      });
  }

  const textRegex = /^[A-Za-z]+$/;

  if (!textRegex.test(username)) {
    return res
      .status(400)
      .json({
        message:
          "Username should only contain letters and no spaces or special characters.",
      });
  }

  if (!textRegex.test(firstname)) {
    return res
      .status(400)
      .json({
        message:
          "Firstname should only contain letters and no spaces or special characters.",
      });
  }

  if (!textRegex.test(lastname)) {
    return res
      .status(400)
      .json({
        message:
          "Lastname should only contain letters and no spaces or special characters.",
      });
  }

  if (username.length <= 3) {
    return res
      .status(400)
      .json({ message: "Username must be more than 3 characters long." });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({ message: "Email must have at least 3 characters before @gmail.com" });
  }

  const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
  if (password.length < 8 || !specialCharRegex.test(password)) {
    return res.status(400).json({
      message:
        "Password must be at least 8 characters long and contain at least one special character.",
    });
  }

  try {
    const existUser = await User.findOne({
      $or: [{ email }, { username }],
    });
    if (existUser) {
      return res.status(400).json({
        message:
          existUser.email === email
            ? "Email already exists"
            : "Username already exists",
      });
    }

    if (password !== confirmpassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const cloudinaryResponse = await cloudinary.uploader.upload(req.file.path, {
      folder: "uploads",
      use_filename: true,
      unique_filename: false,
    });
    const image = cloudinaryResponse.secure_url;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      firstname,
      lastname,
      username,
      email,
      password: hashedPassword,
      image,
    });

    await user.save();

    const token = Jwt.sign(
      { id: user._id, username, email },
      process.env.JWT_SECRET || "1921u0030",
      { expiresIn: "1h" }
    );

    res.status(201).json({ message: "User registered successfully", token });
  } catch (err) {
    res.status(500).json({ message: "An error occurred", error: err.message });
  }
});

// Login user view
const loginUser = asyncHandler(async (req, res) => {
  const JWT_SECRET = process.env.JWT_SECRET || "1921u0030";
  try {
    const { email, password } = req.body;

    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Email must have at least 3 characters before @gmail.com" });
    }

    const existUser = await User.findOne({ email });
    if (!existUser) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    if (existUser.isDeleted) {
      return res.status(400).json({ message: "You are temporarily blocked. Please contact admin." });
    }

    const isPasswordValid = await bcrypt.compare(password, existUser.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = Jwt.sign(
      { id: existUser._id, email: existUser.email },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({ message: "Login successful", token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const getUserProfile = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id; 

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User profile fetched successfully",
      user,
    });
  } catch (err) {
    res.status(500).json({ message: "An error occurred", error: err.message });
  }
});

const updateUserProfile = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { firstname, lastname, username, email } = req.body;

    let user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check for existing email or username conflicts
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
      _id: { $ne: id }, // Exclude the current user from search
    });

    if (existingUser) {
      return res.status(400).json({
        message: existingUser.email === email
          ? "Email already exists"
          : "Username already exists",
      });
    }

    // Upload new profile image if provided
    let imageUrl = user.image;
    if (req.file) {
      const cloudinaryResponse = await cloudinary.uploader.upload(req.file.path, {
        folder: "uploads",
        use_filename: true,
        unique_filename: false,
      });
      imageUrl = cloudinaryResponse.secure_url;
    }

    // Update user details
    user.firstname = firstname || user.firstname;
    user.lastname = lastname || user.lastname;
    user.username = username || user.username;
    user.email = email || user.email;
    user.image = imageUrl;

    await user.save();

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        firstname: user.firstname,
        lastname: user.lastname,
        username: user.username,
        email: user.email,
        image: user.image,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "An error occurred", error: err.message });
  }
});


module.exports = { registerUser, loginUser, getUserProfile, updateUserProfile };
