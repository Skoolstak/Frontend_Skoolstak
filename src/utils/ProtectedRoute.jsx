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
// Send signed-out visitors to the login page for the portal they were trying to open
function loginPathFor(pathname) {
  if (pathname.startsWith('/teacher')) return '/teacher-login';
  if (pathname.startsWith('/admin') || pathname.startsWith('/superadmin')) return '/schooladmin';
  return '/login';
}

export function ProtectedRoute({ children, allowedRoles }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  const loginPath = loginPathFor(location.pathname);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sand-100">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // No profile row for this auth user — can't verify role, so deny access.
  if (allowedRoles && !profile) {
    return <Navigate to={loginPath} state={{ from: location }} replace />;
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
