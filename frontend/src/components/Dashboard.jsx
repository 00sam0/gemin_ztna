import React, { useState } from 'react';
import Sidebar from './Sidebar';
import UserManagement from './UserManagement';
import LogsViewer from './LogsViewer';
import FileManagement from './FileManagement'; // New import
import { LayoutDashboard, Users, ScrollText, Folder, LogOut } from 'lucide-react';

const Dashboard = ({ user, token, onLogout }) => {
  const [activeView, setActiveView] = useState('dashboard');

  const renderActiveView = () => {
    switch (activeView) {
      case 'users':
        return <UserManagement token={token} />;
      case 'logs':
        return <LogsViewer token={token} />;
      case 'files': // New case
        return <FileManagement token={token} />;
      case 'dashboard':
      default:
        return <DashboardHome user={user} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar user={user} activeView={activeView} setActiveView={setActiveView} onLogout={onLogout} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <div className="container mx-auto px-6 py-8">
            {renderActiveView()}
          </div>
        </main>
      </div>
    </div>
  );
};

const DashboardHome = ({ user }) => (
  <div>
    <h3 className="text-3xl font-medium text-gray-700">Welcome, {user.full_name}!</h3>
    <div className="mt-4">
      <div className="bg-white p-6 rounded-md shadow-md">
        <h4 className="text-lg font-semibold text-gray-700">Your Profile</h4>
        <p className="text-gray-600 mt-2">Email: {user.email}</p>
        <p className="text-gray-600">Role: <span className="capitalize font-medium text-indigo-600">{user.role}</span></p>
      </div>
    </div>
  </div>
);

export default Dashboard;
