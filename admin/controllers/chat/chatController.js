const Chat = require('../../../models/chat/chatModel');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
// const User = require('../../models/userModel');

const getAdminChats = asyncHandler(async (req, res) => {
  try {
    // Fetch all chats with populated user information
    const chats = await Chat.find()
      .populate('user', 'username image email')
      .sort({ lastMessage: -1 });
    
    // Ensure unique messages in each chat
    const uniqueChats = chats.map(chat => ({
      ...chat.toObject(),
      messages: Array.from(
        new Map(chat.messages.map(msg => [msg._id.toString(), msg])).values()
      ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    }));
    
    res.json(uniqueChats);
  } catch (error) {
    console.error('Error fetching admin chats:', error);
    res.status(500).json({ message: 'Error fetching chats', error: error.message });
  }
});

const markMessagesAsRead = asyncHandler(async (req, res) => {
  try {
    const { chatId } = req.params;
    
    if (!chatId) {
      return res.status(400).json({ message: 'Chat ID is required' });
    }

    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      { 
        '$set': { 
          'messages.$[elem].read': true,
          'messages.$[elem].delivered': true
        } 
      },
      {
        arrayFilters: [{ 'elem.senderType': 'User', 'elem.read': false }],
        new: true,
        runValidators: true
      }
    ).populate('user', 'username image email');

    if (!updatedChat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    // Emit socket event for read receipts
    if (req.app.get('io')) {
      req.app.get('io').to(chatId).emit('messages-read', {
        chatId,
        messages: updatedChat.messages
      });
    }
    
    res.json({ 
      success: true, 
      chat: updatedChat,
      message: 'Messages marked as read successfully'
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error marking messages as read',
      error: error.message 
    });
  }
});

const sendMessage = asyncHandler(async (req, res) => {
  try {
    const { userId, message, senderType } = req.body;
    
    if (!message || !userId || !senderType) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const adminId = req.admin.id;
    
    if (!adminId) {
      return res.status(401).json({ message: 'Unauthorized: Admin not found' });
    }

    // Create message object with unique _id
    const messageObj = {
      _id: new mongoose.Types.ObjectId(),
      sender: adminId,
      senderType,
      message,
      timestamp: new Date(),
      read: false
    };

    // Find or create chat
    let chat = await Chat.findOne({ user: userId });

    if (!chat) {
      chat = new Chat({
        user: userId,
        messages: [messageObj],
        lastMessage: new Date()
      });
    } else {
      // Check for duplicate message
      const isDuplicate = chat.messages.some(msg => 
        msg.message === message && 
        msg.senderType === senderType &&
        Math.abs(new Date(msg.timestamp) - new Date()) < 1000
      );

      if (!isDuplicate) {
        chat.messages.push(messageObj);
        chat.lastMessage = new Date();
      }
    }

    await chat.save();

    // Return the populated chat data
    const populatedChat = await Chat.findById(chat._id)
      .populate('user', 'username image email')
      .lean();

    // Get the saved message
    const savedMessage = populatedChat.messages[populatedChat.messages.length - 1];

    // Return both the chat and message data
    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: savedMessage,
      chat: populatedChat
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Error sending message', error: error.message });
  }
});

module.exports = {
  getAdminChats,
  markMessagesAsRead,
  sendMessage
};
