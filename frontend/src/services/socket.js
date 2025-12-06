import { io } from 'socket.io-client';

const SOCKET_SERVER = 'http://localhost:5000';
let socket = null;

export const initSocket = (token, userId) => {
  if (socket) {
    socket.disconnect();
  }
  
  socket = io(SOCKET_SERVER, {
    auth: { token }
  });

  socket.on('connect', () => {
    console.log('✅ Socket connected:', socket.id);
    if (userId) {
      socket.emit('userOnline', userId);
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ Socket disconnected');
  });

  return socket;
};

export const getSocket = () => socket;

export const socketEvents = {
  userOnline: (userId) => socket?.emit('userOnline', userId),
  joinChannel: (channelId) => socket?.emit('joinChannel', channelId),
  sendMessage: (data) => socket?.emit('sendMessage', data),
  typing: (data) => socket?.emit('typing', data)
};
