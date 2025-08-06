import React from 'react';
import { LayoutDashboard, Users, ScrollText, Folder, LogOut } from 'lucide-react';

const Sidebar = ({ user, activeView, setActiveView, onLogout }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'files', label: 'Files', icon: Folder },
    { id: 'users', label: 'User Management', icon: Users, adminOnly: true },
    { id: 'logs', label: 'Logs', icon: ScrollText, adminOnly: true },
  ];

  return (
    <div className="flex flex-col w-64 bg-gray-800 text-gray-100">
      <div className="flex items-center justify-center h-20 shadow-md">
        <h1 className="text-2xl uppercase text-indigo-400 font-bold">ZTNA</h1>
      </div>
      <div className="flex-1 flex flex-col justify-between">
        <nav className="mt-10">
          {navItems.map(item => {
            if (item.adminOnly && user.role !== 'admin') {
              return null;
            }
            return (
              <a
                key={item.id}
                className={`flex items-center mt-4 py-2 px-6 cursor-pointer ${
                  activeView === item.id ? 'bg-gray-700 bg-opacity-25 text-gray-100 border-l-4 border-indigo-400' : 'text-gray-400 hover:bg-gray-700 hover:bg-opacity-25'
                }`}
                onClick={() => setActiveView(item.id)}
              >
                <item.icon className="w-6 h-6" />
                <span className="mx-3">{item.label}</span>
              </a>
            );
          })}
        </nav>
        <div className="mb-10">
           <a
            className="flex items-center mt-4 py-2 px-6 cursor-pointer text-gray-400 hover:bg-gray-700 hover:bg-opacity-25"
            onClick={onLogout}
          >
            <LogOut className="w-6 h-6" />
            <span className="mx-3">Logout</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;