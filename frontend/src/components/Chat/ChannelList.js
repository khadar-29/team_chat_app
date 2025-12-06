import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { channelsAPI } from '../../services/api';

const ChannelList = ({ onChannelSelect }) => {
  const [channelsData, setChannelsData] = useState({ allChannels: [], userChannels: [] });
  const [searchTerm, setSearchTerm] = useState('');
  const [newChannelName, setNewChannelName] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    try {
      console.log('🔍 Fetching channels...'); // DEBUG
      const { data } = await channelsAPI.getAll();
      console.log('📊 Channels data:', data); // DEBUG
      
      setChannelsData({
        allChannels: data.allChannels || [],
        userChannels: data.userChannels || []
      });
    } catch (error) {
      console.error('🚨 Fetch channels error:', error);
    }
  };

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;
    
    setLoading(true);
    try {
      await channelsAPI.create({ name: newChannelName });
      setNewChannelName('');
      fetchChannels();
    } catch (error) {
      console.error('Error creating channel:', error.response?.data?.message || error.message);
      alert(error.response?.data?.message || 'Failed to create channel');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinChannel = async (channelId, channelName) => {
    try {
      await channelsAPI.join(channelId);
      fetchChannels();
      if (onChannelSelect) {
        onChannelSelect(channelId, channelName);
      }
    } catch (error) {
      console.error('Error joining channel:', error);
    }
  };

  const allChannelsCount = channelsData.allChannels?.length || 0;
  const userChannelsCount = channelsData.userChannels?.length || 0;

  const displayedChannels = useMemo(() => {
    let channels = activeTab === 'joined' ? (channelsData.userChannels || []) : (channelsData.allChannels || []);

    if (searchTerm.trim()) {
      return channels.filter(channel =>
        channel.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
      );
    }
    
    return channels;
  }, [channelsData, activeTab, searchTerm]);

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex mb-3">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-l-lg transition-all ${
              activeTab === 'all'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            All Channels ({allChannelsCount})
          </button>
          <button
            onClick={() => setActiveTab('joined')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-r-lg transition-all ${
              activeTab === 'joined'
                ? 'bg-green-500 text-white shadow-sm'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            My Channels ({userChannelsCount})
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="🔍 Search all channels..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
          <span className="absolute left-3 top-3 text-gray-400">🔍</span>
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {/* Create Channel */}
        <form onSubmit={handleCreateChannel} className="flex gap-2 p-1 bg-gray-50 rounded-xl">
          <input
            type="text"
            value={newChannelName}
            onChange={(e) => setNewChannelName(e.target.value)}
            placeholder="# Create new channel"
            className="flex-1 px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            maxLength={50}
          />
          <button
            type="submit"
            disabled={loading || !newChannelName.trim()}
            className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md transition-all flex items-center justify-center min-w-[44px]"
          >
            {loading ? '⏳' : '➕'}
          </button>
        </form>
      </div>

      {/* Channels List */}
      <div className="flex-1 overflow-y-auto p-3">
        {displayedChannels.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl mx-auto mb-6 flex items-center justify-center text-2xl">
              📋
            </div>
            {searchTerm ? (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No results</h3>
                <p className="text-sm">No channels match "{searchTerm}"</p>
              </>
            ) : activeTab === 'joined' ? (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No joined channels</h3>
                <p className="text-sm">Join channels to see them here</p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No channels yet</h3>
                <p className="text-sm">Be the first to create one!</p>
              </>
            )}
          </div>
        ) : (
          displayedChannels.map((channel) => (
            <div
              key={channel._id}
              className={`p-4 rounded-2xl mx-2 mb-3 cursor-pointer transition-all shadow-sm hover:shadow-md border-2 ${
                channel.isJoined 
                  ? 'border-green-300 bg-green-50 hover:bg-green-100' 
                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
              }`}
              onClick={() => {
                if (channel.isJoined) {
                  onChannelSelect?.(channel._id, channel.name);
                }
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1.5">
                    <span className="font-bold text-gray-900 text-base truncate flex-1">
                      # {channel.name}
                    </span>
                    {channel.isPrivate && (
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-medium">
                        🔒
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-gray-500 mb-1">
                    <span>by {channel.createdBy?.username || 'Unknown'}</span>
                    <span>•</span>
                    <span>{channel.members?.length || 0} members</span>
                  </div>
                  {channel.description && (
                    <p className="text-xs text-gray-600 line-clamp-2">{channel.description}</p>
                  )}
                </div>
                
                <div className="flex-shrink-0 ml-3">
                  {channel.isJoined ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs font-semibold text-green-700 bg-green-100 px-3 py-1.5 rounded-full">
                        Joined
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJoinChannel(channel._id, channel.name);
                      }}
                      className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 focus:ring-2 focus:ring-green-500 transition-all shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                    >
                      Join
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChannelList;
