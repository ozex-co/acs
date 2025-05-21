import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { STORAGE } from './constants';
import logger from './logger';
import { displayErrorNotification } from './errorHandler';
import { authContextActions } from '../context/authContextInstance'; // Import shared actions
import { User, Admin } from '../types/api'; // Ensure User and Admin types are imported
// Import API response types
import { 
    AuthResponse, 
    GetExamsResponse, 
    GetExamByIdResponse, 
    SubmitExamResponse,
    UpdateUserProfileResponse, 
    GetResultsResponse,
    ExamSummary,
    UserExamResult
} from '../types/api';
import { normalizeResultData } from './result-helpers';

/**
 * Admin path prefix for admin routes - should match backend configuration
 */
const ADMIN_PATH_PREFIX = 'q0z3x-management';

/**
 * API routes configuration
 */
export const API_ROUTES = {
  BASE_URL: 'https://acs-backend-2bvr.onrender.com/api',
  // Authentication
  REGISTER: '/auth/register',
  LOGIN: '/auth/login',
  ADMIN_LOGIN: `/auth/${ADMIN_PATH_PREFIX}/login`,
  LOGOUT: '/auth/logout',
  ADMIN_LOGOUT: `/auth/${ADMIN_PATH_PREFIX}/logout`,
  REFRESH_TOKEN: '/auth/refresh',
  ADMIN_REFRESH_TOKEN: `/auth/${ADMIN_PATH_PREFIX}/refresh`,
  // CSRF
  CSRF_TOKEN: '/csrf-token',
  // User
  CURRENT_USER: '/user/profile',
  UPDATE_PROFILE: '/user/profile',
  // Exams
  GET_EXAMS: '/exams',
  GET_EXAM: (id: string | number) => `/exams/${id}`,
  SUBMIT_EXAM: (id: string | number) => `/exams/${id}/submit`,
  // Results
  GET_RESULTS: '/results',
  GET_RESULT: (id: string | number) => `/results/${id}`,
  SHARE_RESULT: (id: string | number) => `/results/${id}/share`,
  // Admin
  ADMIN_USERS: '/admin/users',
  ADMIN_EXAMS: '/admin/exams',
  ADMIN_EXAM: (id: string | number) => `/admin/exams/${id}`,
  ADMIN_STATS: '/admin/stats',
  // Sections
  GET_SECTIONS: '/sections',
  ADMIN_SECTIONS: '/admin/sections',
  ADMIN_SECTION: (id: string | number) => `/admin/sections/${id}`,
};

// Feature flags
export const API_FEATURES = {
  // Disable CSRF protection
  CSRF_ENABLED: false, 
  // Mark the CSRF endpoint as missing to skip token fetching
  CSRF_ENDPOINT_MISSING: true,
  // Refresh token endpoints are not available
  REFRESH_TOKEN_AVAILABLE: false
};

/**
 * Standardized API response format
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  code?: string;
  details?: Record<string, any>;
  fieldErrors?: Record<string, string>;
}

/**
 * Error response from API
 */
export interface ApiErrorResponse {
  success: false;
  message: string;
  code: string;
  details?: Record<string, any>;
  fieldErrors?: Record<string, string>;
}

// Declare custom properties for request config
interface ExtendedInternalAxiosRequestConfig extends InternalAxiosRequestConfig {
  _isRetry?: boolean;
}

// Extend axios request config to include metadata
interface RequestConfigWithMetadata extends ExtendedInternalAxiosRequestConfig {
  metadata?: {
    startTime: number;
  };
}

/**
 * Create and configure Axios client for API requests
 */
