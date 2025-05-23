import React, { ButtonHTMLAttributes, forwardRef } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'outlined' | 'danger' | 'success'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  isLoading?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  className = '',
  children,
  disabled,
  icon,
  iconPosition = 'left',
  ...props
}, ref) => {
  // Base classes with focus and outline styles
  const baseClasses = 'inline-flex items-center justify-center text-center font-medium rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm'
  
  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }
  
  // Variant classes using our color palette
  const variantClasses = {
    primary: 'bg-primary text-text hover:bg-primary/90 focus:ring-primary/50',
    secondary: 'bg-secondary text-text hover:bg-secondary/90 focus:ring-secondary/50',
    accent: 'bg-accent text-text hover:bg-accent/90 focus:ring-accent/50',
    outlined: 'border-2 border-primary text-primary hover:bg-primary/10 focus:ring-primary/30',
    danger: 'bg-error text-text hover:bg-error/90 focus:ring-error/50',
    success: 'bg-success text-text hover:bg-success/90 focus:ring-success/50'
  }
  
  const widthClass = fullWidth ? 'w-full' : ''
  const disabledClass = disabled || isLoading 
    ? 'opacity-60 cursor-not-allowed pointer-events-none' 
    : 'hover:shadow-md active:translate-y-px'
  
  const buttonClasses = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${widthClass} ${disabledClass} ${className}`
  
  // Handle icon presence and positioning
  const renderContent = () => {
    if (isLoading) {
      return (
        <>
          <svg 
            className="animate-spin ml-2 h-4 w-4" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="fade-in">{children}</span>
        </>
      )
    }
    
    if (icon) {
      return iconPosition === 'left' 
        ? (<>{icon}<span className={icon ? 'mr-2' : ''}>{children}</span></>) 
        : (<><span className={icon ? 'ml-2' : ''}>{children}</span>{icon}</>)
    }
    
    // Simply return children
    return children
  }
  
  return (
    <button 
      className={buttonClasses}
      disabled={disabled || isLoading}
      ref={ref}
      {...props}
    >
      {renderContent()}
    </button>
  )
})

Button.displayName = 'Button'

export default Button 
