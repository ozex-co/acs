import { apiClient, API_ROUTES, extractUserToken } from '../api';
import { ApiHandlerResponse, AuthResponse } from '../../types/api';

/**
 * Authentication API handlers
 * Handles integration issues between frontend and backend
 */
const authApi = {
  /**
   * Login user
   * @param phone Phone number
   * @param password Password
   * @returns Authentication response
   */
  login: async (phone: string, password: string): Promise<ApiHandlerResponse<AuthResponse>> => {
    try {
      const response = await apiClient.post(API_ROUTES.LOGIN, { phone, password });
      
      // Extract token using the utility function that handles different formats
      const token = extractUserToken(response.data);
      
      // Extract user data which might be in different locations
      const userData = response.data?.user || 
                      response.data?.data?.user || 
                      (response.data?.data && !response.data.data.user ? response.data.data : null);
      
      if (!token || !userData) {
        return {
          success: false,
          error: 'Invalid response format from server'
        };
      }
      
      // Ensure user data has consistent structure
      const user = {
        id: String(userData.id),
        fullName: userData.fullName || userData.fullname || userData.full_name || userData.name || '',
        phone: userData.phone || '',
        email: userData.email,
        isAdmin: !!userData.isAdmin
      };
      
      return {
        success: true,
        data: { token, user }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || 'Login failed'
      };
    }
  },
  
  /**
   * Login as admin
   * @param username Admin username
   * @param password Admin password
   * @returns Authentication response
   */
  adminLogin: async (username: string, password: string): Promise<ApiHandlerResponse<AuthResponse>> => {
    try {
      const response = await apiClient.post(API_ROUTES.ADMIN_LOGIN, { username, password });
      
      // Extract token using the utility function that handles different formats
      const token = extractUserToken(response.data);
      
      // Extract admin data which might be in different locations
      const adminData = response.data?.admin || 
                       response.data?.data?.admin || 
                       (response.data?.data && !response.data.data.admin ? response.data.data : null);
      
      if (!token || !adminData) {
        return {
          success: false,
          error: 'Invalid response format from server'
        };
      }
      
      // Ensure admin data has consistent structure
      const user = {
        id: String(adminData.id),
        fullName: adminData.fullName || adminData.username || '',
        phone: adminData.phone || '',
        email: adminData.email,
        isAdmin: true
      };
      
      return {
        success: true,
        data: { token, user }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || 'Admin login failed'
      };
    }
  },
  
  /**
   * Logout user
   */
  logout: async (): Promise<ApiHandlerResponse<void>> => {
    try {
      await apiClient.post(API_ROUTES.LOGOUT);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || 'Logout failed'
      };
    }
  },
  
  /**
   * Logout admin
   */
  adminLogout: async (): Promise<ApiHandlerResponse<void>> => {
    try {
      await apiClient.post(API_ROUTES.ADMIN_LOGOUT);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || 'Admin logout failed'
      };
    }
  },
  
  /**
   * Refresh user token
   */
  refreshToken: async (): Promise<ApiHandlerResponse<AuthResponse>> => {
    try {
      const response = await apiClient.post(API_ROUTES.REFRESH_TOKEN);
      
      // Extract token using the utility function that handles different formats
      const token = extractUserToken(response.data);
      
      // Extract user data which might be in different locations
      const userData = response.data?.user || 
                      response.data?.data?.user || 
                      (response.data?.data && !response.data.data.user ? response.data.data : null);
      
      if (!token) {
        return {
          success: false,
          error: 'Invalid response format from server: missing token'
        };
      }
      
      // User data might not be included in refresh response
      const user = userData ? {
        id: String(userData.id),
        fullName: userData.fullName || userData.fullname || userData.full_name || userData.name || '',
        phone: userData.phone || '',
        email: userData.email,
        isAdmin: !!userData.isAdmin
      } : undefined;
      
      return {
        success: true,
        data: { 
          token, 
          user: user || {
            id: '',
            fullName: '',
            phone: '',
            isAdmin: false
          }
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || 'Token refresh failed'
      };
    }
  },
  
  /**
   * Refresh admin token
   */
  adminRefreshToken: async (): Promise<ApiHandlerResponse<AuthResponse>> => {
    try {
      const response = await apiClient.post(API_ROUTES.ADMIN_REFRESH_TOKEN);
      
      // Extract token using the utility function that handles different formats
      const token = extractUserToken(response.data);
      
      if (!token) {
        return {
          success: false,
          error: 'Invalid response format from server: missing token'
        };
      }
      
      // Admin data might not be included in refresh response
      return {
        success: true,
        data: { 
          token, 
          user: {
            id: '',
            fullName: '',
            phone: '',
            isAdmin: true
          }
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || 'Admin token refresh failed'
      };
    }
  },
  
  /**
   * Register new user
   * @param userData User registration data
   * @returns Authentication response
   */
  register: async (userData: {
    fullName: string;
    phone: string;
    password: string;
    dateOfBirth: string;
    email?: string;
  }): Promise<ApiHandlerResponse<AuthResponse>> => {
    try {
      const response = await apiClient.post(API_ROUTES.REGISTER, userData);
      
      // Extract token using the utility function that handles different formats
      const token = extractUserToken(response.data);
      
      // Extract user data which might be in different locations
      const userResponse = response.data?.user || 
                          response.data?.data?.user || 
                          (response.data?.data && !response.data.data.user ? response.data.data : null);
      
      // Check if the response indicates success even without token or user data
      // This is critical for handling backend responses that don't match frontend expectations
      if (response.data?.success === true) {
        // If the backend says success but we're missing data, try to extract what we can
        const partialUser = {
          id: userResponse?.id || '',
          fullName: userResponse?.fullName || userResponse?.fullname || userResponse?.full_name || userResponse?.name || userData.fullName,
          phone: userResponse?.phone || userData.phone,
          email: userResponse?.email || userData.email || '',
          isAdmin: false
        };
        
        return {
          success: true,
          data: { 
            token: token || '',
            user: partialUser
          },
          message: response.data?.message || 'تم إنشاء الحساب بنجاح'
        };
      }
      
      if (!token || !userResponse) {
        return {
          success: false,
          error: 'Invalid response format from server'
        };
      }
      
      // Ensure user data has consistent structure
      const user = {
        id: String(userResponse.id),
        fullName: userResponse.fullName || userResponse.fullname || userResponse.full_name || userResponse.name || '',
        phone: userResponse.phone || '',
        email: userResponse.email,
        isAdmin: false
      };
      
      return {
        success: true,
        data: { token, user }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || 'Registration failed'
      };
    }
  },
};

export default authApi; 