export const createApiClient = (options: AxiosRequestConfig = {}): AxiosInstance => {
  const client = axios.create({
    baseURL: API_ROUTES.BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    withCredentials: false, // Disabled for cross-domain calls
    ...options,
  });

  // Global request interceptor
  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const isMutationRequest = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method?.toUpperCase() || '');
      
      // Skip CSRF token handling if it's disabled or the endpoint was previously not found
      if (API_FEATURES.CSRF_ENABLED && !API_FEATURES.CSRF_ENDPOINT_MISSING) {
        // Get stored CSRF token for mutating requests
        let csrfToken = localStorage.getItem(STORAGE.CSRF_TOKEN);
        
        // If mutating and no CSRF token, try to fetch one first (unless this is the CSRF token request itself)
        if (isMutationRequest && !csrfToken && !config.url?.includes('/csrf-token')) {
          try {
            const response = await axios.get(`${API_ROUTES.BASE_URL}${API_ROUTES.CSRF_TOKEN}`, { 
              withCredentials: true 
            });
            
            if (response.data?.data?.csrfToken) {
              csrfToken = response.data.data.csrfToken;
              // Use non-null assertion since we've checked that csrfToken exists
              localStorage.setItem(STORAGE.CSRF_TOKEN, csrfToken!);
            }
          } catch (error) {
            logger.warning('Failed to fetch CSRF token', error instanceof Error ? error.message : 'Unknown error');
            
            // Mark the CSRF endpoint as missing if we get a 404
            if (axios.isAxiosError(error) && error.response?.status === 404) {
              logger.warning('CSRF token endpoint not found (404), disabling CSRF token fetching');
              API_FEATURES.CSRF_ENDPOINT_MISSING = true;
            }
            
            // Continue without CSRF token, might fail if server enforces it
          }
        }

        // Add CSRF token to headers for mutating requests
        if (isMutationRequest && csrfToken) {
          config.headers['X-CSRF-Token'] = csrfToken;
        }
      }
      
      // Determine if request is for admin routes
      const isAdminRoute = config.url?.includes('/admin');
      
      // Get user or admin data for authentication
      const userDataRaw = localStorage.getItem(isAdminRoute ? STORAGE.ADMIN_DATA : STORAGE.USER_DATA);
      
      if (userDataRaw) {
        try {
          const userData = JSON.parse(userDataRaw);
          
          // Add Authorization header if we have a token
          if (userData.token) {
            config.headers['Authorization'] = `Bearer ${userData.token}`;
          }
        } catch (error) {
          logger.error('Failed to parse user data for auth header', error instanceof Error ? error.message : 'Unknown error');
        }
      }
      
      // Log request details
      logger.request(
        config.url || '',
        config.method?.toUpperCase() || 'GET',
        config.data,
        config.headers
      );
      
      // Add request timestamp for calculating duration
      (config as RequestConfigWithMetadata).metadata = { startTime: new Date().getTime() };
      
      return config;
    },
    (error) => {
      logger.error(error, 'API Request Interceptor');
      return Promise.reject(error);
    }
  );

  // Global response interceptor
  client.interceptors.response.use(
    // Success handler
    (response: AxiosResponse) => {
      // Calculate request duration if metadata is available
      const config = response.config as RequestConfigWithMetadata;
      const duration = config?.metadata 
        ? new Date().getTime() - config.metadata.startTime 
        : 0;
      
      // Log successful response
      logger.response(
        config?.url || '',
        config?.method?.toUpperCase() || 'GET',
        response.status,
        response.data,
        duration
      );
      
      return response;
    },
    
    // Error handler
    async (error: AxiosError<ApiErrorResponse>) => {
      const config = error.config as RequestConfigWithMetadata | undefined;
      // Calculate request duration even for errors
      const duration = config?.metadata 
        ? new Date().getTime() - config.metadata.startTime 
        : 0;
      
      // Log error response if available
      if (error.response) {
        logger.response(
          error.config?.url || '',
          error.config?.method?.toUpperCase() || 'GET',
          error.response.status,
          error.response.data,
          duration
        );
        
        // Handle CSRF token errors
        if (error.response.status === 403 && 
            error.response.data && 
            error.response.data.code === 'CSRF_TOKEN_INVALID') {
          try {
            // Fetch a new CSRF token
            const response = await axios.get(`${API_ROUTES.BASE_URL}${API_ROUTES.CSRF_TOKEN}`, { 
              withCredentials: true 
            });
            
            // Extract token from different possible response formats
            const responseData = response.data || {};
            const newCsrfToken = responseData.csrfToken || 
                              (responseData.data && responseData.data.csrfToken) || 
                              null;
            
            if (newCsrfToken) {
              localStorage.setItem(STORAGE.CSRF_TOKEN, newCsrfToken);
              
              // Retry the original request with the new token
              if (config) {
                // Clone original request config
                const newConfig = { ...config } as ExtendedInternalAxiosRequestConfig;
                // Add the new CSRF token to headers
                newConfig.headers = newConfig.headers || {};
                // Set CSRF token in header
                newConfig.headers['X-CSRF-Token'] = newCsrfToken;
                
                // Retry the request
                return axios(newConfig);
              }
            }
          } catch (error: unknown) {
            console.error('Failed to refresh CSRF token:', error);
          }
        }
        
        // Handle authentication errors
        if (error.response.status === 401 && config) {
          console.error('Unauthorized access detected');
          
          // Skip auth handling for login, logout, or refresh token requests
          const isAuthRelatedRequest = config.url?.includes('/auth/login') || 
                                     config.url?.includes('/auth/logout') ||
                                     config.url?.includes('/auth/refresh-token');
          
          // Determine if it's an admin route - define here so it's available in all blocks
          const isAdminRoute = config.url?.includes('/admin') || 
                              config.url?.includes(`/${ADMIN_PATH_PREFIX}`);
                                     
          if (isAuthRelatedRequest) {
            // Just pass through the error for auth-related requests
            return Promise.reject(error);
          }
          
          // Mark as retry attempt to avoid infinite loops
          if (config._isRetry) {
            console.error('Request already retried - auth failed');
          } else {
            config._isRetry = true;
            
            try {
              // Try to refresh token before giving up - but only if the API supports it
              if (API_FEATURES.REFRESH_TOKEN_AVAILABLE) {
                if (isAdminRoute && authContextActions.refreshAdminToken) {
                  const refreshed = await authContextActions.refreshAdminToken();
                  if (refreshed) {
                    // If refresh succeeded, retry the original request
                    console.log('Admin token refreshed successfully, retrying request');
                    return apiClient(config);
                  }
                } else if (!isAdminRoute && authContextActions.refreshToken) {
                  const refreshed = await authContextActions.refreshToken();
                  if (refreshed) {
                    // If refresh succeeded, retry the original request
                    console.log('User token refreshed successfully, retrying request');
                    return apiClient(config);
                  }
                }
              } else {
                console.log('Refresh token endpoints not available, cannot retry request');
              }
            } catch (refreshError) {
              console.error('Token refresh failed in response interceptor:', refreshError);
            }
          }
          
          // If we get here, either token refresh failed or we already retried
          // Logout user
          if (isAdminRoute && authContextActions.adminLogout) {
            authContextActions.adminLogout();
            if (window.location.pathname !== '/admin/login') {
              window.location.href = '/admin/login';
            }
          } else if (!isAdminRoute && authContextActions.logout) {
            authContextActions.logout();
            if (window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
          } else {
            // Fallback if context actions are not available
            if (isAdminRoute) {
              window.location.href = '/admin/login';
            } else {
              window.location.href = '/login';
            }
          }
        }
      } else if (!error.response) {
        // Network errors (no response)
        logger.error(`Network Error: ${error.message}`);
        logger.error('Network error details', JSON.stringify({ 
          url: error.config?.url, 
          method: error.config?.method?.toUpperCase() 
        }));
      }
      
      // Show error notification for significant errors (exclude 401/403 for auth routes)
      const shouldShowError = 
        error.response && 
        !(error.response.status === 401 && error.config?.url?.includes('/auth/')) &&
        !(error.response.status === 403 && error.config?.url?.includes('/auth/'));
      
      if (shouldShowError) {
        const errorData = error.response?.data;
        const status = error.response?.status || 0;
        
        displayErrorNotification({
          title: `Error ${status}`,
          message: errorData?.message || error.message || 'An error occurred',
          error: {
            status,
            code: errorData?.code,
            details: errorData?.details,
            fieldErrors: errorData?.fieldErrors,
            isApiError: true
          }
        });
      }
      
      return Promise.reject(error);
    }
  );

  return client;
};

// Create default API client instance
export const apiClient = createApiClient();

/**
 * Utility function to make authenticated API calls using direct Axios
 * Used as a fallback when the main API client has issues
 */
