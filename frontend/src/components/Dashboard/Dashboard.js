import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Tasks from '../Dashboard/Tasks';
import ChannelList from '../Chat/ChannelList';
import ChatWindow from '../Chat/ChatWindow';
import Sidebar from '../Layout/Sidebar';
import Header from '../Layout/Header';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('tasks');
  const [selectedChannel, setSelectedChannel] = useState(null);

  const handleChannelSelect = (channelId, channelName) => {
    setSelectedChannel({ _id: channelId, name: channelName });
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} logout={logout} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          {activeTab === 'tasks' && <Tasks />}
          {activeTab === 'channels' && (
            <div className="h-full flex space-x-6 max-w-7xl mx-auto">
              <div className="w-80 flex-shrink-0 h-full">
                <ChannelList onChannelSelect={handleChannelSelect} />
              </div>
              <div className="flex-1 flex flex-col min-h-[600px]">
                <ChatWindow selectedChannel={selectedChannel} />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
