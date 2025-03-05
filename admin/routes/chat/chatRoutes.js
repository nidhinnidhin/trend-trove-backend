const express = require('express');
const router = express.Router();
const { getAdminChats, markMessagesAsRead, sendMessage } = require('../../controllers/chat/chatController');
const adminAuthMiddleware = require('../../middleware/adminAuthMiddleware');

router.get('/admin-chats', adminAuthMiddleware, getAdminChats);
router.put('/mark-read/:chatId', adminAuthMiddleware, markMessagesAsRead);
router.post('/send-message', adminAuthMiddleware, sendMessage);

module.exports = router;