export const makeAuthenticatedRequest = async (
  method: 'get' | 'post' | 'put' | 'delete',
  endpoint: string,
  data?: any,
  storageKey: string = STORAGE.ADMIN_DATA
) => {
  try {
    // Get auth token
    const userData = localStorage.getItem(storageKey);
    let token = '';
    
    if (userData) {
      const parsed = JSON.parse(userData);
      token = parsed.token || '';
    }
    
    // Ensure endpoint starts with /api/
    const apiEndpoint = endpoint.startsWith('/api/') 
      ? endpoint 
      : `/api/${endpoint}`;
    
    // Base URL from constants
    const baseUrl = API_ROUTES.BASE_URL;
    const url = `${baseUrl}${apiEndpoint}`;
    
    // Common config
    const config: any = {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      }
    };
    
    let response;
    // Make appropriate call based on method
    if (method === 'get' || method === 'delete') {
      response = await axios[method](url, config);
    } else {
      response = await axios[method](url, data, config);
    }
    
    return { data: response.data, error: null };
  } catch (error: any) {
    console.error(`Error in ${method} request to ${endpoint}:`, error);
    
    // Better error handling with detailed logging
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    const errorMessage = error.response?.data?.message || `Request failed: ${error.message || 'Unknown error'}`;
    return { data: null, error: errorMessage };
  }
};

// Fetch CSRF token separately (useful when initializing the app)
export const fetchCsrfToken = async (): Promise<string | null> => {
  // Skip if CSRF is disabled or endpoint was previously not found
  if (!API_FEATURES.CSRF_ENABLED || API_FEATURES.CSRF_ENDPOINT_MISSING) {
    logger.info('Skipping CSRF token fetch (disabled or endpoint missing)');
    return null;
  }
  
  try {
    // Use direct axios call without credentials
    const response = await axios.get(`${API_ROUTES.BASE_URL}${API_ROUTES.CSRF_TOKEN}`, {
      withCredentials: false
    });
    
    // Extract CSRF token from different possible response formats
    const csrfToken = response.data?.csrfToken || 
                     (response.data?.data && response.data.data.csrfToken) || 
                     null;
    
    if (csrfToken) {
      localStorage.setItem(STORAGE.CSRF_TOKEN, csrfToken);
      return csrfToken;
    }
    return null;
  } catch (error) {
    logger.error(error, 'Failed to fetch CSRF token');
    
    // Mark the CSRF endpoint as missing if we get a 404
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      logger.warning('CSRF token endpoint not found (404), disabling CSRF token fetching');
      API_FEATURES.CSRF_ENDPOINT_MISSING = true;
    }
    
    return null;
  }
};

/**
 * Standardizes error handling for API errors
 * 
 * @param error Any error from an API call
 * @param context Context message for logging
 * @returns Standardized error message
 */
const handleApiError = (error: any, context: string): string => {
  // Extract error details
  if (axios.isAxiosError(error)) {
    // Log the detailed error
    logger.error({
      context,
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data,
      message: error.message
    });
    
    // Check for database errors in response
    if (error.response?.data?.message?.includes('SQLITE_ERROR') || 
        error.response?.data?.details?.code === 'SQLITE_ERROR' ||
        error.response?.data?.details?.error?.code === 'SQLITE_ERROR') {
      logger.error('Database error detected:', error.response?.data);
      return 'A database error occurred. Please try again later or contact support.';
    }
    
    // Server returned an error response
    if (error.response) {
      const { data, status } = error.response;

      // Standard API error format
      if (data && typeof data === 'object') {
        // Check for our standard API error format
        if ('message' in data && typeof data.message === 'string') {
          return data.message;
        }
        
        // Check for field errors
        if ('fieldErrors' in data && data.fieldErrors && typeof data.fieldErrors === 'object') {
          const fieldErrors = Object.values(data.fieldErrors);
          if (fieldErrors.length > 0) {
            return fieldErrors.join('. ');
          }
        }
        
        // Check for error details
        if ('error' in data && typeof data.error === 'string') {
          return data.error;
        }
      }

      // Return status-based message as fallback
      if (status === 401) {
        return 'Unauthorized. Please log in again.';
      } else if (status === 403) {
        return 'You do not have permission to perform this action.';
      } else if (status === 404) {
        return 'The requested resource was not found.';
      } else if (status >= 500) {
        return 'Server error. Please try again later.';
      }
    }
    
    // Connection error, timeout, etc.
    if (error.code === 'ECONNABORTED') {
      return 'Request timed out. Please check your connection and try again.';
    }
    
    if (!navigator.onLine) {
      return 'You are offline. Please check your connection and try again.';
    }
  }
  
  // Check for direct SQLite error
  if (error && typeof error === 'object' && 
      ((error.code && error.code === 'SQLITE_ERROR') || 
       (error.message && typeof error.message === 'string' && error.message.includes('SQLITE_ERROR')))) {
    logger.error('Direct SQLite error detected:', error);
    return 'A database error occurred. Please try again later or contact support.';
  }
  
  // Non-axios error or unknown format
  const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
  logger.error({ context, message: errorMessage });
  
  return errorMessage || 'An unexpected error occurred. Please try again.';
};

/**
 * Handle empty collections safely by checking nested paths
 */
const handleEmptyCollections = <T>(response: ApiResponse<T>, collectionPath: string[]): T => {
  let result = response.data;
  let current: any = result;
  
  // Navigate through the object path
  for (const key of collectionPath) {
    if (current && typeof current === 'object' && key in current) {
      if (Array.isArray(current[key])) {
        // Initialize empty arrays
        current[key] = current[key] || [];
      } else if (current[key] === null || current[key] === undefined) {
        // Initialize empty objects
        current[key] = {};
      }
      current = current[key];
    }
  }
  
  return result;
};

/**
 * Extract data from various API response formats
 * Handles different backend response structures
 * @param responseData Any API response
 * @param path Optional path to extract from (e.g., 'exam' for data.exam)
 * @returns Normalized data or null if not found
 */
export const extractApiData = <T>(responseData: any, path?: string): T | null => {
  if (!responseData) return null;
  
  // Direct data object - common structure is { success: true, data: {...} }
  if (responseData.data && typeof responseData.data === 'object') {
    // If path is specified, try to get from data.path
    if (path && responseData.data[path]) {
      return responseData.data[path] as T;
    }
    // Otherwise return whole data object
    return responseData.data as T;
  }
  
  // Some APIs return data directly at the top level
  if (path && responseData[path]) {
    return responseData[path] as T;
  }
  
  // If we have an object with expected fields, return whole response
  if (typeof responseData === 'object') {
    return responseData as T;
  }
  
  return null;
};

/**
 * Extract user token from various response formats
 * @param responseData API response data
 * @returns Token string or undefined if not found
 */
