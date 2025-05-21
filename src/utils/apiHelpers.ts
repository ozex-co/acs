import axios from 'axios';
import { API, STORAGE } from './constants';

/**
 * Makes an authenticated API request with proper error handling
 * This is a fallback utility for when the main API client experiences issues
 */
export const makeAuthRequest = async (
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
    
    // Build URL
    const url = `${API.BASE_URL}${apiEndpoint}`;
    
    // Common config
    const config = {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      }
    };
    
    console.log(`Making ${method.toUpperCase()} request to: ${url}`);
    
    let response;
    
    // Make appropriate request based on method
    if (method === 'get' || method === 'delete') {
      response = await axios[method](url, config);
    } else {
      response = await axios[method](url, data, config);
    }
    
    console.log(`${method.toUpperCase()} ${url} succeeded with status: ${response.status}`);
    
    return { 
      data: response.data, 
      error: null 
    };
  } catch (error: any) {
    console.error(`Error in ${method.toUpperCase()} request to ${endpoint}:`, error);
    
    // Log detailed error info
    if (error.response) {
      console.error(`Response status: ${error.response.status} (${error.response.statusText})`);
      console.error('Response data:', error.response.data);
      
      // Handle validation errors specifically
      if (error.response.status === 400 || error.response.status === 500) {
        if (error.response.data.fieldErrors) {
          const fieldErrors = error.response.data.fieldErrors;
          console.error('Field validation errors:', fieldErrors);
          
          // Construct a more readable error message
          let validationMessage = 'Validation errors:';
          for (const [field, message] of Object.entries(fieldErrors)) {
            validationMessage += `\n- ${field}: ${message}`;
          }
          
          return {
            data: null,
            error: validationMessage,
            fieldErrors: fieldErrors
          };
        }
        
        // Handle backend validation errors that use the 'details' format
        if (error.response.data.details && Array.isArray(error.response.data.details)) {
          console.error('Validation details:', error.response.data.details);
          console.log('Full validation error response:', JSON.stringify(error.response.data, null, 2));
          
          // Log each detail for debugging
          error.response.data.details.forEach((detail: any, index: number) => {
            console.log(`Detail ${index}:`, detail);
            if (detail.field) {
              console.log(`Field: ${detail.field}, Message: ${detail.message}`);
            }
          });
          
          // Convert the details array into a fieldErrors object
          const fieldErrors: Record<string, string> = {};
          error.response.data.details.forEach((detail: any) => {
            if (detail.field) {
              fieldErrors[detail.field] = detail.message || 'Validation error';
            }
          });
          
          // Construct a readable error message
          let validationMessage = 'Validation errors:';
          for (const [field, message] of Object.entries(fieldErrors)) {
            validationMessage += `\n- ${field}: ${message}`;
          }
          
          return {
            data: null,
            error: error.response.data.message || 'Validation failed',
            fieldErrors: fieldErrors,
            details: error.response.data.details
          };
        }
      }
      
      // Handle specific HTTP errors
      if (error.response.status === 404) {
        console.error(`Endpoint not found: ${endpoint} - Please check if the API route exists on the server`);
        return {
          data: null,
          error: `API endpoint not found (404): ${endpoint}. The requested resource may have been moved or removed.`
        };
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from server. Network issue or server down.');
    } else {
      // Something happened in setting up the request
      console.error('Error setting up request:', error.message);
    }
    
    const errorMessage = error.response?.data?.message || 
                        `Request failed: ${error.message || 'Unknown error'}`;
    
    return { 
      data: null, 
      error: errorMessage,
      statusCode: error.response?.status
    };
  }
};

/**
 * Utility functions for common API operations
 */
