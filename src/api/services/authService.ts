import { z } from 'zod';
import apiClient from '../apiClient';
import { API_STRUCTURE } from '../api-structure.generated';
import { 
  AuthResponse, 
  AuthResponseSchema, 
  LoginRequest, 
  LoginRequestSchema, 
  RegisterRequest, 
  RegisterRequestSchema,
  AdminLoginRequest,
  AdminLoginRequestSchema,
  User,
  Admin
} from '../types';

// Define interfaces that include token property for response types
interface AuthResponseWithToken {
  user: User;
  token?: string;
  [key: string]: any; // Allow for additional properties
}

interface AdminAuthResponseWithToken {
  admin: Admin;
  token?: string;
  [key: string]: any; // Allow for additional properties
}

/**
 * Authentication Service
 * Handles all auth-related API interactions
 */
class AuthService {
  /**
   * Register a new user
   */
  async register(userData: RegisterRequest): Promise<User> {
    // Validate request data with Zod
    const validatedData = RegisterRequestSchema.parse(userData);
    
    const response = await apiClient.post<AuthResponseWithToken>(
      API_STRUCTURE.auth.register.path,
      validatedData
    );
    
    // Store auth token
    if (response.data.user && response.data.user.id) {
      // Extract token from response
      if (response.data.token) {
        apiClient.setToken(response.data.token);
        apiClient.setUserType(false); // Regular user, not admin
      } else if (typeof response.data === 'object' && 'token' in response.data) {
        // Handle alternate token location
        apiClient.setToken(response.data.token as string);
        apiClient.setUserType(false); 
      }
    }
    
    return response.data.user;
  }
  
  /**
   * Login user with phone and password
   */
  async login(credentials: LoginRequest): Promise<User> {
    try {
      // Validate request data with Zod
      const validatedData = LoginRequestSchema.parse(credentials);
      
      console.log('Sending login request with data:', JSON.stringify({
        phone: validatedData.phone,
        passwordLength: validatedData.password?.length || 0
      }));
      
      const response = await apiClient.post<any>(
        API_STRUCTURE.auth.login.path,
        validatedData
      );
      
      console.log('Login response:', response);
      
      // Extract user and token from response
      let user: User | undefined;
      let token: string | undefined;
      
      // First, check if the response indicates success directly
      if (response.data && response.data.success === true) {
        // Try to extract from different response structures
        if (response.data.data) {
          // Standard API format: { success: true, data: { user: {...}, token: "..." } }
          if (response.data.data.user) {
            user = response.data.data.user;
            token = response.data.data.token;
          } else if (response.data.data.userData) {
            // Alternative format: { success: true, data: { userData: {...}, token: "..." } }
            user = response.data.data.userData;
            token = response.data.data.token;
          } else if (typeof response.data.data === 'object' && Object.keys(response.data.data).length > 0) {
            // Format where data is the user object directly: { success: true, data: { id: 1, name: "..." } }
            user = response.data.data;
            token = response.data.token;
          }
        } else if (response.data.user) {
          // Alternative format at root level: { success: true, user: {...}, token: "..." }
          user = response.data.user;
          token = response.data.token;
        }
      } else if (response.data) {
        // Handle non-standard API responses
        if (response.data.user) {
          user = response.data.user;
          token = response.data.token;
        } else if (response.data.data && response.data.data.token) {
          // Some APIs return user data in different format
          token = response.data.data.token;
          user = response.data.data.userData || response.data.data.user;
        } else if (response.data.token) {
          // Response might have token at root but user data elsewhere
          token = response.data.token;
          // Try to find user data
          user = response.data.userData || response.data.user || response.data.data;
        } else if (typeof response.data === 'object' && Object.keys(response.data).length > 0 && 
                  (response.data.id || response.data.phone)) {
          // The response data itself might be the user
          user = response.data;
          token = response.data.token;
        }
      }
      
      if (!user) {
        console.error('Could not extract user data from login response:', response.data);
        throw new Error('Could not extract user data from login response');
      }
      
      // Store auth token if found
      if (token) {
        console.log('Setting auth token:', token.substring(0, 10) + '...');
        apiClient.setToken(token);
        apiClient.setUserType(false); // Regular user, not admin
      } else {
        console.warn('No token found in login response');
      }
      
      return user;
    } catch (error) {
      console.error('Login error:', error);
      
      // Rethrow for upstream handling
      throw error;
    }
  }
  
