import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from './LoadingSpinner';

export const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner text="Checking authentication credentials..." />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to their default dashboard
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'faculty') return <Navigate to="/faculty/dashboard" replace />;
    if (user.role === 'student') return <Navigate to="/student/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

