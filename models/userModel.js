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
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
});

// Generate referral code before saving
userSchema.pre('save', async function(next) {
  if (!this.referralCode) {
    const generateCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      return Array.from({length: 10}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    };
    
    let code = generateCode();
    let isUnique = false;
    
    while (!isUnique) {
      const existingUser = await this.constructor.findOne({ referralCode: code });
      if (!existingUser) {
        isUnique = true;
      } else {
        code = generateCode();
      }
    }
    
    this.referralCode = code;
  }
  next();
});

const User = mongoose.model("User", userSchema);
module.exports = User;