export const apiUtils = {
  /**
   * Get all exams with proper error handling
   */
  getExams: async () => {
    try {
      const response = await makeAuthRequest('get', '/api/admin/exams');
      
      // Add detailed logging to debug the response
      console.log('getExams API raw response:', response);
      
      // If there's an error, return it
      if (response.error) {
        return response;
      }
      
      // Process the response to handle different formats
      let processedResponse = { ...response };
      
      // If response.data exists but doesn't have an exams property
      if (response.data && !response.data.exams) {
        // Check if response.data is an array of exams directly
        if (Array.isArray(response.data)) {
          processedResponse.data = { exams: response.data };
          console.log('Processed array response into:', processedResponse);
        }
        // Check if response.data.data exists (nested data structure)
        else if (response.data.data) {
          if (Array.isArray(response.data.data)) {
            // If data.data is an array, treat it as exams
            processedResponse.data = { exams: response.data.data };
            console.log('Processed nested array response into:', processedResponse);
          } else if (response.data.data.exams && Array.isArray(response.data.data.exams)) {
            // If data.data.exams is an array, extract it
            processedResponse.data = { exams: response.data.data.exams };
            console.log('Processed deeply nested exams array into:', processedResponse);
          }
        }
      }
      
      return processedResponse;
    } catch (error) {
      console.error('Error in getExams:', error);
      return { data: null, error: error.message || 'Failed to fetch exams' };
    }
  },
  
  /**
   * Create a new exam
   */
  createExam: (examData: any) => {
    // Use the specialized examsApi method for proper formatting
    return examsApi.createExam(examData);
  },
  
  /**
   * Delete an exam
   */
  deleteExam: (examId: string | number) => makeAuthRequest('delete', `/api/admin/exams/${examId}`),
  
  /**
   * Get all sections 
   */
  getSections: () => makeAuthRequest('get', '/api/admin/sections'),
  
  /**
   * Create a new section
   */
  createSection: (data: any) => makeAuthRequest('post', '/api/admin/sections', data),
  
  /**
   * Update an existing section
   */
  updateSection: (id: string | number, data: any) => 
    makeAuthRequest('put', `/api/admin/sections/${id}`, data),
  
  /**
   * Delete a section
   */
  deleteSection: (id: string | number) => 
    makeAuthRequest('delete', `/api/admin/sections/${id}`)
};

// Add examsApi from AdminCreateExamPage.tsx 
// Direct API handlers for exams to ensure proper formatting
export const examsApi = {
  // Create a new exam with proper question formatting
  createExam: async (examData: any) => {
    try {
      // Get auth token
      const userData = localStorage.getItem(STORAGE.ADMIN_DATA);
      let token = '';
      
      if (userData) {
        const parsed = JSON.parse(userData);
        token = parsed.token || '';
      }
      
      // Log the request payload for debugging
      console.log('Sending exam data to server:', JSON.stringify(examData, null, 2));
      
      // Make direct axios request with proper headers
      const response = await axios.post(
        `${API.BASE_URL}/api/admin/exams`, 
        examData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          }
        }
      );
      
      // Check for different response formats
      console.log('Response from server:', response);
      
      if (response.status === 201 || response.status === 200) {
        // Success - could have different formats
        const responseData = response.data;
        
        // Check if the data is wrapped in a success field
        if (responseData.success && responseData.data) {
          return { 
            data: responseData.data, 
            error: null 
          };
        }
        
        // Check for direct exam field
        if (responseData.exam) {
          return { 
            data: { exam: responseData.exam }, 
            error: null 
          };
        }
        
        // Just return the whole response as data
        return { 
          data: responseData, 
          error: null 
        };
      }
      
      // If we got here, something went wrong
      return { 
        data: null, 
        error: response.data?.message || 'Unknown error'
      };
    } catch (error: any) {
      console.error('Error in createExam:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create exam';
      return { 
        data: null, 
        error: errorMessage 
      };
    }
  },
  
  // Get all exams
  getExams: async () => {
    try {
      // Get auth token
      const userData = localStorage.getItem(STORAGE.ADMIN_DATA);
      let token = '';
      
      if (userData) {
        const parsed = JSON.parse(userData);
        token = parsed.token || '';
      }
      
      // Make direct axios request
      const response = await axios.get(
        `${API.BASE_URL}/api/admin/exams`, 
        {
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        }
      );
      
      return { 
        data: response.data, 
        error: null 
      };
    } catch (error: any) {
      console.error('Error in getExams:', error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch exams';
      return { 
        data: { exams: [] }, 
        error: errorMessage 
      };
    }
  },
  
  // Delete an exam
  deleteExam: async (examId: string | number) => {
    try {
      // Get auth token
      const userData = localStorage.getItem(STORAGE.ADMIN_DATA);
      let token = '';
      
      if (userData) {
        const parsed = JSON.parse(userData);
        token = parsed.token || '';
      }
      
      // Make direct axios request
      const response = await axios.delete(
        `${API.BASE_URL}/api/admin/exams/${examId}`, 
        {
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        }
      );
      
      return { 
        data: response.data, 
        error: null 
      };
    } catch (error: any) {
      console.error('Error in deleteExam:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete exam';
      return { 
        data: null, 
        error: errorMessage 
      };
    }
  }
};

// Storage keys for authentication data
const AUTH_STORAGE_KEYS = {
  AUTH_TOKEN: 'qozex_auth_token',
  IS_ADMIN: 'qozex_is_admin',
  TOKEN_EXPIRATION: 'qozex_token_expiration'
};

/**
 * Store token in all the appropriate places to ensure consistency
 * 
 * @param token The authentication token to store
 * @param isAdmin Whether this is an admin token
 */
export function storeAuthToken(token: string, isAdmin: boolean = false): void {
  // Store token directly for API client to use
  localStorage.setItem(AUTH_STORAGE_KEYS.AUTH_TOKEN, token);
  
  // Mark whether this is an admin token
  localStorage.setItem(AUTH_STORAGE_KEYS.IS_ADMIN, isAdmin ? 'true' : 'false');
  
  // Try to store in the appropriate user/admin data object too, if it exists
  const storageKey = isAdmin ? STORAGE.ADMIN_DATA : STORAGE.USER_DATA;
  const userData = localStorage.getItem(storageKey);
  
  if (userData) {
    try {
      const parsedData = JSON.parse(userData);
      parsedData.token = token;
      localStorage.setItem(storageKey, JSON.stringify(parsedData));
    } catch (e) {
      console.error('Failed to update token in user/admin data:', e);
    }
  }
  
  // Store token expiration if it's a JWT
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp) {
      // JWT exp is in seconds, convert to milliseconds
      const expTime = payload.exp * 1000;
      localStorage.setItem(AUTH_STORAGE_KEYS.TOKEN_EXPIRATION, expTime.toString());
    }
  } catch (e) {
    console.error('Failed to extract token expiration:', e);
  }
}

