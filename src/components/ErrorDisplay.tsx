import React from 'react';
import { useError } from '../context/ErrorContext';
import ErrorMessage from './ErrorMessage';

/**
 * Component that renders active errors from the ErrorContext
 * This is used in App.tsx to display global errors
 */
const ErrorDisplay: React.FC = () => {
  const { errors, clearError } = useError();
  
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col space-y-2 max-w-md">
      {errors.map((error) => (
        <ErrorMessage
          key={error.id}
          message={error.message}
          variant={error.type}
          dismissible={true}
          timeout={error.timeout}
          onDismiss={() => clearError(error.id)}
        />
      ))}
    </div>
  );
};

export default ErrorDisplay; 