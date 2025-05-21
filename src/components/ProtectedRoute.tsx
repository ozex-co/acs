import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  requiredRoles?: string[];
  requiredPermissions?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  adminOnly = false, 
  requiredRoles, 
  requiredPermissions 
}) => {
  const auth = useAuth();
  const location = useLocation();

  if (!auth) {
      console.error("ProtectedRoute used outside AuthProvider!");
      return <Navigate to="/login" replace />;
  }

  const { isUserLoggedIn, isAdminLoggedIn, user, admin, hasRole, hasPermission, isLoading } = auth;

  // Show loading state while authentication check is in progress
  if (isLoading) {
    // Return a loading indicator instead of redirecting
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-dark">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-gray-400">جاري التحقق من حالة الدخول...</p>
        </div>
      </div>
    );
  }

  const isLoggedIn = isUserLoggedIn || isAdminLoggedIn;

  if (!isLoggedIn) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience
    // than dropping them off on the home page.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Handle admin-only routes (existing logic)
  if (adminOnly && !isAdminLoggedIn) {
    // Redirect to home or an unauthorized page if a non-admin tries to access admin route
    return <Navigate to="/" replace />;
  }
  
  // Check roles if required
  if (requiredRoles && requiredRoles.length > 0) {
      const userHasRequiredRole = requiredRoles.some(role => hasRole(role));
      if (!userHasRequiredRole) {
          // Redirect to unauthorized page or home
          console.warn(`Access denied: User lacks required roles (${requiredRoles.join(', ')}) for ${location.pathname}`);
          return <Navigate to="/unauthorized" replace />; // Or "/"
      }
  }
  
  // Check permissions if required
  if (requiredPermissions && requiredPermissions.length > 0) {
      const userHasRequiredPermission = requiredPermissions.every(perm => hasPermission(perm)); // Use 'every' - user needs ALL listed permissions
      if (!userHasRequiredPermission) {
          // Redirect to unauthorized page or home
           console.warn(`Access denied: User lacks required permissions (${requiredPermissions.join(', ')}) for ${location.pathname}`);
          return <Navigate to="/unauthorized" replace />; // Or "/"
      }
  }

  // If logged in and passes admin/role/permission checks, render the children
  return <>{children}</>;
};

export default ProtectedRoute; 