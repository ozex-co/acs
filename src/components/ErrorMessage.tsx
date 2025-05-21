import React, { useState, useEffect } from 'react'

interface ErrorMessageProps {
  message: string
  variant?: 'error' | 'warning' | 'info'
  dismissible?: boolean
  onDismiss?: () => void
  timeout?: number | null
  icon?: React.ReactNode
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  variant = 'error',
  dismissible = true,
  onDismiss,
  timeout = null,
  icon
}) => {
  const [isVisible, setIsVisible] = useState(true)
  
  // Auto-dismiss after timeout (if provided)
  useEffect(() => {
    if (timeout && timeout > 0) {
      const timer = setTimeout(() => {
        handleDismiss()
      }, timeout)
      
      return () => clearTimeout(timer)
    }
  }, [timeout])
  
  // Handle dismiss click
  const handleDismiss = () => {
    setIsVisible(false)
    
    // Call onDismiss prop after animation completes
    setTimeout(() => {
      if (onDismiss) onDismiss()
    }, 300)
  }
  
  // Variant styles
  const variantStyles = {
    error: {
      bg: 'bg-red-50 dark:bg-red-500 dark:bg-opacity-15',
      border: 'border-red-300 dark:border-red-500',
      text: 'text-red-600 dark:text-red-500',
      icon: icon || (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      )
    },
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-500 dark:bg-opacity-15',
      border: 'border-yellow-300 dark:border-yellow-500',
      text: 'text-yellow-600 dark:text-yellow-500',
      icon: icon || (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      )
    },
    info: {
      bg: 'bg-primary-50 dark:bg-primary dark:bg-opacity-15',
      border: 'border-primary-200 dark:border-primary',
      text: 'text-primary-700 dark:text-primary',
      icon: icon || (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      )
    }
  }
  
  const styles = variantStyles[variant]
  
  if (!isVisible) return null
  
  return (
    <div 
      className={`${styles.bg} ${styles.border} ${styles.text} border rounded-lg p-4 mb-4 flex items-start animate-fadeIn shadow-sm`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex-shrink-0 mr-3 mt-0.5">
        {styles.icon}
      </div>
      
      <div className="flex-grow mr-2">
        <p className="text-sm leading-relaxed">{message}</p>
      </div>
      
      {dismissible && (
        <button 
          onClick={handleDismiss}
          className={`flex-shrink-0 ${styles.text} focus:outline-none focus:ring-2 focus:ring-${variant === 'error' ? 'red' : variant === 'warning' ? 'yellow' : 'primary'}-500 p-1 rounded`}
          aria-label="Dismiss"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}

export default ErrorMessage 