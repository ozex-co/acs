import axios, { AxiosError } from 'axios';
import logger from './logger';

/**
 * Error code constants
 */
export enum ErrorCodes {
  // Authentication errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  
  // Resource errors
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  
  // Server errors
  SERVER_ERROR = 'SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  
  // Application specific errors  
  EXAM_ALREADY_SUBMITTED = 'EXAM_ALREADY_SUBMITTED',
  USER_NOT_ELIGIBLE = 'USER_NOT_ELIGIBLE',
  
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  REQUEST_TIMEOUT = 'REQUEST_TIMEOUT'
}

/**
 * Generic error interface
 */
export interface AppError {
  message: string;
  code: ErrorCodes | string;
  details?: Record<string, any>;
  fieldErrors?: Record<string, string>;
  original?: any;
}

/**
 * Extract error details from an API error
 */
export function parseApiError(error: any): AppError {
  // Default error object
  const defaultError: AppError = {
    message: 'حدث خطأ غير متوقع',
    code: ErrorCodes.SERVER_ERROR
  };
  
  // If no error was provided
  if (!error) {
    return defaultError;
  }
  
  // Handle Axios errors with response data
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<any>;
    
    // Network error
    if (axiosError.code === 'ECONNABORTED') {
      return {
        message: 'انتهت مهلة الاتصال',
        code: ErrorCodes.REQUEST_TIMEOUT
      };
    }
    
    if (axiosError.code === 'ERR_NETWORK') {
      return {
        message: 'فشل الاتصال بالخادم، تحقق من اتصالك بالإنترنت',
        code: ErrorCodes.NETWORK_ERROR
      };
    }
    
    // If we have a response with error data
    if (axiosError.response?.data) {
      const responseData = axiosError.response.data;
      
      // Handle standard API error format
      if (responseData.message) {
        return {
          message: responseData.message,
          code: responseData.code || `HTTP_${axiosError.response.status}`,
          details: responseData.details,
          fieldErrors: responseData.fieldErrors || responseData.errors,
          original: axiosError
        };
      }
      
      // Handle legacy error formats
      return {
        message: responseData.error || responseData.message || 'حدث خطأ غير متوقع',
        code: responseData.code || `HTTP_${axiosError.response.status}`,
        details: responseData.details,
        original: axiosError
      };
    }
    
    // Generic HTTP error based on status
    if (axiosError.response) {
      return {
        message: getHttpStatusMessage(axiosError.response.status),
        code: `HTTP_${axiosError.response.status}`,
        original: axiosError
      };
    }
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return {
      message: error,
      code: ErrorCodes.SERVER_ERROR
    };
  }
  
  // Handle Error objects
  if (error instanceof Error) {
    return {
      message: error.message,
      code: ErrorCodes.SERVER_ERROR,
      original: error
    };
  }
  
  // Handle object-like errors
  if (typeof error === 'object') {
    return {
      message: error.message || error.error || 'حدث خطأ غير متوقع',
      code: error.code || ErrorCodes.SERVER_ERROR,
      details: error.details,
      fieldErrors: error.fieldErrors,
      original: error
    };
  }
  
  // Fallback to default error
  return defaultError;
}

/**
 * Get message based on HTTP status code
 */
function getHttpStatusMessage(status: number): string {
  switch (status) {
    case 400:
      return 'طلب غير صحيح';
    case 401:
      return 'يرجى تسجيل الدخول للمتابعة';
    case 403:
      return 'غير مصرح لك بالوصول';
    case 404:
      return 'لم يتم العثور على المورد المطلوب';
    case 405:
      return 'الطريقة غير مسموح بها';
    case 408:
      return 'انتهت مهلة الطلب';
    case 409:
      return 'تعارض في البيانات';
    case 422:
      return 'بيانات غير صالحة';
    case 429:
      return 'عدد كبير من الطلبات، يرجى المحاولة لاحقًا';
    case 500:
      return 'خطأ في الخادم الداخلي';
    case 502:
      return 'البوابة غير صالحة';
    case 503:
      return 'الخدمة غير متوفرة';
    case 504:
      return 'انتهت مهلة البوابة';
    default:
      return status >= 500 
        ? 'حدث خطأ في الخادم' 
        : 'حدث خطأ في الطلب';
  }
}

/**
 * Display error notifications
 */
export function displayErrorNotification(error: any) {
  const parsedError = parseApiError(error);
  
  // Log error to the console and any monitoring tools
  logger.error(parsedError, 'Application Error');
  
  // Here you would integrate with your notification system
  // For example, with react-toastify:
  // toast.error(parsedError.message);
  
  // Or with a custom notification context
  // showNotification({ type: 'error', message: parsedError.message });
  
  return parsedError;
}

/**
 * Format field errors for forms
 */
export function formatFieldErrors(error: any): Record<string, string> {
  const parsedError = parseApiError(error);
  
  if (parsedError.fieldErrors) {
    return parsedError.fieldErrors;
  }
  
  return {};
}

/**
 * Set up global error handlers for uncaught exceptions and promise rejections
 */
export function setupGlobalErrorHandlers() {
  // Handle uncaught exceptions
  window.addEventListener('error', (event) => {
    logger.error(event.error || event, 'Uncaught exception');
    
    // Optionally display a user-friendly error notification
    displayErrorNotification(event.error || event.message);
    
    // Don't prevent default handling
    return false;
  });
  
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logger.error(event.reason, 'Unhandled promise rejection');
    
    // Optionally display a user-friendly error notification
    displayErrorNotification(event.reason);
    
    // Don't prevent default handling
    return false;
  });
  
  // Log that error handlers have been initialized
  logger.info('Global error handlers initialized');
}

export default {
  parseApiError,
  displayErrorNotification,
  formatFieldErrors,
  setupGlobalErrorHandlers,
  ErrorCodes
}; 