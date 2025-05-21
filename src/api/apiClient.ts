import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_STRUCTURE } from './api-structure.generated';
import { ApiError, ApiResponse } from './types';

/**
 * Storage keys for auth-related data
 */
const STORAGE_KEYS = {
  AUTH_TOKEN: 'qozex_auth_token',
  USER_DATA: 'qozex_user_data',
  CSRF_TOKEN: 'qozex_csrf_token',
  IS_ADMIN: 'qozex_is_admin',
  TOKEN_EXPIRATION: 'qozex_token_expiration', // New key for token expiration
  ADMIN_DATA: 'qozex_admin_data',
};

/**
 * Base URL for the API from environment variables
 */
const API_BASE_URL = 'https://acs-backend-2bvr.onrender.com';

/**
 * Core API client for making requests to the backend
 */
class ApiClient {
  private axios: AxiosInstance;
  private csrfToken: string | null = null;

  constructor() {
    this.axios = axios.create({
      baseURL: `${API_BASE_URL}/api`,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      withCredentials: true, // Important for cookie-based auth
    });

    this.setupInterceptors();
  }

  /**
   * Setup axios interceptors for request/response handling
   */
  private setupInterceptors(): void {
    // Request interceptor - add auth token and CSRF token
    this.axios.interceptors.request.use((config) => {
      // Check if token is expired before making request
      if (this.isTokenExpired()) {
        console.log('Token has expired, clearing auth data');
        this.clearAuth();
        
        // Redirect to login page
        const isAdmin = this.isAdminUser();
        if (isAdmin) {
          window.location.href = '/admin/login';
        } else {
          window.location.href = '/login';
        }
        
        // This will never execute as redirect happens, but needed for type safety
        return Promise.reject(new Error('Token expired'));
      }
      
      // Add authorization header if token exists
      const token = this.getToken();
      if (token) {
        // Ensure headers object exists
        config.headers = config.headers || {};
        config.headers['Authorization'] = `Bearer ${token}`;
        
        // Log token presence for debugging
        console.log('Adding auth token to request', config.url);
      }

      // Add CSRF token for non-GET requests
      if (config.method !== 'get' && this.csrfToken) {
        config.headers = config.headers || {};
        config.headers['X-CSRF-Token'] = this.csrfToken;
      }

      return config;
    });

    // Response interceptor - handle authentication errors
    this.axios.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        // If unauthorized, redirect to login
        if (error.response?.status === 401) {
          console.error('Unauthorized access - redirecting to login');
          
          // Clear authentication data
          this.clearAuth();
          
          // Redirect to the appropriate login page
          const isAdmin = this.isAdminUser();
          if (isAdmin) {
            window.location.href = '/admin/login';
          } else {
            window.location.href = '/login';
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  /**
   * Check if the JWT token is expired
   */
  private isTokenExpired(): boolean {
    const token = this.getToken();
    const expiration = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRATION);
    
    if (!token) {
      return true;
    }
    
    if (expiration) {
      // Return true if current time is past expiration
      return new Date().getTime() > parseInt(expiration, 10);
    }
    
    // If we have a token but no expiration, try to extract from JWT
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp) {
        // JWT exp is in seconds, convert to milliseconds
        const expTime = payload.exp * 1000;
        // Store expiration for future checks
        localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRATION, expTime.toString());
        return new Date().getTime() > expTime;
      }
    } catch (e) {
      console.error('Failed to decode token:', e);
    }
    
