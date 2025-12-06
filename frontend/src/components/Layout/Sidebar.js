import React from 'react';

const Sidebar = ({ activeTab, setActiveTab }) => {
  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'tasks'
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          📝 Tasks
        </button>
        <button
          onClick={() => setActiveTab('channels')}
          className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'channels'
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          💬 Channels
        </button>
      </nav>
    </div>
  );
};

export default Sidebar;
