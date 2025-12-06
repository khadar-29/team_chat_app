import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { socketEvents, getSocket } from '../../services/socket';

const MessageInput = ({ channelId }) => {
  const [message, setMessage] = useState('');
  const inputRef = useRef(null);
  const socket = getSocket();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim() || !channelId || !socket) return;

    socketEvents.sendMessage({ channelId, content: message });
    setMessage('');
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 border-t border-gray-200 bg-white">
      <div className="flex items-end space-x-3">
        <div className="flex-1">
          <textarea
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            rows="1"
            className="w-full px-4 py-3 border border-gray-300 rounded-2xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            style={{ minHeight: '44px', maxHeight: '120px' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
        </div>
        <button
          type="submit"
          disabled={!message.trim() || !channelId}
          className="p-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 disabled:opacity-50 transition-colors flex-shrink-0"
        >
          ➤
        </button>
      </div>
    </form>
  );
};

export default MessageInput;