    // If we can't determine expiration, assume token is valid
    return false;
  }

  /**
   * Get stored auth token
   */
  public getToken(): string | null {
    // First determine if we're in admin mode
    const isAdmin = localStorage.getItem(STORAGE_KEYS.IS_ADMIN) === 'true';
    
    // Try to get token directly from storage first
    let token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    
    // If no direct token, check in the appropriate user data object
    if (!token) {
      const storageKey = isAdmin ? STORAGE_KEYS.ADMIN_DATA : STORAGE_KEYS.USER_DATA;
      const userData = localStorage.getItem(storageKey);
      
      if (userData) {
        try {
          const parsedData = JSON.parse(userData);
          token = parsedData.token || null;
        } catch (e) {
          console.error('Failed to parse stored user/admin data:', e);
        }
      }
    }
    
    return token;
  }

  /**
   * Set auth token in storage and extract expiration
   */
  public setToken(token: string): void {
    // Store token in dedicated storage
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    
    // Try to extract and store expiration
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp) {
        // JWT exp is in seconds, convert to milliseconds
        const expTime = payload.exp * 1000;
        localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRATION, expTime.toString());
      }
      
      // Also update token in the appropriate user/admin object
      const isAdmin = localStorage.getItem(STORAGE_KEYS.IS_ADMIN) === 'true';
      const storageKey = isAdmin ? STORAGE_KEYS.ADMIN_DATA : STORAGE_KEYS.USER_DATA;
      const userData = localStorage.getItem(storageKey);
      
      if (userData) {
        try {
          const parsedUserData = JSON.parse(userData);
          parsedUserData.token = token;
          localStorage.setItem(storageKey, JSON.stringify(parsedUserData));
        } catch (e) {
          console.error('Failed to update token in user/admin data:', e);
        }
      }
    } catch (e) {
      console.error('Failed to decode token for expiration:', e);
    }
  }

  /**
   * Check if the user is an admin
   */
  public isAdminUser(): boolean {
    return localStorage.getItem(STORAGE_KEYS.IS_ADMIN) === 'true';
  }

  /**
   * Set user type (admin or regular user)
   */
  public setUserType(isAdmin: boolean): void {
    localStorage.setItem(STORAGE_KEYS.IS_ADMIN, isAdmin ? 'true' : 'false');
  }

  /**
   * Clear all auth data (used for logout)
   */
  public clearAuth(): void {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    localStorage.removeItem(STORAGE_KEYS.CSRF_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.IS_ADMIN);
    localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRATION);
    localStorage.removeItem(STORAGE_KEYS.ADMIN_DATA);
    this.csrfToken = null;
  }

  /**
   * Fetch CSRF token for non-GET requests
   */
  public async fetchCsrfToken(): Promise<string> {
    try {
      // Use the correct endpoint with the full API path
      const response = await axios.get<any>(`${API_BASE_URL}/api/csrf-token`, {
        withCredentials: true, // Important for CSRF cookies
      });
      
      // Handle various response formats
      let csrfToken: string | null = null;
      
      if (response.data) {
        if (response.data.data && response.data.data.csrfToken) {
          // Standard format: { success: true, data: { csrfToken: "..." } }
          csrfToken = response.data.data.csrfToken;
        } else if (response.data.csrfToken) {
          // Alternative format: { csrfToken: "..." }
          csrfToken = response.data.csrfToken;
        }
      }
      
      if (!csrfToken) {
        throw new Error('CSRF token not found in response');
      }
      
      // Store token in memory and localStorage
      this.csrfToken = csrfToken;
      localStorage.setItem(STORAGE_KEYS.CSRF_TOKEN, csrfToken);
      
      return csrfToken;
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error);
      
      // Try to use existing token from local storage as fallback
      const storedToken = localStorage.getItem(STORAGE_KEYS.CSRF_TOKEN);
      if (storedToken) {
        console.log('Using stored CSRF token as fallback');
        this.csrfToken = storedToken;
        return storedToken;
      }
      
      throw error;
    }
  }

  /**
   * Generic request method with error handling
   */
  public async request<T>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      // For non-GET methods, ensure we have a CSRF token
      if (config.method && config.method.toLowerCase() !== 'get') {
        try {
          // If we don't have a token already, try to get one
          if (!this.csrfToken) {
            await this.fetchCsrfToken();
          }
        } catch (csrfError) {
          console.warn('Failed to fetch CSRF token, attempting request anyway:', csrfError);
          // Continue with request even if CSRF fetch fails
        }
      }
      
      const response = await this.axios.request<ApiResponse<T>>(config);
      return response.data;
    } catch (error) {
      // Handle errors
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ApiError>;
        
        // Handle CSRF errors specifically
        if (axiosError.response?.status === 403 && 
            (axiosError.response?.data?.code === 'CSRF_ERROR' || 
             axiosError.response?.data?.message?.includes('CSRF'))) {
          console.error('CSRF validation failed, attempting to refresh token and retry');
          
          // Clear existing token
          this.csrfToken = null;
          
          // Try to fetch a new token and retry the request once
          try {
            await this.fetchCsrfToken();
            
            // Retry the request with new token
            const retryResponse = await this.axios.request<ApiResponse<T>>(config);
            return retryResponse.data;
          } catch (retryError) {
            console.error('Failed to refresh CSRF token and retry request:', retryError);
            // Still throw the original error if retry fails
            throw error;
          }
        }
        
        // Get error response or create a generic one
        const errorResponse: ApiError = axiosError.response?.data || {
          success: false,
          message: 'Network error or server unavailable',
          code: 'NETWORK_ERROR',
        };
        
        throw errorResponse;
      }
      
      // Generic error
      throw {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'UNKNOWN_ERROR',
      } as ApiError;
    }
  }

  /**
   * Convenience methods for different HTTP methods
   */
  public async get<T>(url: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'get',
      url,
      params,
    });
  }

  public async post<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'post',
      url,
      data,
    });
  }

  public async put<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'put',
      url,
      data,
    });
  }

  public async delete<T>(url: string): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'delete',
      url,
    });
  }

  /**
   * Helper to build URL with path parameters
   */
  public buildUrl(urlTemplate: string, params: Record<string, string | number> = {}): string {
    let url = urlTemplate;
    
    // Replace all :param placeholders with actual values
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, String(value));
    });
    
    return url;
  }
}

// Create and export a single instance
const apiClient = new ApiClient();
export default apiClient; 