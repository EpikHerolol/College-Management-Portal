import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('college_portal_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('college_portal_token');
      const storedUser = localStorage.getItem('college_portal_user');

      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
          // Verify with backend
          const res = await authApi.getMe();
          if (res.data.success) {
            setUser(res.data.user);
            localStorage.setItem('college_portal_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.error('Session expired or invalid:', err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    if (res.data.success) {
      const { token: receivedToken, user: receivedUser } = res.data;
      setToken(receivedToken);
      setUser(receivedUser);
      localStorage.setItem('college_portal_token', receivedToken);
      localStorage.setItem('college_portal_user', JSON.stringify(receivedUser));
      return receivedUser;
    }
    throw new Error(res.data.message || 'Login failed.');
  };

  const logout = () => {
    localStorage.removeItem('college_portal_token');
    localStorage.removeItem('college_portal_user');
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

