const Chat = require('../../models/chat/chatModel');
const asyncHandler = require('express-async-handler');
const User = require('../../models/userModel');
const mongoose = require('mongoose');

const getUserChats = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Fetching chats for user:', userId);

    let chat = await Chat.findOne({ user: userId })
      .lean() // Use lean() for better performance
      .exec();

    if (!chat) {
      return res.json({ messages: [] });
    }

    // Sort messages by timestamp and ensure uniqueness by _id
    const uniqueMessages = Array.from(
      new Map(chat.messages.map(msg => [msg._id.toString(), {
        ...msg,
        timestamp: new Date(msg.timestamp) // Ensure consistent date format
      }])).values()
    ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    chat.messages = uniqueMessages;
    res.json(chat);
  } catch (error) {
    console.error('Error fetching user chats:', error);
    res.status(500).json({ message: 'Error fetching chat history', error: error.message });
  }
});

const getAdminChats = asyncHandler(async (req, res) => {
  try {
    const chats = await Chat.find()
      .populate('user', 'username image email')
      .sort({ lastMessage: -1 });

    // Deduplicate messages for each chat
    const uniqueChats = chats.map(chat => {
      const uniqueMessages = Array.from(new Map(chat.messages.map(msg => [msg._id.toString(), msg])).values());
      chat.messages = [...uniqueMessages];
      return chat;
    });
    

    res.json(uniqueChats);
  } catch (error) {
    console.error('Error fetching admin chats:', error);
    res.status(500).json({ message: 'Error fetching chats', error: error.message });
  }
});


const sendMessage = asyncHandler(async (req, res) => {
  try {
    const { message, senderType } = req.body;
    const userId = req.user.id;
    
    if (!message || !senderType) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Create message object with unique _id
    const messageObj = {
      _id: new mongoose.Types.ObjectId(),
      sender: userId,
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

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: messageObj
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Error sending message', error: error.message });
  }
});

const markMessagesAsRead = asyncHandler(async (req, res) => {
  try {
    const { chatId } = req.params;
    const senderType = req.path.includes('admin') ? 'User' : 'Admin';
    
    // Mark messages as read where the sender is the opposite type
    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      { 
        '$set': { 
          'messages.$[elem].read': true 
        } 
      },
      {
        arrayFilters: [{ 'elem.read': false, 'elem.senderType': senderType }],
        new: true
      }
    );
    
    res.json({ message: 'Messages marked as read', chat: updatedChat });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Error marking messages as read', error: error.message });
  }
});

module.exports = {
  getUserChats,
  getAdminChats,
  sendMessage,
  markMessagesAsRead
};