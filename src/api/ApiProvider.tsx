import React, { createContext, useContext, useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import apiClient from './apiClient';
import { authService } from './services';
import { User, Admin } from './types';

// Context type definition
interface ApiContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  user: User | null;
  admin: Admin | null;
  isLoading: boolean;
  error: Error | null;
  login: (phone: string, password: string) => Promise<User>;
  adminLogin: (username: string, password: string) => Promise<Admin>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

// Create context with default values
const ApiContext = createContext<ApiContextType>({
  isAuthenticated: false,
  isAdmin: false,
  user: null,
  admin: null,
  isLoading: false,
  error: null,
  login: async () => {
    throw new Error('ApiProvider not initialized');
  },
  adminLogin: async () => {
    throw new Error('ApiProvider not initialized');
  },
  logout: async () => {
    throw new Error('ApiProvider not initialized');
  },
  refreshAuth: async () => {
    throw new Error('ApiProvider not initialized');
  },
});

// Create a QueryClient for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: true,
      refetchOnMount: true,
    },
  },
});

// User data storage key
const USER_DATA_KEY = 'qozex_user_data';

export const ApiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if we have a stored token
        const token = apiClient.getToken();
        
        if (!token) {
          setIsLoading(false);
          return;
        }

        // Determine if user or admin based on stored flag
        const isAdminUser = apiClient.isAdminUser();
        setIsAdmin(isAdminUser);

        // Attempt to load user data from storage
        const storedData = localStorage.getItem(USER_DATA_KEY);
        if (storedData) {
          const userData = JSON.parse(storedData);
          if (isAdminUser) {
            setAdmin(userData);
          } else {
            setUser(userData);
          }
        }

        // Set authenticated state
        setIsAuthenticated(true);
        
        // Optionally validate token with server
        try {
          // Refresh token silently
          await authService.refreshToken();
        } catch (refreshError) {
          // If refresh fails, clear auth state
          console.error('Token refresh failed:', refreshError);
          await logout();
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to initialize auth'));
        console.error('Auth initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (phone: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const loggedInUser = await authService.login({ phone, password });
      setUser(loggedInUser);
      setAdmin(null);
      setIsAuthenticated(true);
      setIsAdmin(false);
      
      // Store user data
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(loggedInUser));
      
      return loggedInUser;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Login failed'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Admin login function
  const adminLogin = async (username: string, password: string): Promise<Admin> => {
    setIsLoading(true);
    try {
      const loggedInAdmin = await authService.adminLogin({ username, password });
      setAdmin(loggedInAdmin);
      setUser(null);
      setIsAuthenticated(true);
      setIsAdmin(true);
      
      // Store admin data
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(loggedInAdmin));
      
      return loggedInAdmin;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Admin login failed'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout API call failed:', err);
      // Continue with local logout even if API call fails
    } finally {
      // Clear local state regardless of API call success
      setUser(null);
      setAdmin(null);
      setIsAuthenticated(false);
      setIsAdmin(false);
      localStorage.removeItem(USER_DATA_KEY);
      
      // Clear all queries from cache
      queryClient.clear();
      
      setIsLoading(false);
    }
  };

  // Refresh auth state
  const refreshAuth = async (): Promise<void> => {
    if (!isAuthenticated) return;
    
    try {
      await authService.refreshToken();
    } catch (err) {
      console.error('Auth refresh failed:', err);
      // If refresh fails, log the user out
      await logout();
    }
  };

  // Create context value object
  const contextValue: ApiContextType = {
    isAuthenticated,
    isAdmin,
    user,
    admin,
    isLoading,
    error,
    login,
    adminLogin,
    logout,
    refreshAuth,
  };

  return (
    <ApiContext.Provider value={contextValue}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </ApiContext.Provider>
  );
};

// Custom hook to use the API context
export const useApi = () => useContext(ApiContext);

export default ApiProvider; 