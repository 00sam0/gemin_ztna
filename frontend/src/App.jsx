import React, { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);

  const handleLogin = (newToken, newUser) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };
  
  // Fetch user data on initial load if token exists
  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const res = await fetch('/api/users/me/', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const userData = await res.json();
            setUser(userData);
          } else {
            handleLogout(); // Invalid token
          }
        } catch (error) {
          handleLogout();
        }
      }
    };
    fetchUser();
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {token && user ? (
        <Dashboard user={user} token={token} onLogout={handleLogout} />
      ) : (
        <LoginPage onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;
