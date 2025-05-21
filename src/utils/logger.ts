/**
 * Logger utility for API requests, responses, and errors
 */

// Hardcode the production flag
const isProduction = false; // Set to true for production environment
// Define log level type
type LogLevel = 'debug' | 'info' | 'warn' | 'error';
// Set default log level
const LOG_LEVEL: LogLevel = isProduction ? 'error' : 'debug'; // Only show errors in production

// Display colors for different log types
const LOG_COLORS = {
  request: '#2563eb', // blue
  response: '#16a34a', // green
  error: '#dc2626',   // red
  info: '#0891b2',    // cyan
  warn: '#d97706',    // amber
};

// Function to check if logging should be performed based on level
const shouldLog = (level: LogLevel): boolean => {
  // Convert to string for comparison to avoid type errors
  const currentLevel = LOG_LEVEL as string;
  const checkLevel = level as string;
  
  if (currentLevel === 'debug') return true;
  if (currentLevel === 'info') return checkLevel !== 'debug';
  if (currentLevel === 'warn') return checkLevel === 'warn' || checkLevel === 'error';
  if (currentLevel === 'error') return checkLevel === 'error';
  return false;
};

/**
 * 
 * Log API request details
 */
export const logRequest = (
  url: string,
  method: string,
  data?: any,
  headers?: any
): void => {
  if (!shouldLog('debug')) return;

  console.group(`%c🔄 API Request: ${method} ${url}`, `color: ${LOG_COLORS.request}; font-weight: bold;`);
  console.log('Time:', new Date().toISOString());
  console.log('Method:', method);
  console.log('URL:', url);
  
  if (data) {
    console.log('Request Data:', data);
  }
  
  if (headers) {
    console.log('Headers:', headers);
  }
  
  console.groupEnd();
};

/**
 * Log API response details
 */
export const logResponse = (
  url: string,
  method: string,
  status: number,
  data: any,
  duration: number
): void => {
  if (!shouldLog('debug')) return;

  const isSuccess = status >= 200 && status < 300;
  const logColor = isSuccess ? LOG_COLORS.response : LOG_COLORS.error;
  const icon = isSuccess ? '✅' : '❌';

  console.group(`%c${icon} API Response: ${method} ${url} (${status})`, `color: ${logColor}; font-weight: bold;`);
  console.log('Time:', new Date().toISOString());
  console.log('Status:', status);
  console.log('Duration:', `${duration}ms`);
  console.log('Response Data:', data);
  console.groupEnd();
};

/**
 * Log application errors
 */
export const logError = (error: any, context?: string): void => {
  if (!shouldLog('error')) return;

  console.group(`%c❌ Error${context ? ` in ${context}` : ''}`, `color: ${LOG_COLORS.error}; font-weight: bold;`);
  console.log('Time:', new Date().toISOString());
  
  if (error.isApiError) {
    console.log('API Error:', {
      message: error.message,
      code: error.code,
      status: error.status,
      details: error.details,
      fieldErrors: error.fieldErrors
    });
  } else if (error instanceof Error) {
    console.log('Error:', error.message);
    console.log('Stack:', error.stack);
  } else {
    console.log('Error:', error);
  }
  
  console.groupEnd();
};

/**
 * Log generic info messages
 */
export const logInfo = (message: string, data?: any): void => {
  if (!shouldLog('info')) return;

  console.group(`%cℹ️ Info: ${message}`, `color: ${LOG_COLORS.info}; font-weight: bold;`);
  console.log('Time:', new Date().toISOString());
  
  if (data) {
    console.log('Data:', data);
  }
  
  console.groupEnd();
};

/**
 * Log warning messages
 */
export const logWarning = (message: string, data?: any): void => {
  if (!shouldLog('warn')) return;

  console.group(`%c⚠️ Warning: ${message}`, `color: ${LOG_COLORS.warn}; font-weight: bold;`);
  console.log('Time:', new Date().toISOString());
  
  if (data) {
    console.log('Data:', data);
  }
  
  console.groupEnd();
};

// Default export with all logging functions
export default {
  request: logRequest,
  response: logResponse,
  error: logError,
  info: logInfo,
  warning: logWarning
}; 