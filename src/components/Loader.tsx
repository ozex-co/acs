import React from 'react'

interface LoaderProps {
  size?: 'xs' | 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary' | 'white'
  thickness?: 'thin' | 'regular' | 'thick'
  withLabel?: boolean
  label?: string
}

const Loader: React.FC<LoaderProps> = ({
  size = 'md',
  variant = 'primary',
  thickness = 'regular',
  withLabel = false,
  label = 'جاري التحميل...'
}) => {
  // Size mappings
  const sizeMap = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }
  
  // Text size mappings based on loader size
  const textSizeMap = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }
  
  // Border thickness mappings
  const thicknessMap = {
    thin: 'border-2',
    regular: 'border-3',
    thick: 'border-4'
  }
  
  // Color mappings - using our theme colors
  const colorMap = {
    primary: 'border-primary-500 dark:border-cyan-500',
    secondary: 'border-secondary-600 dark:border-gray-800',
    white: 'border-white'
  }
  
  return (
    <div className="flex flex-col items-center" role="status" aria-live="polite">
      <div 
        className={`${sizeMap[size]} ${thicknessMap[thickness]} ${colorMap[variant]} border-t-transparent rounded-full animate-spin`} 
        style={{ 
          animationDuration: '0.8s', 
          boxShadow: variant === 'primary' ? '0 0 10px rgba(0, 188, 212, 0.2)' : 'none' 
        }}
      />
      
      {withLabel && (
        <p className={`mt-2 ${textSizeMap[size]} text-text-muted dark:text-gray-400`}>
          {label}
        </p>
      )}
    </div>
  )
}

export default React.memo(Loader) 