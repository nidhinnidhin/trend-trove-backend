const Wallet = require('../../models/wallet/walletModel');

const getWalletDetails = async (req, res) => {
  try {
    // Check if req.user exists and has id property
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated or user ID missing'
      });
    }

    let wallet = await Wallet.findOne({ userId: req.user.id });
    
    if (!wallet) {
      // Make sure we're passing a valid userId when creating a new wallet
      wallet = await Wallet.create({
        userId: req.user.id,
        balance: 0,
        transactions: []
      });
    }

    // Sort transactions by date in descending order
    const sortedTransactions = wallet.transactions.sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    );

    res.status(200).json({
      success: true,
      balance: wallet.balance,
      transactions: sortedTransactions,
      referralEarnings: sortedTransactions
        .filter(t => t.description.toLowerCase().includes('referral'))
        .reduce((sum, t) => sum + t.amount, 0)
    });
  } catch (error) {
    console.error('Error in getWalletDetails:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching wallet details',
      error: error.message
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