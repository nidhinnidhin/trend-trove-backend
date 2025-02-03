const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  googleId: { type: String },
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false, default: null },
  image: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  isDeleted: { type: Boolean, default: false },
});

const User = mongoose.model("User", userSchema);
module.exports = User;
