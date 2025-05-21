import { ApiError } from '../types';

/**
 * Error messages by error code
 */
const DEFAULT_ERROR_MESSAGES: Record<string, string> = {
  NETWORK_ERROR: 'فشل الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت.',
  UNAUTHORIZED: 'يجب تسجيل الدخول للوصول إلى هذه الصفحة.',
  FORBIDDEN: 'ليس لديك صلاحية للوصول إلى هذا المورد.',
  NOT_FOUND: 'المورد المطلوب غير موجود.',
  VALIDATION_ERROR: 'هناك خطأ في البيانات المدخلة. يرجى التحقق منها وإعادة المحاولة.',
  INTERNAL_SERVER_ERROR: 'حدث خطأ في الخادم. يرجى المحاولة مرة أخرى لاحقًا.',
  UNKNOWN_ERROR: 'حدث خطأ غير معروف. يرجى المحاولة مرة أخرى.',
};

/**
 * Get a user-friendly error message from an API error
 */
export const getErrorMessage = (error: ApiError | Error | unknown): string => {
  if (!error) {
    return DEFAULT_ERROR_MESSAGES.UNKNOWN_ERROR;
  }
  
  // API Error
  if (typeof error === 'object' && error !== null && 'code' in error && 'message' in error) {
    const apiError = error as ApiError;
    return apiError.message || DEFAULT_ERROR_MESSAGES[apiError.code || 'UNKNOWN_ERROR'] || DEFAULT_ERROR_MESSAGES.UNKNOWN_ERROR;
  }
  
  // Standard Error
  if (error instanceof Error) {
    return error.message || DEFAULT_ERROR_MESSAGES.UNKNOWN_ERROR;
  }
  
  // String error
  if (typeof error === 'string') {
    return error;
  }
  
  // Unknown error type
  return DEFAULT_ERROR_MESSAGES.UNKNOWN_ERROR;
};

/**
 * Check if error is an unauthorized error
 */
export const isUnauthorizedError = (error: ApiError | Error | unknown): boolean => {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const apiError = error as ApiError;
    return apiError.code === 'UNAUTHORIZED';
  }
  return false;
};

/**
 * Check if error is a validation error
 */
export const isValidationError = (error: ApiError | Error | unknown): boolean => {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const apiError = error as ApiError;
    return apiError.code === 'VALIDATION_ERROR';
  }
  return false;
};

/**
 * Get field errors from a validation error
 */
export const getFieldErrors = (error: ApiError | Error | unknown): Record<string, string[]> => {
  if (typeof error === 'object' && error !== null && 'fieldErrors' in error && error.fieldErrors) {
    return (error as ApiError).fieldErrors || {};
  }
  return {};
};

/**
 * Format validation errors for display
 */
export const formatValidationErrors = (fieldErrors: Record<string, string[]>): string => {
  const errorMessages: string[] = [];
  
  Object.entries(fieldErrors).forEach(([field, messages]) => {
    messages.forEach(message => {
      errorMessages.push(`${field}: ${message}`);
    });
  });
  
  return errorMessages.join('\n');
}; 