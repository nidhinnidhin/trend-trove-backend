const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    default: 'admin' 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  lastLogin: { 
    type: Date 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
});

const Admin = mongoose.model("Admin", adminSchema);
module.exports = Admin; 