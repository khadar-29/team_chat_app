// src/components/Chat/ChatWindow.js
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { messagesAPI, channelsAPI } from '../../services/api';
import { getSocket, socketEvents } from '../../services/socket';
import MessageInput from './MessageInput';

const ChatWindow = ({ selectedChannel, onChannelSelect }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [currentChannel, setCurrentChannel] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]); // array of userId strings
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [channelJoined, setChannelJoined] = useState(false);
  const [leaveLoading, setLeaveLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const socket = getSocket();

  // Load messages for given channel
  const loadMessagesForChannel = useCallback(
    async (channelId, pageNum = 1, shouldClear = true) => {
      setLoading(true);
      try {
        const { data } = await messagesAPI.getByChannel(channelId, pageNum);
        if (shouldClear || pageNum === 1) {
          setMessages(data);
          setPage(1);
        } else {
          setMessages(prev => [...data, ...prev]);
        }
        setHasMore(data.length === 20);
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Load full channel (with members, isJoined) from server
  const loadChannelFromServer = useCallback(async (channelId) => {
    try {
      const { data } = await channelsAPI.getAll();
      const fullChannel = data.allChannels.find(c => c._id === channelId);
      const isJoined = fullChannel?.isJoined || false;
      return { fullChannel, isJoined };
    } catch (error) {
      console.error('Error loading channel from server:', error);
      return { fullChannel: null, isJoined: false };
    }
  }, []);

  // When user selects a channel in the sidebar
  useEffect(() => {
    const openChannel = async () => {
      if (!selectedChannel) return;
      if (currentChannel && selectedChannel._id === currentChannel._id) return;

      const { fullChannel, isJoined } = await loadChannelFromServer(selectedChannel._id);
      const channelToUse = fullChannel || selectedChannel;

      setCurrentChannel(channelToUse);
      setChannelJoined(isJoined);
      setMessages([]);
      setPage(1);
      setHasMore(true);

      if (socket && isJoined) {
        socketEvents.joinChannel(channelToUse._id);
        await loadMessagesForChannel(channelToUse._id, 1, true);
      }
    };

    openChannel();
  }, [selectedChannel, currentChannel, socket, loadMessagesForChannel, loadChannelFromServer]);

  // Join channel
  const handleJoinChannel = async () => {
    if (!currentChannel) return;
    try {
      await channelsAPI.join(currentChannel._id);
      const { fullChannel, isJoined } = await loadChannelFromServer(currentChannel._id);
      if (fullChannel) setCurrentChannel(fullChannel);
      setChannelJoined(isJoined);
      if (isJoined && socket) {
        socketEvents.joinChannel(currentChannel._id);
        await loadMessagesForChannel(currentChannel._id, 1, true);
      }
    } catch (error) {
      console.error('Error joining channel:', error);
    }
  };

  // Leave channel
  const handleLeaveChannel = async () => {
    if (!currentChannel || !channelJoined) return;
    if (!window.confirm(`Leave #${currentChannel.name}?`)) return;

    setLeaveLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/channels/${currentChannel._id}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();
      if (!res.ok) {
        console.error('Leave failed:', data);
        alert(data.message || 'Failed to leave channel');
        return;
      }

      setChannelJoined(false);
      setMessages([]);
      setCurrentChannel(null);
      if (onChannelSelect) onChannelSelect(null, null);
    } catch (error) {
      console.error('Error leaving channel:', error);
      alert('Failed to leave channel');
    } finally {
      setLeaveLoading(false);
    }
  };

  // Socket listeners (messages + online users)
  useEffect(() => {
    if (!socket || !user || !currentChannel || !channelJoined) return;

    const handleNewMessage = (message) => {
      if (message.channel && message.channel._id === currentChannel._id) {
        setMessages(prev => [message, ...prev]);
      }
    };

    const handleOnlineUsers = (users) => {
      setOnlineUsers(users || []);
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('onlineUsers', handleOnlineUsers);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('onlineUsers', handleOnlineUsers);
    };
  }, [socket, user, currentChannel, channelJoined]);

  // Auto scroll on new messages
  useEffect(() => {
    if (channelJoined && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, channelJoined]);

  // Load more on scroll up
  const loadMoreMessages = useCallback(() => {
    if (!currentChannel || !hasMore || loading || !channelJoined) return;
    const nextPage = page + 1;
    setPage(nextPage);
    loadMessagesForChannel(currentChannel._id, nextPage, false);
  }, [currentChannel, hasMore, loading, channelJoined, page, loadMessagesForChannel]);

  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current || loading || !hasMore || !channelJoined) return;
    const { scrollTop } = messagesContainerRef.current;
    if (scrollTop <= 100) {
      loadMoreMessages();
    }
  }, [loading, hasMore, channelJoined, loadMoreMessages]);

  // Compute online members for this channel
  const onlineMembers = useMemo(() => {
    if (!currentChannel?.members || !onlineUsers?.length) return [];
    return currentChannel.members.filter(m =>
      onlineUsers.includes(m._id.toString())
    );
  }, [currentChannel, onlineUsers]);

  if (!currentChannel) {
    return (
      <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex-1 flex items-center justify-center p-12 bg-gray-50">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-2xl mx-auto mb-6 flex items-center justify-center text-2xl">
              💬
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Select a channel</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Choose a channel from the sidebar to start chatting.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const memberCount = currentChannel.membersCount || currentChannel.members?.length || 0;

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 via-blue-50 to-purple-50">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-1">
              <h2 className="text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                # {currentChannel.name}
              </h2>
              {currentChannel.isPrivate && (
                <span className="px-3 py-1 bg-purple-500 text-white text-xs font-bold rounded-full">
                  🔒 Private
                </span>
              )}
              <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                channelJoined ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {channelJoined ? '✓ Member' : '⚠ Not joined'}
              </span>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
              <span className="flex items-center">
                <span className="w-3 h-3 bg-green-400 rounded-full mr-1" />
                {onlineMembers.length} online
              </span>
              <span>•</span>
              <span>{messages.length} messages</span>
              <span>•</span>
              <span className="font-semibold text-indigo-600">{memberCount} members</span>
            </div>
            {onlineMembers.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-700">
                <span className="font-semibold">Online:</span>
                {onlineMembers.map((m) => (
                  <span
                    key={m._id}
                    className="inline-flex items-center px-2 py-1 bg-green-50 text-green-800 rounded-full border border-green-200"
                  >
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-1" />
                    {m.username}
                  </span>
                ))}
              </div>
            )}
          </div>

          {channelJoined && (
            <button
              onClick={handleLeaveChannel}
              disabled={leaveLoading}
              className="ml-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold text-sm rounded-xl shadow-md focus:ring-4 focus:ring-red-200 transition-all disabled:opacity-50"
            >
              {leaveLoading ? 'Leaving…' : 'Leave channel'}
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50"
        onScroll={handleScroll}
      >
        {loading && page === 1 && (
          <div className="text-center py-8 text-gray-500">Loading messages…</div>
        )}

        {messages.length === 0 && !loading && channelJoined && (
          <div className="text-center py-12 text-gray-500">
            No messages yet. Be the first to send one!
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message._id}
            className={`flex ${message.sender?._id === user.id ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                message.sender?._id === user.id
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-semibold flex items-center">
                  {message.sender?.username || 'Unknown'}
                  {onlineUsers.includes((message.sender?._id || '').toString()) && (
                    <span className="ml-2 w-2 h-2 bg-green-400 border-2 border-white rounded-full" />
                  )}
                </span>
                <span className="text-xs opacity-75 ml-3">
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <p className="text-sm leading-relaxed break-words">{message.content}</p>
            </div>
          </div>
        ))}

        {loading && page > 1 && (
          <div className="text-center py-4 text-sm text-gray-500">Loading older messages…</div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input or join prompt */}
      {!channelJoined ? (
        <div className="p-8 bg-yellow-50 border-t border-yellow-200 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Join this channel to chat</h3>
          <p className="text-sm text-gray-600 mb-4">
            You must join this channel before you can send messages.
          </p>
          <button
            onClick={handleJoinChannel}
            className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
          >
            Join channel
          </button>
        </div>
      ) : (
        <MessageInput channelId={currentChannel._id} />
      )}
    </div>
  );
};

export default ChatWindow;
