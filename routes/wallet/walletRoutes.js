const express = require('express');
const router = express.Router();
const { getWalletDetails, addTransaction } = require('../../controllers/wallet/walletController');
const authMiddleware = require('../../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/details', getWalletDetails);
router.post('/transaction', addTransaction);

module.exports = router;