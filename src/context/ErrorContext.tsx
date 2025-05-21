import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export type ErrorType = 'error' | 'warning' | 'info';

interface ErrorData {
  message: string;
  type: ErrorType;
  id: string;
  timeout?: number | null;
}

interface ErrorContextProps {
  errors: ErrorData[];
  showError: (message: string, type?: ErrorType, timeout?: number | null) => string;
  clearError: (id: string) => void;
  clearAllErrors: () => void;
}

const ErrorContext = createContext<ErrorContextProps>({
  errors: [],
  showError: () => '',
  clearError: () => {},
  clearAllErrors: () => {},
});

interface ErrorProviderProps {
  children: ReactNode;
}

export const ErrorProvider: React.FC<ErrorProviderProps> = ({ children }) => {
  const [errors, setErrors] = useState<ErrorData[]>([]);

  // Generate a unique ID for each error
  const generateId = useCallback(() => {
    return `error-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }, []);

  // Show error with specified type and timeout
  const showError = useCallback((
    message: string, 
    type: ErrorType = 'error', 
    timeout: number | null = 5000
  ) => {
    const id = generateId();
    const newError: ErrorData = {
      message,
      type,
      id,
      timeout
    };
    
    setErrors(prev => [...prev, newError]);
    return id;
  }, [generateId]);

  // Clear a specific error by ID
  const clearError = useCallback((id: string) => {
    setErrors(prev => prev.filter(error => error.id !== id));
  }, []);

  // Clear all errors
  const clearAllErrors = useCallback(() => {
    setErrors([]);
  }, []);

  // Auto-timeout long-running errors
  React.useEffect(() => {
    const timeoutCheck = setInterval(() => {
      const now = Date.now();
      setErrors(prev => 
        prev.filter(error => {
          if (error.timeout && error.timeout > 0) {
            const timeoutTime = parseInt(error.id.split('-')[1]) + error.timeout;
            return now < timeoutTime;
          }
          return true;
        })
      );
    }, 1000);

    return () => clearInterval(timeoutCheck);
  }, []);

  return (
    <ErrorContext.Provider
      value={{
        errors,
        showError,
        clearError,
        clearAllErrors,
      }}
    >
      {children}
    </ErrorContext.Provider>
  );
};

// Custom hook for using error context
export const useError = () => useContext(ErrorContext);

// Utility function for easier error handling in components
export const useErrorHandler = () => {
  const { showError } = useError();
  
  return {
    handleError: (error: unknown, fallbackMessage = 'حدث خطأ غير متوقع') => {
      const errorMessage = error instanceof Error ? error.message : fallbackMessage;
      showError(errorMessage, 'error');
    },
    showWarning: (message: string, timeout = 4000) => {
      showError(message, 'warning', timeout);
    },
    showInfo: (message: string, timeout = 3000) => {
      showError(message, 'info', timeout);
    },
    showSuccess: (message: string, timeout = 3000) => {
      showError(message, 'info', timeout);
    }
  };
}; 