export const extractUserToken = (responseData: any): string | undefined => {
  if (!responseData) return undefined;
  
  // Check all possible locations where the token might be
  if (typeof responseData === 'string') {
    return responseData; // Direct token string
  }
  
  // Check root level token property
  if (responseData.token) {
    return responseData.token;
  }
  
  // Check token in data object
  if (responseData.data?.token) {
    return responseData.data.token;
  }
  
  // Check token in user object
  if (responseData.user?.token) {
    return responseData.user.token;
  }
  
  // Check token in user object inside data
  if (responseData.data?.user?.token) {
    return responseData.data.user.token;
  }
  
  // Some backends might use access_token
  if (responseData.access_token) {
    return responseData.access_token;
  }
  
  // Another backend format
  if (responseData.accessToken) {
    return responseData.accessToken;
  }
  
  return undefined;
};

/**
 * Extract specific data from API response based on key
 * @param data API response data
 * @param key Specific data key to extract (e.g., 'exam', 'result')
 * @returns Extracted data or null
 */
export const extractSpecificData = <T>(data: any, key: string): T | null => {
  if (!data) return null;
  
  // Special debug log for exams
  if ((key === 'exam' || key === 'exams') && (data.status === 500 || (data.success === false && data.code))) {
    console.log(`ERROR: Received error response for ${key} extraction:`, data);
    console.log(`Error details: status=${data.status}, code=${data.code}, message=${data.message}`);
    
    // Check for field validation errors
    if (data.fieldErrors) {
      console.log('Field validation errors:', data.fieldErrors);
    }
    
    // Special case for validation errors - the backend might be expecting different parameters
    if (data.code === 'VALIDATION_ERROR') {
      console.error('VALIDATION ERROR detected. Check that the request parameters match what the backend expects.');
    }
  }
  
  // Special debug log for exams
  if (key === 'exam' || key === 'exams') {
    console.log(`Attempting to extract ${key} from:`, data);
  }
  
  // Check in standard API response format with nested data
  if (data.success === true && data.data) {
    // Deep nested structure - data.data.data.key
    if (data.data.data && typeof data.data.data === 'object' && data.data.data[key]) {
      console.log(`Found ${key} in data.data.data.${key}`);
      return data.data.data[key] as T;
    }
    
    // Regular nested structure - data.data.key
    if (data.data[key]) {
      console.log(`Found ${key} in data.data.${key}`);
      return data.data[key] as T;
    }
  }
  
  // Check in standard API response format
  if (data.data && typeof data.data === 'object') {
    // Direct access to key in data object
    if (data.data[key]) {
      console.log(`Found ${key} in data.data.${key}`);
      return data.data[key] as T;
    }
    
    // Handle deeply nested structure (e.g., data.data.exams)
    if (data.data.data && typeof data.data.data === 'object' && data.data.data[key]) {
      console.log(`Found ${key} in data.data.data.${key}`);
      return data.data.data[key] as T;
    }
    
    // If data itself is the expected object
    if (Object.keys(data.data).length > 0 && 
        (data.data.id || 
         (key === 'exams' && Array.isArray(data.data)) || 
         (key === 'results' && Array.isArray(data.data)))) {
      console.log(`Found ${key} directly in data.data`);
      return data.data as T;
    }
  }
  
  // Check for direct access at root level
  if (data[key]) {
    console.log(`Found ${key} directly at root level`);
    return data[key] as T;
  }
  
  // Handle nested data.data structure at root
  if (data.data && data.data[key]) {
    console.log(`Found ${key} in data.data.${key}`);
    return data.data[key] as T;
  }
  
  // If root object matches what we're looking for 
  if (key === 'exam' && data.title && (data.questionsCount !== undefined || data.questions)) {
    console.log('Found exam data directly in response');
    return data as T;
  }
  
  if (key === 'result' && data.score !== undefined && data.totalQuestions) {
    console.log('Found result data directly in response');
    return data as T;
  }
  
  // For array types
  if (key === 'exams' && Array.isArray(data)) {
    console.log('Found exams array directly in response');
    return data as T;
  }
  
  if (key === 'results' && Array.isArray(data)) {
    console.log('Found results array directly in response');
    return data as T;
  }
  
  // For unsuccessful API response that contains the data we need
  if (data.success === false && data[key]) {
    console.log(`Found ${key} in failed API response`);
    return data[key] as T;
  }
  
  if (key === 'exam' || key === 'exams') {
    console.log(`Could not extract ${key} from response:`, data);
  }
  
  return null;
};

/**
 * Standard handler for API responses with proper typing
 */
type ApiHandlerResponse<T> = { data: T | null; error: string | null };

/**
 * API service implementations
 */

