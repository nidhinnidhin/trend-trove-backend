const asyncHandler = require("express-async-handler");
const Address = require("../../models/address/addressModal");

const addAddress = asyncHandler(async (req, res) => {
  console.log(req.user.id);

  try {
    console.log("User:", req.user); // Debugging step

    if (!req.user || !req.user.id) {
      return res.status(400).json({ message: "User authentication failed" });
    }

    const {
      fullName,
      mobileNumber,
      pincode,
      locality,
      address,
      city,
      state,
      landmark,
      alternatePhone,
      addressType,
      coordinates
    } = req.body;

    const newAddress = new Address({
      user: req.user.id,
      fullName,
      mobileNumber,
      pincode,
      locality,
      address,
      city,
      state,
      landmark,
      alternatePhone,
      addressType,
      coordinates
    });

    const savedAddress = await newAddress.save();
    res
      .status(201)
      .json({ message: "Address added successfully", address: savedAddress });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error adding address", error: error.message });
  }
});

const getAddresses = asyncHandler(async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(400).json({ message: "User authentication failed" });
    }

    const addresses = await Address.find({ 
      user: req.user.id,
      isActive: true 
    });

    if (!addresses || addresses.length === 0) {
      return res.status(404).json({ message: "No addresses found" });
    }

    res.status(200).json({ 
      message: "Addresses retrieved successfully", 
      addresses 
    });
  } catch (error) {
    res.status(400).json({ 
      message: "Error retrieving addresses", 
      error: error.message 
    });
  }
});

const editAddress = asyncHandler(async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(400).json({ message: "User authentication failed" });
    }

    const { id } = req.params; // Address ID from request params
    const {
      fullName,
      mobileNumber,
      pincode,
      locality,
      address,
      city,
      state,
      landmark,
      alternatePhone,
      addressType,
    } = req.body;

    // Find the address by ID and user
    const existingAddress = await Address.findOne({ _id: id, user: req.user.id });
    if (!existingAddress) {
      return res.status(404).json({ message: "Address not found" });
    }

    // Update the address fields
    existingAddress.fullName = fullName || existingAddress.fullName;
    existingAddress.mobileNumber = mobileNumber || existingAddress.mobileNumber;
    existingAddress.pincode = pincode || existingAddress.pincode;
    existingAddress.locality = locality || existingAddress.locality;
    existingAddress.address = address || existingAddress.address;
    existingAddress.city = city || existingAddress.city;
    existingAddress.state = state || existingAddress.state;
    existingAddress.landmark = landmark || existingAddress.landmark;
    existingAddress.alternatePhone = alternatePhone || existingAddress.alternatePhone;
    existingAddress.addressType = addressType || existingAddress.addressType;

    const updatedAddress = await existingAddress.save();

    res.status(200).json({ message: "Address updated successfully", address: updatedAddress });
  } catch (error) {
    res.status(400).json({ message: "Error updating address", error: error.message });
  }
});

const deleteAddress = asyncHandler(async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(400).json({ message: "User authentication failed" });
    }

    const { id } = req.params;

    // Find the address and mark it as inactive
    const address = await Address.findOneAndUpdate(
      { _id: id, user: req.user.id },
      { isActive: false },
      { new: true }
    );

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    res.status(200).json({ 
      success: true,
      message: "Address deleted successfully" 
    });
  } catch (error) {
    res.status(400).json({ 
      success: false,
      message: "Error deleting address", 
      error: error.message 
    });
  }
});

const getCheckoutAddresses = asyncHandler(async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(400).json({ message: "User authentication failed" });
    }

    const addresses = await Address.find({
      user: req.user.id,
      $or: [
        { isActive: true },
        { isUsedInOrder: true }
      ]
    });

    if (!addresses || addresses.length === 0) {
      return res.status(404).json({ message: "No addresses found" });
    }

    res.status(200).json({
      message: "Addresses retrieved successfully",
      addresses
    });
  } catch (error) {
    res.status(400).json({
      message: "Error retrieving addresses",
      error: error.message
    });
  }
});

module.exports = { 
  addAddress, 
  getAddresses, 
  editAddress, 
  deleteAddress,
  getCheckoutAddresses 
};
