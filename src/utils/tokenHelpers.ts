import { STORAGE } from './constants';

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

/**
 * Check if the stored authentication token is valid and not expired
 * 
 * @returns True if the user has a valid token
 */
export function hasValidAuthToken(): boolean {
  // Get the stored token
  const token = localStorage.getItem(STORAGE.AUTH_TOKEN);
  
  // If no token, user is not authenticated
  if (!token) {
    return false;
  }
  
  // Check expiration if stored
  const expiration = localStorage.getItem(STORAGE.TOKEN_EXPIRATION);
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
 * Store token in all the appropriate places to ensure consistency
 * 
 * @param token The authentication token to store
 * @param isAdmin Whether this is an admin token
 */
export function storeAuthToken(token: string, isAdmin: boolean = false): void {
  // Store token directly for API client to use
  localStorage.setItem(STORAGE.AUTH_TOKEN, token);
  
  // Mark whether this is an admin token
  localStorage.setItem(STORAGE.IS_ADMIN, isAdmin ? 'true' : 'false');
  
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
      localStorage.setItem(STORAGE.TOKEN_EXPIRATION, expTime.toString());
    }
  } catch (e) {
    console.error('Failed to extract token expiration:', e);
  }
} 