  /**
   * Admin login
   */
  async adminLogin(credentials: AdminLoginRequest): Promise<Admin> {
    try {
      // Validate request data with Zod
      const validatedData = AdminLoginRequestSchema.parse(credentials);
      
      console.log('Sending admin login request with username:', validatedData.username);
      
      const response = await apiClient.post<any>(
        API_STRUCTURE.auth.adminLogin.path,
        validatedData
      );
      
      console.log('Admin login response:', response);
      
      // Extract admin and token from response
      let admin: Admin | undefined;
      let token: string | undefined;
      
      // First, check if the response indicates success directly
      if (response.data && response.data.success === true) {
        // Try to extract from different response structures
        if (response.data.data) {
          // Standard API format: { success: true, data: { admin: {...}, token: "..." } }
          if (response.data.data.admin) {
            admin = response.data.data.admin;
            token = response.data.data.token;
          } else if (response.data.data.adminData) {
            // Alternative format: { success: true, data: { adminData: {...}, token: "..." } }
            admin = response.data.data.adminData;
            token = response.data.data.token;
          } else if (typeof response.data.data === 'object' && Object.keys(response.data.data).length > 0) {
            // Format where data is the admin object directly: { success: true, data: { id: 1, username: "..." } }
            admin = response.data.data;
            token = response.data.token || response.data.data.token;
          }
        } else if (response.data.admin) {
          // Alternative format at root level: { success: true, admin: {...}, token: "..." }
          admin = response.data.admin;
          token = response.data.token;
        }
      } else if (response.data) {
        // Handle non-standard API responses
        if (response.data.admin) {
          admin = response.data.admin;
          token = response.data.token;
        } else if (response.data.data && response.data.data.token) {
          // Some APIs return admin data in different format
          token = response.data.data.token;
          admin = response.data.data.adminData || response.data.data.admin || response.data.data.user;
        } else if (response.data.token) {
          // Response might have token at root but admin data elsewhere
          token = response.data.token;
          admin = response.data.adminData || response.data.admin || response.data.data;
        }
      }
      
      if (!admin) {
        // If we have a token but no admin data, create a minimal admin object
        if (token && response.data && response.data.data) {
          console.log('Creating minimal admin object from token and userId');
          admin = {
            id: response.data.data.userId || response.data.userId || 'admin',
            username: credentials.username,
            isAdmin: true
          };
        } else {
          console.error('Could not extract admin data from login response:', response.data);
          throw new Error('Could not extract admin data from login response');
        }
      }
      
      // Store auth token if found
      if (token) {
        console.log('Setting admin auth token:', token.substring(0, 10) + '...');
        apiClient.setToken(token);
        apiClient.setUserType(true); // Admin user
      } else {
        console.warn('No token found in admin login response');
      }
      
      return admin;
    } catch (error) {
      console.error('Admin login error:', error);
      
      // Rethrow for upstream handling
      throw error;
    }
  }

  /**
   * Refresh token for regular user
   */
  async refreshToken(): Promise<boolean> {
    try {
      const response = await apiClient.post<any>('/auth/refresh');
      
      // Extract token from response
      const token = response.data?.token || (response.data?.data?.token);
      
      if (token) {
        apiClient.setToken(token);
        return true;
      }
      
      return false;
    } catch (error) {
      // Check for database errors
      if (error instanceof Error) {
        const errorMessage = error.message;
        if (errorMessage.includes('SQLITE_ERROR') || errorMessage.includes('database')) {
          console.error('Database error during token refresh:', error);
        }
      } else if (error && typeof error === 'object' && 'message' in error) {
        const errorObj = error as { message: string };
        if (errorObj.message.includes('SQLITE_ERROR') || errorObj.message.includes('database')) {
          console.error('Database error during token refresh:', error);
        }
      }
      
      console.error('Token refresh failed:', error);
      return false;
    }
  }
  
  /**
   * Refresh token for admin user
   */
  async refreshAdminToken(): Promise<boolean> {
    try {
      const response = await apiClient.post<any>('/auth/q0z3x-management/refresh');
      
      // Extract token from response
      const token = response.data?.token || (response.data?.data?.token);
      
      if (token) {
        apiClient.setToken(token);
        apiClient.setUserType(true); // Ensure admin status preserved
        return true;
      }
      
      return false;
    } catch (error) {
      // Check for database errors
      if (error instanceof Error) {
        const errorMessage = error.message;
        if (errorMessage.includes('SQLITE_ERROR') || errorMessage.includes('database')) {
          console.error('Database error during admin token refresh:', error);
        }
      } else if (error && typeof error === 'object' && 'message' in error) {
        const errorObj = error as { message: string };
        if (errorObj.message.includes('SQLITE_ERROR') || errorObj.message.includes('database')) {
          console.error('Database error during admin token refresh:', error);
        }
      }
      
      console.error('Admin token refresh failed:', error);
      return false;
    }
  }
  
  /**
   * Logout user or admin
   */
  async logout(): Promise<void> {
    try {
      const isAdmin = apiClient.isAdminUser();
      const logoutPath = isAdmin 
        ? API_STRUCTURE.auth.adminLogout.path 
        : API_STRUCTURE.auth.logout.path;
      
      await apiClient.post(logoutPath);
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      // Always clear local auth data regardless of API success
      apiClient.clearAuth();
    }
  }
  
  /**
   * Get CSRF token for form submissions
   */
  async getCsrfToken(): Promise<string> {
    return apiClient.fetchCsrfToken();
  }
  
  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return apiClient.getToken() !== null;
  }
  
  /**
   * Check if the authenticated user is an admin
   */
  isAdmin(): boolean {
    return this.isAuthenticated() && apiClient.isAdminUser();
  }
}

// Create and export a single instance
const authService = new AuthService();
export default authService; 