// Authentication API
export const authApi = {
  // Register a new user
  register: async (userData: any): Promise<ApiHandlerResponse<AuthResponse>> => {
    try {
      const response = await apiClient.post(API_ROUTES.REGISTER, userData);
      return { data: extractApiData(response), error: null };
    } catch (error) {
      return { data: null, error: handleApiError(error, 'Registration failed') };
    }
  },
  
  // Login user
  login: async (phone: string, password: string): Promise<ApiHandlerResponse<AuthResponse>> => {
    try {
      // Log the login attempt for debugging (without showing the password)
      console.log(`Login attempt for phone: ${phone}`);
      
      const response = await apiClient.post(API_ROUTES.LOGIN, { phone, password });
      console.log('Login response received:', response.status);
      
      return { data: extractApiData(response), error: null };
    } catch (error: any) {
      console.error('Login error details:', error);
      
      // More detailed error handling
      let errorMessage = 'Login failed';
      
      if (error?.response?.data?.message) {
        // Use the server's error message if available
        errorMessage = error.response.data.message;
      } else if (error?.response?.status === 500) {
        errorMessage = 'Server error occurred. Please try again later.';
      } else if (error?.response?.status === 401) {
        errorMessage = 'Invalid phone number or password';
      } else if (error?.response?.status === 403) {
        errorMessage = 'Account is locked or inactive';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      return { 
        data: null, 
        error: errorMessage,
        status: error?.response?.status
      };
    }
  },
  
  // Admin login
  adminLogin: async (username: string, password: string): Promise<ApiHandlerResponse<AuthResponse>> => {
    try {
      // Log the login attempt for debugging (without showing the password)
      console.log(`Admin login attempt for username: ${username}`);
      
      const response = await apiClient.post(API_ROUTES.ADMIN_LOGIN, { username, password });
      console.log('Admin login response received:', response.status);
      
      // Extract the full response data for debugging
      const responseData = response.data;
      console.log('Admin login response data structure:', Object.keys(responseData));
      
      // Extract token directly from various possible locations
      let token = undefined;
      
      // Look in standard locations for token
      if (responseData.data?.token) {
        token = responseData.data.token;
        console.log('Found token in data.token');
      } else if (responseData.data?.admin?.token) {
        token = responseData.data.admin.token;
        console.log('Found token in data.admin.token');
      } else if (responseData.token) {
        token = responseData.token;
        console.log('Found token in root token property');
      } else if (responseData.admin?.token) {
        token = responseData.admin.token;
        console.log('Found token in admin.token');
      }
      
      // If no token found but response is successful, check raw response
      if (!token && responseData.success) {
        console.log('No token found but login successful, searching deeper...');
        console.log('Response data:', JSON.stringify(responseData, null, 2));
      }
      
      // Extract full API data
      const data = extractApiData(response);
      
      // If we found a token but it's not in the extracted data, add it
      if (token && data && !data.token && !data.admin?.token) {
        if (typeof data === 'object') {
          data.token = token;
        }
      }
      
      return { data, error: null };
    } catch (error: any) {
      console.error('Admin login error details:', error);
      
      // More detailed error handling
      let errorMessage = 'Admin login failed';
      
      if (error?.response?.data?.message) {
        // Use the server's error message if available
        errorMessage = error.response.data.message;
      } else if (error?.response?.status === 500) {
        errorMessage = 'Server error occurred. Please try again later.';
      } else if (error?.response?.status === 401) {
        errorMessage = 'Invalid username or password';
      } else if (error?.response?.status === 403) {
        errorMessage = 'Account is locked or inactive';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      return { 
        data: null, 
        error: errorMessage,
        status: error?.response?.status
      };
    }
  },
  
  // Refresh token
  refreshToken: async (): Promise<ApiHandlerResponse<AuthResponse>> => {
    try {
      const response = await apiClient.post(API_ROUTES.REFRESH_TOKEN);
      return { data: extractApiData(response), error: null };
    } catch (error) {
      return { data: null, error: handleApiError(error, 'Token refresh failed') };
    }
  },
  
  // Refresh admin token
  refreshAdminToken: async (): Promise<ApiHandlerResponse<AuthResponse>> => {
    try {
      const response = await apiClient.post(API_ROUTES.ADMIN_REFRESH_TOKEN);
      return { data: extractApiData(response), error: null };
    } catch (error) {
      return { data: null, error: handleApiError(error, 'Admin token refresh failed') };
    }
  },
  
  // Logout user
  logout: async (): Promise<ApiHandlerResponse<null>> => {
    try {
      // Fetch CSRF token first
      await fetchCsrfToken();
      
      const response = await apiClient.post(API_ROUTES.LOGOUT);
      // Clean up stored CSRF token on logout
      localStorage.removeItem(STORAGE.CSRF_TOKEN);
      return { data: null, error: null };
    } catch (error) {
      return { data: null, error: handleApiError(error, 'Logout failed') };
    }
  },
  
  // Admin logout
  adminLogout: async (): Promise<ApiHandlerResponse<null>> => {
    try {
      // Fetch CSRF token first
      await fetchCsrfToken();
      
      const response = await apiClient.post(API_ROUTES.ADMIN_LOGOUT);
      // Clean up stored CSRF token on logout
      localStorage.removeItem(STORAGE.CSRF_TOKEN);
      return { data: null, error: null };
    } catch (error) {
      return { data: null, error: handleApiError(error, 'Admin logout failed') };
    }
  },
  
  // Silent logout - doesn't make API call, just cleans up local storage
  silentLogout: (isAdmin: boolean = false): void => {
    localStorage.removeItem(isAdmin ? STORAGE.ADMIN_DATA : STORAGE.USER_DATA);
    localStorage.removeItem(STORAGE.CSRF_TOKEN);
    logger.info(`Silent ${isAdmin ? 'admin' : 'user'} logout completed`);
  }
};

// User API
export const userApi = {
  // Get current user profile
  getCurrentUser: async (): Promise<ApiHandlerResponse<any>> => {
    try {
      const response = await apiClient.get(API_ROUTES.CURRENT_USER);
      return { data: extractApiData(response), error: null };
    } catch (error) {
      return { data: null, error: handleApiError(error, 'Failed to fetch user profile') };
    }
  },
  
  // Update user profile
  updateProfile: async (profileData: any): Promise<ApiHandlerResponse<UpdateUserProfileResponse>> => {
    try {
      const response = await apiClient.put(API_ROUTES.UPDATE_PROFILE, profileData);
      return { data: extractApiData(response), error: null };
    } catch (error) {
      return { data: null, error: handleApiError(error, 'Failed to update profile') };
    }
  },
  
  // Get user's exam results
  getResults: async (): Promise<ApiHandlerResponse<{results: UserExamResult[]}>> => {
    try {
      const response = await apiClient.get(API_ROUTES.GET_RESULTS);
      const responseData = extractApiData(response);
      
      // Standardize the results array format
      let results: UserExamResult[] = [];
      
      if (responseData) {
        if (typeof responseData === 'object' && (responseData as any).results) {
          results = Array.isArray((responseData as any).results) 
            ? (responseData as any).results 
            : [];
        } else if (Array.isArray(responseData)) {
          results = responseData;
        }
      }
      
      return { 
        data: { results }, 
        error: null 
      };
    } catch (error) {
      return { 
        data: { results: [] }, 
        error: handleApiError(error, 'Failed to fetch results') 
      };
    }
  },
  
  // Get specific result by ID
  getResultById: async (resultId: string | number): Promise<ApiHandlerResponse<any>> => {
    try {
      const response = await apiClient.get(API_ROUTES.GET_RESULT(resultId));
      
      // Log raw response for debugging
      console.log('Raw getResultById response:', response.data);
      
      const responseData = extractApiData(response);
      console.log('Extracted response data:', responseData);
      
      // Find result data in the response regardless of structure
      let rawResultData = null;
      
      if (responseData && typeof responseData === 'object') {
        // If the backend returns { result: {...} }
        if (responseData.result) {
          rawResultData = responseData.result;
        } 
        // If the backend returns the result object directly with result property
        else if (responseData.data && responseData.data.result) {
          rawResultData = responseData.data.result;
        }
        // If the backend returns the result object directly
        else if ('id' in responseData || 'score' in responseData) {
          rawResultData = responseData;
        }
      }
      
      // Use the utility function to normalize the result data
      const resultData = normalizeResultData(rawResultData, String(resultId));
      
      // Log final normalized result data
      console.log('Normalized result data:', resultData);
      
      return { data: resultData, error: null };
    } catch (error) {
      console.error('Error fetching result:', error);
      return { data: null, error: handleApiError(error, 'Failed to fetch result') };
    }
  }
};

// Create a new user-facing examApi object
export const examApi = {
  // Get exams for the authenticated user (age-appropriate)
  getExams: async (): Promise<ApiHandlerResponse<{exams: ExamSummary[]}>> => {
    try {
      const response = await apiClient.get(API_ROUTES.GET_EXAMS);
      const responseData = extractApiData(response);
      
      // Handle different response structures
      let exams: ExamSummary[] = [];
      
      if (responseData) {
        // Debug log to see the actual structure
        console.log('Raw API response structure:', responseData);
        
        // Check if exams is directly in the response
        if (responseData.exams && Array.isArray(responseData.exams)) {
          exams = responseData.exams;
        } 
        // Check if result is an array directly
        else if (Array.isArray(responseData)) {
          exams = responseData;
        }
        // Check if data contains exams array (most common backend structure)
        else if (responseData.data && Array.isArray(responseData.data)) {
          exams = responseData.data;
        }
        // Check specifically for the nested structure mentioned in the API response example
        else if (responseData.data && responseData.data.exams && Array.isArray(responseData.data.exams)) {
          exams = responseData.data.exams;
        }
        
        // Log the extracted exams
        console.log(`Found ${exams.length} exams from API response`);
      }
      
      return { 
        data: { exams }, 
        error: null 
      };
    } catch (error) {
      console.error('Failed to fetch exams:', error);
      return { 
        data: { exams: [] }, 
        error: handleApiError(error, 'Failed to fetch exams') 
      };
    }
  },

  // Get exam details by ID
  getExamById: async (examId: string | number): Promise<ApiHandlerResponse<{exam: any}>> => {
    try {
      // Validate examId is numeric before making API call
      const parsedId = parseInt(examId.toString());
      if (isNaN(parsedId) || parsedId <= 0) {
        return { 
          data: { exam: null }, 
          error: 'Invalid exam ID: must be a positive number' 
        };
      }
      
      // Log the request URL for debugging
      console.log(`Requesting exam with ID: ${parsedId} from ${API_ROUTES.GET_EXAM(parsedId)}`);
      
      const response = await apiClient.get(API_ROUTES.GET_EXAM(parsedId));
      
      // Debug log the raw response
      console.log('Raw exam API response:', response);
      
      // Get the response data structure
      const responseData = response.data;
      
      // Log the detailed structure for debugging
      console.log('Response data fields:', Object.keys(responseData));
      
      // IMPORTANT DEBUG: Log the exact structure we're receiving
      if (responseData && responseData.data) {
        console.log('Response data.data fields:', Object.keys(responseData.data));
      }
      
      // If we have a successful API response
      if (responseData && responseData.success === true) {
        // Case 1: Exam is in the data.exam property
        if (responseData.data && responseData.data.exam) {
          console.log('Found exam in responseData.data.exam');
          return { 
            data: { exam: responseData.data.exam },
            error: null 
          };
        }
        
        // Case 2: The responseData.data IS the exam object itself
        if (responseData.data && (
            responseData.data.id || 
            responseData.data.title || 
            responseData.data.questions || 
            Array.isArray(responseData.data.questions)
          )) {
          console.log('Found exam directly in the responseData.data');
          return { 
            data: { exam: responseData.data },
            error: null 
          };
        }
        
        // Case 3: Check if the raw response data might BE the exam itself
        // This is unusual but possible with certain API structures
        if (responseData.id && (responseData.title || responseData.questions)) {
          console.log('Found exam at the root level of the response');
          return {
            data: { exam: responseData },
            error: null
          };
        }
      }
      
      // If we couldn't find the exam data
      console.error('Exam data not found in API response', responseData);
      return { 
        data: { exam: null }, 
        error: 'Exam data not available in API response' 
      };
    } catch (error) {
      // Error handling remains the same
      console.error('Error fetching exam:', error);
      
      // Handle specific error cases...
      return { 
        data: { exam: null }, 
        error: handleApiError(error, 'Failed to fetch exam details') 
      };
    }
  },

  // Submit exam answers
  submitExam: async (examId: string | number, answers: any[], timeSpent: number): Promise<ApiHandlerResponse<SubmitExamResponse>> => {
    try {
      const response = await apiClient.post(API_ROUTES.SUBMIT_EXAM(examId), {
        answers,
        timeSpent
      });
      return { data: extractApiData(response), error: null };
    } catch (error) {
      return { data: null, error: handleApiError(error, 'Failed to submit exam') };
    }
  }
};

// Results API
export const resultsApi = {
  // Get user results - using the general results endpoint
  getResults: async (): Promise<ApiHandlerResponse<{results: UserExamResult[]}>> => {
    try {
      const response = await apiClient.get(API_ROUTES.GET_RESULTS);
      const responseData = extractApiData(response);
      
      // Standardize the results array format
      let results: UserExamResult[] = [];
      
      if (responseData) {
        if (typeof responseData === 'object' && (responseData as any).results) {
          results = Array.isArray((responseData as any).results) 
            ? (responseData as any).results 
            : [];
        } else if (Array.isArray(responseData)) {
          results = responseData;
        }
      }
      
      return { 
        data: { results }, 
        error: null 
      };
    } catch (error) {
      return { 
        data: { results: [] }, 
        error: handleApiError(error, 'Failed to fetch results') 
      };
    }
  },
  
  // Get result by ID
  getResultById: async (resultId: string | number): Promise<ApiHandlerResponse<any>> => {
    try {
      const response = await apiClient.get(API_ROUTES.GET_RESULT(resultId));
      
      // Log raw response for debugging
      console.log('Raw getResultById response:', response.data);
      
      const responseData = extractApiData(response);
      console.log('Extracted response data:', responseData);
      
      // Standardize the result object format regardless of the response structure
      let resultData: any = {
        id: resultId,
        score: 0,
        totalQuestions: 0,
        timeSpent: 0,
        answers: []
      };
      
      if (responseData && typeof responseData === 'object') {
        // If the backend returns { result: {...} }
        if (responseData.result) {
          console.log('Found result in responseData.result');
          resultData = responseData.result;
        } 
        // If the backend returns the result object directly with result property
        else if (responseData.data && responseData.data.result) {
          console.log('Found result in responseData.data.result');
          resultData = responseData.data.result;
        }
        // If the backend returns the result object directly
        else if ('id' in responseData || 'score' in responseData) {
          console.log('Found result in responseData directly');
          resultData = responseData;
        }
      }
      
      // Ensure numeric values are numbers
      resultData.score = Number(resultData.score) || 0;
      resultData.totalQuestions = Number(resultData.totalQuestions) || 0;
      resultData.timeSpent = Number(resultData.timeSpent) || 0;
      
      // Calculate percentage if not provided
      if (!resultData.percentage && resultData.totalQuestions > 0) {
        resultData.percentage = Math.round((resultData.score / resultData.totalQuestions) * 100);
      } else {
        resultData.percentage = Number(resultData.percentage) || 0;
      }
      
      // Make sure answers is always an array
      if (!Array.isArray(resultData.answers)) {
        resultData.answers = [];
      }
      
      // Log final normalized result data
      console.log('Normalized result data:', resultData);
      
      return { data: resultData, error: null };
    } catch (error) {
      console.error('Error fetching result:', error);
      return { data: null, error: handleApiError(error, 'Failed to fetch result') };
    }
  },
  
  // Share result
  shareResult: async (resultId: string | number, shareData = {}): Promise<ApiHandlerResponse<any>> => {
    try {
      const response = await apiClient.post(API_ROUTES.SHARE_RESULT(resultId), shareData);
      return { data: extractApiData(response), error: null };
    } catch (error) {
      return { data: null, error: handleApiError(error, 'Failed to share result') };
    }
  }
};

// Admin API
export const adminApi = {
  // Get all users
  getUsers: async (page = 1, limit = 10, search = ''): Promise<ApiHandlerResponse<any>> => {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (search) params.append('search', search);
      
      // Make sure we're using the base URL with the API endpoint
      const response = await apiClient.get(`${API_ROUTES.ADMIN_USERS}?${params.toString()}`);
      return { data: extractApiData(response), error: null };
    } catch (error) {
      return { 
        data: { 
          users: [],
          total: 0,
          page: page,
          limit: limit
        }, 
        error: handleApiError(error, 'Failed to fetch users') 
      };
    }
  },
  
  // Delete a user
  deleteUser: async (userId: string | number): Promise<ApiHandlerResponse<any>> => {
    try {
      const response = await apiClient.delete(`${API_ROUTES.ADMIN_USERS}/${userId}`);
      return { data: extractApiData(response), error: null };
    } catch (error) {
      return { data: null, error: handleApiError(error, 'Failed to delete user') };
    }
  },
  
  // Get dashboard statistics for admin
  getDashboardData: async (): Promise<ApiHandlerResponse<any>> => {
    try {
      const response = await apiClient.get(API_ROUTES.ADMIN_STATS);
      return { data: extractApiData(response), error: null };
    } catch (error) {
      return { 
        data: {
          // Provide fallback data when API fails
          totalUsers: 0,
          totalExams: 0,
          recentActivity: [],
          completedExams: 0,
          examStats: { labels: [], data: [] }
        }, 
        error: handleApiError(error, 'Failed to fetch dashboard data') 
      };
    }
  },
  
  // Get all exams (admin view)
  getExams: async (page = 1, limit = 10, sectionId?: number): Promise<ApiHandlerResponse<any>> => {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (sectionId) params.append('sectionId', sectionId.toString());
      
      const response = await apiClient.get(`${API_ROUTES.ADMIN_EXAMS}?${params.toString()}`);
      return { data: extractApiData(response), error: null };
    } catch (error) {
      return { 
        data: { 
          exams: [],
          total: 0,
          page: page,
          limit: limit
        }, 
        error: handleApiError(error, 'Failed to fetch exams') 
      };
    }
  },
  
  // Get exam by ID (admin view)
  getExamById: async (examId: string | number): Promise<ApiHandlerResponse<any>> => {
    try {
      const response = await apiClient.get(API_ROUTES.ADMIN_EXAM(examId));
      return { data: extractApiData(response), error: null };
    } catch (error) {
      return { 
        data: {
          exam: null,
          id: examId
        }, 
        error: handleApiError(error, 'Failed to fetch exam') 
      };
    }
  },
  
  // Create new exam
  createExam: async (examData: any): Promise<ApiHandlerResponse<any>> => {
    try {
      const response = await apiClient.post(API_ROUTES.ADMIN_EXAMS, examData);
      return { data: extractApiData(response), error: null };
    } catch (error) {
      return { data: null, error: handleApiError(error, 'Failed to create exam') };
    }
  },
  
  // Update exam
  updateExam: async (examId: string | number, examData: any): Promise<ApiHandlerResponse<any>> => {
    try {
      const response = await apiClient.put(API_ROUTES.ADMIN_EXAM(examId), examData);
      return { data: extractApiData(response), error: null };
    } catch (error) {
      return { data: null, error: handleApiError(error, 'Failed to update exam') };
    }
  },
  
  // Delete exam
  deleteExam: async (examId: string | number): Promise<ApiHandlerResponse<any>> => {
    try {
      const response = await apiClient.delete(API_ROUTES.ADMIN_EXAM(examId));
      return { data: extractApiData(response), error: null };
    } catch (error) {
      return { data: null, error: handleApiError(error, 'Failed to delete exam') };
    }
  },
  
  // Get admin dashboard stats
  getStats: async (): Promise<ApiHandlerResponse<any>> => {
    try {
      const response = await apiClient.get(API_ROUTES.ADMIN_STATS);
      return { data: extractApiData(response), error: null };
    } catch (error) {
      return { 
        data: {
          // Fallback data when the API fails
          totalUsers: 0,
          totalExams: 0, 
          completedExams: 0,
          recentActivity: []
        }, 
        error: handleApiError(error, 'Failed to fetch stats') 
      };
    }
  },
  
  // Get all sections (admin view)
  getSections: async (): Promise<ApiHandlerResponse<any>> => {
    try {
      const response = await apiClient.get(API_ROUTES.ADMIN_SECTIONS);
      return { data: extractApiData(response), error: null };
    } catch (error) {
      return { 
        data: { sections: [] }, 
        error: handleApiError(error, 'Failed to fetch sections') 
      };
    }
  },
  
  // Create new section
  createSection: async (sectionData: any): Promise<ApiHandlerResponse<any>> => {
    try {
      const response = await apiClient.post(API_ROUTES.ADMIN_SECTIONS, sectionData);
      return { data: extractApiData(response), error: null };
    } catch (error) {
      return { data: null, error: handleApiError(error, 'Failed to create section') };
    }
  },
  
  // Update section
  updateSection: async (sectionId: string | number, sectionData: any): Promise<ApiHandlerResponse<any>> => {
    try {
      const response = await apiClient.put(API_ROUTES.ADMIN_SECTION(sectionId), sectionData);
      return { data: extractApiData(response), error: null };
    } catch (error) {
      return { data: null, error: handleApiError(error, 'Failed to update section') };
    }
  },
  
  // Delete section
  deleteSection: async (sectionId: string | number): Promise<ApiHandlerResponse<any>> => {
    try {
      const response = await apiClient.delete(API_ROUTES.ADMIN_SECTION(sectionId));
      return { data: extractApiData(response), error: null };
    } catch (error) {
      return { data: null, error: handleApiError(error, 'Failed to delete section') };
    }
  }
};

