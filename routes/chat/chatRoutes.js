const express = require('express');
const router = express.Router();
const { getUserChats, markMessagesAsRead, sendMessage } = require('../../controllers/chat/chatController');
const authMiddleware = require('../../middleware/authMiddleware');

router.get('/user-chats', authMiddleware, getUserChats);
router.put('/mark-read/:chatId', markMessagesAsRead);
router.post('/send-message', authMiddleware, sendMessage);

module.exports = router;