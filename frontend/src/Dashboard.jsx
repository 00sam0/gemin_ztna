import React, { useState, useEffect } from 'react';

const Dashboard = ({ token, onLogout }) => {
  const [user, setUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || '/';

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError('');
      try {
        const userRes = await fetch(`${API_URL}api/users/me/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!userRes.ok) {
            if (userRes.status === 401) onLogout();
            throw new Error('Failed to fetch user data.');
        }
        const userData = await userRes.json();
        setUser(userData);

        if (userData.role === 'admin') {
          const allUsersRes = await fetch(`${API_URL}api/admin/users`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (allUsersRes.ok) {
            const allUsersData = await allUsersRes.json();
            setAllUsers(allUsersData);
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [token, onLogout, API_URL]);

  if (isLoading) {
    return <div className="p-8 text-center">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500 text-center">Error: {error}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <header className="flex justify-between items-center mb-6 px-4 sm:px-0">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <button
                onClick={onLogout}
                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
                Logout
            </button>
        </header>

      {user && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 space-y-6">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Welcome, {user.full_name}!
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Your role is: <span className="font-semibold capitalize">{user.role}</span>
            </p>
          </div>

          {user.role === 'admin' && allUsers.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900">Admin Panel: All Users</h3>
              <p className="text-sm text-gray-500 mb-4">You can see this because you have the 'admin' role.</p>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allUsers.map((u) => (
                      <tr key={u.email}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.full_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {user.role === 'employee' && (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                  <p className="text-sm text-blue-700">This is the standard employee view. You do not have access to the admin panel.</p>
              </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;