// Sections API (public part)
export const sectionsApi = {
  // Get all sections
  getSections: async (): Promise<ApiHandlerResponse<{sections: any[]}>> => {
    try {
      const response = await apiClient.get(API_ROUTES.GET_SECTIONS);
      const responseData = extractApiData(response);
      
      // Ensure we're returning a valid object with a sections array
      let sections: any[] = [];
      
      if (responseData && typeof responseData === 'object') {
        if ((responseData as any).sections && Array.isArray((responseData as any).sections)) {
          sections = (responseData as any).sections;
        } else if (Array.isArray(responseData)) {
          sections = responseData;
        }
      }
      
      return { 
        data: { sections }, 
        error: null 
      };
    } catch (error) {
      return { 
        data: { sections: [] }, 
        error: handleApiError(error, 'Failed to fetch sections') 
      };
    }
  }
};

/**
 * Standardized API response handler for consistent backend response processing
 * @param response API response object
 * @param defaultErrorMessage Default error message
 * @returns Standardized response object
 */
export const handleStandardizedResponse = (
  response: any, 
  defaultErrorMessage = 'An unexpected error occurred'
): {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
} => {
  // Handle null/undefined response
  if (!response) {
    return {
      success: false,
      error: defaultErrorMessage
    };
  }

  // Handle predefined format
  if (typeof response.success === 'boolean') {
    return {
      success: response.success,
      data: response.data,
      error: response.error,
      message: response.message
    };
  }

  // Handle backend success responses that may not follow our structure
  if (response.success === true) {
    return {
      success: true,
      data: response.data || response,
      message: response.message
    };
  }

  // Handle HTTP success status
  if (response.status && response.status >= 200 && response.status < 300) {
    return {
      success: true,
      data: response.data || response,
      message: response.statusText
    };
  }

  // Handle error responses
  if (response.error || response.message) {
    return {
      success: false,
      error: response.error || response.message
    };
  }

  // Default data handling
  if (response.data !== undefined) {
    return {
      success: true,
      data: response.data
    };
  }

  // Fallback for all other cases
  return {
    success: true,
    data: response
  };
};

