import React from 'react';
import { useLocation } from 'react-router-dom';
import MaintenancePage from './MaintenancePage';
import { APP_CONFIG } from '../config/appConfig';

interface AppLockProps {
  children: React.ReactNode;
}

const AppLock: React.FC<AppLockProps> = ({ children }) => {
  const location = useLocation();
  const isExemptPath = APP_CONFIG.EXEMPT_PATHS.some(path => location.pathname.startsWith(path));

  // Show app content if:
  // 1. App is enabled, OR
  // 2. Current path is exempt (e.g., admin paths)
  if (APP_CONFIG.APP_ENABLED || isExemptPath) {
    return <>{children}</>;
  }

  // Otherwise show maintenance page
  return <MaintenancePage contactEmail={APP_CONFIG.CONTACT_EMAIL} />;
};

export default AppLock; 