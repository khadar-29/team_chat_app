const User = require('../models/User');
const Message = require('../models/Message');

let onlineUsers = new Map(); // userId -> socketId

const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log('🔌 Socket connected:', socket.id);

    socket.on('userOnline', async (userId) => {
      const userIdStr = userId.toString();
      onlineUsers.set(userIdStr, socket.id);
      
      await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });
      
      socket.userId = userIdStr;
      socket.join(`user_${userIdStr}`);
      
      const onlineUserIds = Array.from(onlineUsers.keys());
      io.emit('onlineUsers', onlineUserIds);
      console.log(`✅ ${userIdStr} online. Total: ${onlineUserIds.length}`);
    });

    socket.on('joinChannel', (channelId) => {
      socket.join(`channel_${channelId}`);
      console.log(`👥 ${socket.userId} joined channel ${channelId}`);
    });

    socket.on('sendMessage', async (data) => {
      const { channelId, content } = data;
      
      try {
        const message = new Message({
          channel: channelId,
          sender: socket.userId,
          content: content.trim()
        });
        await message.save();

        const populatedMessage = await Message.findById(message._id)
          .populate('sender', 'username isOnline')
          .populate('channel', 'name');

        io.to(`channel_${channelId}`).emit('newMessage', populatedMessage);
        console.log(`💬 [${channelId}] ${content.substring(0, 30)}...`);
      } catch (error) {
        console.error('🚨 Message error:', error);
      }
    });

    socket.on('disconnect', async () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        await User.findByIdAndUpdate(socket.userId, { 
          isOnline: false, 
          lastSeen: new Date() 
        });
        
        const onlineUserIds = Array.from(onlineUsers.keys());
        io.emit('onlineUsers', onlineUserIds);
        console.log(`❌ ${socket.userId} offline. Total: ${onlineUserIds.length}`);
      }
    });
  });
};

module.exports = socketHandler;