/**
 * Create a standardized API client instance with proper error handling
 * This is the recommended way to make API requests throughout the application
 */
export const api = (() => {
  // Create a base client with the correct backend URL
  const axiosInstance = axios.create({
    baseURL: API_ROUTES.BASE_URL, // This is already set to 'https://acs-backend-2bvr.onrender.com/api'
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    withCredentials: true, // Enable credentials for authentication
    timeout: 30000, // 30 second timeout
  });

  // Add request interceptor for auth token
  axiosInstance.interceptors.request.use((config) => {
    // Determine if request is for admin routes
    const isAdminRoute = config.url?.includes('/admin');
    
    // Get auth data from appropriate storage
    const authData = localStorage.getItem(isAdminRoute ? STORAGE.ADMIN_DATA : STORAGE.USER_DATA);
    
    if (authData) {
      try {
        const parsedData = JSON.parse(authData);
        if (parsedData.token) {
          config.headers.Authorization = `Bearer ${parsedData.token}`;
        }
      } catch (error) {
        console.error('Failed to parse auth data:', error);
      }
    }
    
    return config;
  });

  // Add response interceptor for standardized error handling
  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      // Handle API errors consistently
      if (error.response) {
        // Format field errors if present
        const fieldErrors = error.response.data?.fieldErrors || {};
        
        // Log the error with context
        console.error(
          `API Error (${error.response.status}): ${error.response.data?.message || error.message}`, 
          { url: error.config?.url, data: error.response.data }
        );
        
        // Handle unauthorized errors (expired token, etc.)
        if (error.response.status === 401) {
          // Clear auth data to force re-login
          localStorage.removeItem(STORAGE.USER_DATA);
          localStorage.removeItem(STORAGE.ADMIN_DATA);
          
          // Redirect to login
          if (window.location.pathname.includes('/admin')) {
            window.location.href = '/admin/login';
          } else {
            window.location.href = '/login';
          }
        }
        
        // Display user-friendly error notifications
        displayErrorNotification(error.response.data?.message || 'An error occurred', fieldErrors);
      } else if (error.request) {
        // Network error - request made but no response
        console.error('Network Error: No response received from server', error.request);
        displayErrorNotification('Network Error: Could not connect to the server. Please check your internet connection.');
      } else {
        // Request setup error
        console.error('Request Error:', error.message);
        displayErrorNotification('An unexpected error occurred. Please try again.');
      }
      
      // Continue throwing the error for components to handle
      return Promise.reject({
        message: error.response?.data?.message || error.message || 'An unexpected error occurred',
        status: error.response?.status,
        fieldErrors: error.response?.data?.fieldErrors || {},
        details: error.response?.data?.details || {},
        originalError: error
      });
    }
  );
  
  // Return wrapped functions
  return {
    /**
     * Make a GET request to the API
     */
    async get<T = any>(url: string, params?: Record<string, any>): Promise<T> {
      const response = await axiosInstance.get<ApiResponse<T>>(url, { params });
      return response.data.data;
    },
    
    /**
     * Make a POST request to the API
     */
    async post<T = any>(url: string, data?: any): Promise<T> {
      const response = await axiosInstance.post<ApiResponse<T>>(url, data);
      return response.data.data;
    },
    
    /**
     * Make a PUT request to the API
     */
    async put<T = any>(url: string, data?: any): Promise<T> {
      const response = await axiosInstance.put<ApiResponse<T>>(url, data);
      return response.data.data;
    },
    
    /**
     * Make a DELETE request to the API
     */
    async delete<T = any>(url: string): Promise<T> {
      const response = await axiosInstance.delete<ApiResponse<T>>(url);
      return response.data.data;
    },
    
    /**
     * Access the underlying axios instance (for advanced usage)
     */
    instance: axiosInstance
  };
})();