/**
 * Check if the stored authentication token is valid and not expired
 * 
 * @returns True if the user has a valid token
 */
export function hasValidAuthToken(): boolean {
  // Get the stored token
  const token = localStorage.getItem(AUTH_STORAGE_KEYS.AUTH_TOKEN);
  
  // If no token, user is not authenticated
  if (!token) {
    return false;
  }
  
  // Check expiration if stored
  const expiration = localStorage.getItem(AUTH_STORAGE_KEYS.TOKEN_EXPIRATION);
  if (expiration) {
    const expirationTime = parseInt(expiration, 10);
    // Return false if expired
    if (Date.now() > expirationTime) {
      return false;
    }
  }
  
  // If we have a token and it's not expired (or no expiration is stored)
  return true;
}

/**
 * Enhanced function to extract auth token from any response format
 * 
 * This handles all the various ways a backend might return a token:
 * - In the token field
 * - Nested in data.token
 * - Nested in data.admin.token or data.user.token
 * - Named as accessToken or access_token
 * 
 * @param response Any API response object
 * @returns The token string if found, undefined otherwise
 */
export function extractTokenFromResponse(response: any): string | undefined {
  if (!response) return undefined;
  
  // Try to normalize the response if it has an axios structure
  const responseData = response.data || response;
  
  // Track all the places we've looked
  const searchLocations: string[] = [];
  
  // Start with the most likely locations
  
  // 1. Direct token property on responseData
  if (responseData.token) {
    console.log('Found token in responseData.token');
    return responseData.token;
  }
  searchLocations.push('responseData.token');
  
  // 2. Inside data.token (common format)
  if (responseData.data?.token) {
    console.log('Found token in responseData.data.token');
    return responseData.data.token;
  }
  searchLocations.push('responseData.data.token');
  
  // 3. Inside data.admin.token
  if (responseData.data?.admin?.token) {
    console.log('Found token in responseData.data.admin.token');
    return responseData.data.admin.token;
  }
  searchLocations.push('responseData.data.admin.token');
  
  // 4. Inside data.user.token
  if (responseData.data?.user?.token) {
    console.log('Found token in responseData.data.user.token');
    return responseData.data.user.token;
  }
  searchLocations.push('responseData.data.user.token');
  
  // 5. Inside admin.token
  if (responseData.admin?.token) {
    console.log('Found token in responseData.admin.token');
    return responseData.admin.token;
  }
  searchLocations.push('responseData.admin.token');
  
  // 6. Inside user.token
  if (responseData.user?.token) {
    console.log('Found token in responseData.user.token');
    return responseData.user.token;
  }
  searchLocations.push('responseData.user.token');
  
  // 7. Alternative token property names
  if (responseData.accessToken) {
    console.log('Found token in responseData.accessToken');
    return responseData.accessToken;
  }
  searchLocations.push('responseData.accessToken');
  
  if (responseData.access_token) {
    console.log('Found token in responseData.access_token');
    return responseData.access_token;
  }
  searchLocations.push('responseData.access_token');
  
  if (responseData.data?.accessToken) {
    console.log('Found token in responseData.data.accessToken');
    return responseData.data.accessToken;
  }
  searchLocations.push('responseData.data.accessToken');
  
  if (responseData.data?.access_token) {
    console.log('Found token in responseData.data.access_token');
    return responseData.data.access_token;
  }
  searchLocations.push('responseData.data.access_token');
  
  // Log all places we looked if in development
  console.log('Token not found in any standard location. Places checked:', searchLocations);
  
  // If token wasn't found in standard locations but we have a successful response,
  // log the entire structure to help debug
  if (responseData.success === true) {
    console.log('Response was successful but token not found. Full responseData:', responseData);
  }
  
  return undefined;
} 