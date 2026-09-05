import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';

// Map each role to its default landing page
export const ROLE_HOME = {
  super_admin:  '/superadmin',
  school_admin: '/admin',
  teacher:      '/teacher',
  student:      '/student',
  parent:       '/parent',
};

/**
 * Wraps a route so only authenticated users with the right role(s) can access it.
 * allowedRoles: string[] — omit to allow any authenticated role
 */
export function ProtectedRoute({ children, allowedRoles }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sand-100">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    // Redirect to their correct home dashboard
    return <Navigate to={ROLE_HOME[profile.role] || '/login'} replace />;
  }

  return children;
}

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-4 border-sand-200 border-t-brand-gold rounded-full animate-spin" />
      <p className="text-sm text-charcoal-500 font-medium">Loading…</p>
    </div>
  );
}
