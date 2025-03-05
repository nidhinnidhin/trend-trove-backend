const Wallet = require('../../models/wallet/walletModel');

const getWalletDetails = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated or user ID missing'
      });
    }

    let wallet = await Wallet.findOne({ userId: req.user.id });

    if (!wallet) {
      wallet = await Wallet.create({
        userId: req.user.id,
        balance: 0,
        transactions: []
      });
    }

    // Ensure transactions exist before sorting
    const sortedTransactions = wallet.transactions?.length
      ? wallet.transactions.sort((a, b) => new Date(b.date) - new Date(a.date))
      : [];

    // Calculate the correct balance (sum of credited transactions)
    const totalBalance = sortedTransactions.reduce((sum, t) => {
      return sum + (t.amount > 0 ? t.amount : 0);
    }, 0);

    // Calculate referral earnings
    const referralEarnings = sortedTransactions
      .filter(t => t.description.toLowerCase().includes('referral'))
      .reduce((sum, t) => sum + t.amount, 0);

    // Update balance in DB (if not already updated)
    if (wallet.balance !== totalBalance) {
      wallet.balance = totalBalance;
      await wallet.save();
    }

    res.status(200).json({
      success: true,
      balance: totalBalance,
      transactions: sortedTransactions,
      referralEarnings
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
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated or user ID missing'
      });
    }
    const { amount, type, description } = req.body;
    
    let wallet = await Wallet.findOne({ userId: req.user.id });
    
    console.log("wallettttttt",wallet)
    if (!wallet) {
      wallet = await Wallet.create({
        userId: req.user.id,
        balance: 0,
        transactions: []
      });
    }

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

    wallet.transactions.push({
      userId: req.user.id,
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