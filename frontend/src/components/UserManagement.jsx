import React, { useState, useEffect, useCallback } from 'react';
import { Trash2, PlusCircle } from 'lucide-react';

const UserManagement = ({ token }) => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddUserForm, setShowAddUserForm] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch users.');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const res = await fetch(`/api/admin/users/${userId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.detail || 'Failed to delete user.');
        }
        fetchUsers(); // Refresh list after delete
      } catch (err) {
        alert(`Error: ${err.message}`);
      }
    }
  };

  if (isLoading) return <div>Loading users...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center">
        <h3 className="text-3xl font-medium text-gray-700">User Management</h3>
        <button 
            onClick={() => setShowAddUserForm(!showAddUserForm)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none"
        >
            <PlusCircle size={20} className="mr-2"/>
            {showAddUserForm ? 'Cancel' : 'Add User'}
        </button>
      </div>
      {showAddUserForm && <AddUserForm token={token} onUserAdded={() => {
          setShowAddUserForm(false);
          fetchUsers();
      }} />}
      <div className="mt-8 bg-white p-6 rounded-md shadow-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map(user => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">{user.full_name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap capitalize">{user.role}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-900">
                    <Trash2 size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AddUserForm = ({ token, onUserAdded }) => {
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('employee');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ email, full_name: fullName, password, role })
            });
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || 'Failed to add user.');
            }
            onUserAdded();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="mt-6 p-6 bg-white rounded-md shadow-md">
            <form onSubmit={handleSubmit} className="space-y-4">
                <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-3 py-2 border rounded-md"/>
                <input type="text" placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} required className="w-full px-3 py-2 border rounded-md"/>
                <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full px-3 py-2 border rounded-md"/>
                <select value={role} onChange={e => setRole(e.target.value)} className="w-full px-3 py-2 border rounded-md">
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                </select>
                {error && <p className="text-red-500">{error}</p>}
                <button type="submit" disabled={isLoading} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400">
                    {isLoading ? 'Adding...' : 'Add User'}
                </button>
            </form>
        </div>
    );
};

export default UserManagement;
