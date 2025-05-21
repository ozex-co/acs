import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../utils/api';
import { useError } from './ErrorContext';
import { STORAGE, STORAGE_KEYS } from '../utils/constants';
import { User, Admin } from '../types/api'; // Assuming User/Admin types are defined/imported
import { extractUserToken } from '../utils/api'; // Import the global helper function
import { initializeAuthContextActions } from './authContextInstance'; // Import the initializer
import { handleStandardizedResponse } from '../utils/api'; // Import the standardized response handler
import { 
  extractTokenFromResponse, 
  storeAuthToken, 
  hasValidAuthToken,
  clearAuthTokens
} from '../utils/tokenUtils'; // Import token utilities

// Define types for user and admin
interface AppUser extends User {
  token?: string;
  roles?: string[];
  permissions?: string[];
}

interface AppAdmin {
  id: number | string;
  username: string;
  email: string;
  token: string;
  isAdmin: boolean;
  roles?: string[];
  permissions?: string[];
}

// Define token refresh intervals
const TOKEN_CHECK_INTERVAL = 60 * 60 * 1000; // Check every hour
const TOKEN_EXPIRY_THRESHOLD = 24 * 60 * 60 * 1000; // 1 day before expiry

interface AuthContextProps {
  user: AppUser | null;
  admin: AppAdmin | null;
  isUserLoggedIn: boolean;
  isAdminLoggedIn: boolean;
  isLoading: boolean;
  userLogin: (phone: string, password: string) => Promise<boolean>;
  adminLogin: (username: string, password: string) => Promise<boolean>;
  userRegister: (userData: any) => Promise<boolean>;
  userLogout: () => void;
  adminLogout: () => void;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
  updateUser: (updatedUser: AppUser) => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUserState] = useState<AppUser | null>(null);
  const [admin, setAdminState] = useState<AppAdmin | null>(null);
  const { showError } = useError();
  const [isLoading, setIsLoading] = useState(true); // Initialize to true while checking auth state
  // Track last token refresh time to avoid excessive refreshes
  const [lastTokenRefresh, setLastTokenRefresh] = useState<number>(0);
  // Flag to indicate if we should stop refresh attempts (after multiple failures)
  const [stopRefreshAttempts, setStopRefreshAttempts] = useState<boolean>(false);
  // Count failed refresh attempts to avoid infinite loops
  const [failedRefreshAttempts, setFailedRefreshAttempts] = useState<number>(0);
  // Add auth check complete flag to prevent redirect loops
  const [authCheckComplete, setAuthCheckComplete] = useState<boolean>(false);

  // Wrapped setters to potentially update localStorage or perform other side effects
  const setUser = (userData: AppUser | null) => {
    setUserState(userData);
    if (userData) {
      localStorage.setItem(STORAGE.USER_DATA, JSON.stringify(userData));
    } else {
      localStorage.removeItem(STORAGE.USER_DATA);
    }
  };

  const setAdmin = (adminData: AppAdmin | null) => {
    setAdminState(adminData);
    if (adminData) {
      localStorage.setItem(STORAGE.ADMIN_DATA, JSON.stringify(adminData));
    } else {
      localStorage.removeItem(STORAGE.ADMIN_DATA);
    }
  };

  // Check if user is logged in on mount and attempt to refresh token
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true); // Set loading to true when starting auth check
      
      try {
        // Check if we have a valid token stored
        if (hasValidAuthToken()) {
          console.log('Valid token found');
          
          // Check local storage for user/admin data
          const userData = localStorage.getItem(STORAGE.USER_DATA);
          const adminData = localStorage.getItem(STORAGE.ADMIN_DATA);
          
          // If we have valid data, set it
          if (userData) {
            try {
              const parsedUserData = JSON.parse(userData) as AppUser;
              if (parsedUserData && parsedUserData.id) {
                console.log('Restoring user session from local storage');
                setUser(parsedUserData);
              }
            } catch (error) {
              console.error('Failed to parse user data:', error);
              localStorage.removeItem(STORAGE.USER_DATA);
            }
          } else if (adminData) {
            try {
              const parsedAdminData = JSON.parse(adminData) as AppAdmin;
              if (parsedAdminData && parsedAdminData.id) {
                console.log('Restoring admin session from local storage');
                setAdmin(parsedAdminData);
              }
            } catch (error) {
              console.error('Failed to parse admin data:', error);
              localStorage.removeItem(STORAGE.ADMIN_DATA);
            }
          }
        } else {
          // If no valid token found, clear any stored data
          localStorage.removeItem(STORAGE.USER_DATA);
          localStorage.removeItem(STORAGE.ADMIN_DATA);
          setUser(null);
          setAdmin(null);
        }
      } catch (error) {
        console.error('Error during authentication check:', error);
        // Clear invalid data on error
        localStorage.removeItem(STORAGE.USER_DATA);
        localStorage.removeItem(STORAGE.ADMIN_DATA);
        setUser(null);
        setAdmin(null);
      } finally {
        // Ensure we always mark auth check as complete and turn off loading
        setIsLoading(false);
        setAuthCheckComplete(true);
      }
    };
    
    checkAuth();
  }, []);

  // Set up token expiration check
  useEffect(() => {
    // Don't setup checks if we've explicitly stopped attempts
    if (stopRefreshAttempts) return;

    const checkTokenExpiration = async () => {
      // Skip if no active user or admin session
      if (!user && !admin) return;
      
      // Check if token is about to expire
      // Use AUTH_STORAGE_KEYS from tokenUtils.ts
      const tokenExpiration = localStorage.getItem('qozex_token_expiration');
      if (tokenExpiration) {
        const expirationTime = parseInt(tokenExpiration, 10);
        const now = Date.now();
        
        // If token is within threshold of expiring, log the user out
        if (expirationTime - now < TOKEN_EXPIRY_THRESHOLD) {
          console.log('Token is about to expire, logging out');
          if (user) userLogout();
          if (admin) adminLogout();
        }
      }
    };

    // Check token expiration periodically
    const intervalId = setInterval(checkTokenExpiration, TOKEN_CHECK_INTERVAL);
    return () => clearInterval(intervalId);
  }, [user, admin, stopRefreshAttempts]);
  
  const refreshToken = async (): Promise<boolean> => {
    // Access tokens now last 30 days, no refresh needed
    return false;
  };
  
  const refreshAdminToken = async (): Promise<boolean> => {
    // Access tokens now last 30 days, no refresh needed
    return false;
  };

  const userLogin = async (phone: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await authApi.login(phone, password);
      
      // Use our new standardized response handler
      const handledResponse = handleStandardizedResponse(response);
      
      if (!handledResponse.success) {
        showError(handledResponse.error || 'Login failed');
        setUser(null); 
        return false;
      }
      
      // Extract user data
      const responseUserData = handledResponse.data?.user || handledResponse.data;
      const token = handledResponse.data?.token || extractUserToken(handledResponse.data);
      
      if (!responseUserData || !token) {
        showError('Invalid credentials or response format');
        setUser(null);
        return false;
      }
      
      const updatedUserData: AppUser = { 
        id: responseUserData.id || '',
        fullName: responseUserData.fullName || responseUserData.name || '',
        phone: responseUserData.phone || phone,
        email: responseUserData.email || '',
        token, // Store token with user data
        isAdmin: false
      };
            
      // Store user data including token
      localStorage.setItem(STORAGE.USER_DATA, JSON.stringify(updatedUserData));
      setUser(updatedUserData);
      
      // Reset refresh state on successful login
      setLastTokenRefresh(Date.now());
      setStopRefreshAttempts(false);
      setFailedRefreshAttempts(0);
      return true;
    } catch (error) {
      setUser(null);
      localStorage.removeItem(STORAGE.USER_DATA);
      
      // Handle different types of errors
      let errorMessage = 'An unexpected error occurred during login.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      // Check for SQLite error in the error message
      if (typeof errorMessage === 'string' && 
          (errorMessage.includes('SQLITE_ERROR') || 
           errorMessage.includes('SQL') ||
           errorMessage.includes('database'))) {
        errorMessage = 'Database error occurred. Please try again later or contact support.';
      }
      
      showError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const userRegister = async (userDataToRegister: any): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await authApi.register(userDataToRegister);
      
      // Use our new standardized response handler
      const handledResponse = handleStandardizedResponse(response);
      
      if (!handledResponse.success) {
        showError(handledResponse.error || 'Registration failed');
        setUser(null); 
        return false;
      }
      
      // Extract user data
      const responseUserData = handledResponse.data?.user || handledResponse.data;
      const token = handledResponse.data?.token || extractUserToken(handledResponse.data);
      
      // Create a valid user even if backend doesn't return complete data
      const updatedUserData: AppUser = { 
        id: responseUserData?.id || '',
        fullName: responseUserData?.fullName || userDataToRegister.fullName,
        phone: responseUserData?.phone || userDataToRegister.phone,
        email: responseUserData?.email || userDataToRegister.email || '',
        token: token || '', // Store token with user data
        isAdmin: false
      };
            
      // Store user data including token
      localStorage.setItem(STORAGE.USER_DATA, JSON.stringify(updatedUserData));
      setUser(updatedUserData);
      
      // Reset refresh state on successful registration
      setLastTokenRefresh(Date.now());
      setStopRefreshAttempts(false);
      setFailedRefreshAttempts(0);
      return true;
    } catch (error) {
       setUser(null);
       localStorage.removeItem(STORAGE.USER_DATA);
       showError(error instanceof Error ? error.message : 'An unexpected error occurred during registration.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const adminLogin = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await authApi.adminLogin(username, password);
      
      // Log the raw response for debugging
      console.log('Admin login raw response:', response);
      
      // First check for success
      if (!response || response.error) {
        showError(response?.error || 'Admin login failed');
        setAdmin(null);
        return false;
      }
      
      // Use enhanced token extractor to find token in any response format
      const token = extractTokenFromResponse(response);
      
      // Log token extraction result
      console.log('Admin token extraction result:', !!token);
      
      // Extract admin data from response
      const adminData = response.data?.admin || 
                        response.data?.user || 
                        response.data || {};
      
      if (!token) {
        console.error('No token found in admin login response');
        showError('Authentication error: No token received');
        setAdmin(null);
        return false;
      }
      
      // Store token and mark as admin 
      storeAuthToken(token, true);
      
      // Create a complete admin object with fallbacks, ensuring role is included
      const adminObject: AppAdmin = {
        id: (adminData as any).id || 0,
        username: (adminData as any).username || username,
        email: (adminData as any).email || '',
        token: token,
        isAdmin: true,
        roles: (adminData as any).roles || ['admin'], // Ensure 'admin' role is set as fallback
        permissions: (adminData as any).permissions || []
      };
      
      // Log the admin object we created
      console.log('Created admin object:', adminObject);
      
      // Update state and localStorage
      setAdmin(adminObject);
      setUser(null); // Clear user when admin logs in
      localStorage.setItem(STORAGE.ADMIN_DATA, JSON.stringify(adminObject));
      localStorage.removeItem(STORAGE.USER_DATA); // Remove any stored user data
      
      // Signal successful login
      return true;
    } catch (error) {
      console.error('Admin login failed with error:', error);
      showError(error instanceof Error ? error.message : 'Admin login failed');
      setAdmin(null);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const userLogout = async () => {
    setIsLoading(true);
    try {
      const response = await authApi.logout();
      
      if (response.error) {
        console.warn('Logout API call failed, performing silent logout', response.error);
        authApi.silentLogout(false);
      }
      
      // Clear state regardless of API response
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Perform silent logout on error
      authApi.silentLogout(false);
      setUser(null);
      
      // Show error only for non-CSRF related errors
      if (error instanceof Error && 
          !error.message.includes('403') && 
          !error.message.includes('CSRF')) {
        showError(error.message || 'An unexpected error occurred during logout.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const adminLogout = async () => {
    setIsLoading(true);
    try {
      const response = await authApi.adminLogout();
      
      if (response.error) {
        console.warn('Admin logout API call failed, performing silent logout', response.error);
        authApi.silentLogout(true);
      }
      
      // Clear all authentication state 
      setAdmin(null);
      
      // Explicitly clear all possible token storage locations
      localStorage.removeItem(STORAGE.ADMIN_DATA);
      localStorage.removeItem('qozex_auth_token');
      localStorage.removeItem('qozex_is_admin');
      localStorage.removeItem('qozex_token_expiration');
      
    } catch (error) {
      console.error('Admin logout error:', error);
      // Perform silent logout on error
      authApi.silentLogout(true);
      
      // Clear all token storage here too
      localStorage.removeItem(STORAGE.ADMIN_DATA);
      localStorage.removeItem('qozex_auth_token');
      localStorage.removeItem('qozex_is_admin');
      localStorage.removeItem('qozex_token_expiration');
      
      // Show error only for non-CSRF related errors
      if (error instanceof Error && 
          !error.message.includes('403') && 
          !error.message.includes('CSRF')) {
        showError(error.message || 'An unexpected error occurred during admin logout.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Add initialization of the auth context actions
  useEffect(() => {
    // Initialize the global auth context actions for cross-file access
    initializeAuthContextActions({
      updateUser: (updatedUser: User) => {
        if (user) {
          setUser({ ...user, ...updatedUser } as AppUser);
        }
      },
      updateAdmin: (updatedAdmin: Admin) => {
        if (admin) {
          setAdmin({ ...admin, ...updatedAdmin } as AppAdmin);
        }
      },
      logout: userLogout,
      adminLogout: adminLogout,
      refreshToken,
      refreshAdminToken
    });
  }, [user, admin]);

  // Update user data (used after profile updates)
  const updateUser = (updatedUserPartial: Partial<AppUser>) => {
    if (!user) return;
    
    const updatedUser = { ...user, ...updatedUserPartial };
    setUser(updatedUser);
  };

  useEffect(() => {
    if (user) { 
      const refreshTimeout = setTimeout(async () => {
        await refreshToken(); 
      }, TOKEN_CHECK_INTERVAL);

      return () => clearTimeout(refreshTimeout);
    }
  }, [user]); 

  useEffect(() => {
    if (admin) { 
      const refreshTimeout = setTimeout(async () => {
        await refreshAdminToken(); 
      }, TOKEN_CHECK_INTERVAL);

      return () => clearTimeout(refreshTimeout);
    }
  }, [admin]); 

  const hasRole = (role: string): boolean => {
    // Check if user has the given role
    if (user && user.roles && Array.isArray(user.roles)) {
      return user.roles.includes(role);
    }
    
    // Check if admin has the given role
    if (admin && admin.roles && Array.isArray(admin.roles)) {
      return admin.roles.includes(role);
    }
    
    // Special case: if role is 'admin' and we have an admin logged in
    if (role === 'admin' && admin) {
      return true;
    }
    
    return false;
  };

  const hasPermission = (permission: string): boolean => {
    if (!user && !admin) return false;
    
    const currentUser = user || admin;
    if (!currentUser?.permissions) return false;
    
    return currentUser.permissions.includes(permission);
  };

  const authContextValue = {
    user,
    admin,
    isUserLoggedIn: !!user,
    isAdminLoggedIn: !!admin,
    isLoading,
    userLogin,
    adminLogin,
    userRegister,
    userLogout,
    adminLogout,
    hasRole,
    hasPermission,
    updateUser,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 