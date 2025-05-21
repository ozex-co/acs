import { User, Admin } from '../types/api';

// Define types for auth actions
interface AuthContextActions {
  updateUser?: (user: User) => void;
  updateAdmin?: (admin: Admin) => void;
  logout?: () => void;
  adminLogout?: () => void;
  refreshToken?: () => Promise<boolean>;
  refreshAdminToken?: () => Promise<boolean>;
}

// Create a global object to store auth context actions
export const authContextActions: AuthContextActions = {};

/**
 * Initialize auth context actions - called by the AuthContext
 * This function binds methods from the AuthContext to the global actions object
 */
export const initializeAuthContextActions = (actions: AuthContextActions): void => {
  Object.assign(authContextActions, actions);
}; 