const Wallet = require('../../models/wallet/walletModel');

const getWalletDetails = async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ userId: req.user._id });
    
    if (!wallet) {
      wallet = await Wallet.create({
        userId: req.user._id,
        balance: 0,
        transactions: []
      });
    }

    res.status(200).json({
      success: true,
      balance: wallet.balance,
      transactions: wallet.transactions.sort((a, b) => b.date - a.date)
    });
  } catch (error) {
    console.error('Error in getWalletDetails:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching wallet details'
    });
  }
};

// Add transaction
const addTransaction = async (req, res) => {
  try {
    const { amount, type, description } = req.body;
    
    let wallet = await Wallet.findOne({ userId: req.user._id });
    
    // If wallet doesn't exist, create one
    if (!wallet) {
      wallet = await Wallet.create({
        userId: req.user._id,
        balance: 0,
        transactions: []
      });
    }

    // Update balance
    if (type === 'credit') {
      wallet.balance += amount;
    } else if (type === 'debit') {
      if (wallet.balance < amount) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient balance'
        });
      }
      wallet.balance -= amount;
    }

    // Add transaction
    wallet.transactions.push({
      userId: req.user._id,
      type,
      amount,
      description,
      date: new Date()
    });

    await wallet.save();

    res.status(200).json({
      success: true,
      message: 'Transaction successful',
      balance: wallet.balance,
      transaction: wallet.transactions[wallet.transactions.length - 1]
    });
  } catch (error) {
    console.error('Error in addTransaction:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing transaction'
    });
  }
};

module.exports = {
  getWalletDetails,
  addTransaction
};