import React from 'react'

interface SkeletonProps {
  type?: 'text' | 'circle' | 'rectangle' | 'card' | 'avatar' | 'button'
  width?: string
  height?: string
  className?: string
  count?: number
  animated?: boolean
}

const Skeleton: React.FC<SkeletonProps> = ({
  type = 'text',
  width,
  height,
  className = '',
  count = 1,
  animated = true
}) => {
  // Base skeleton style
  const baseClass = 'bg-slate-300 dark:bg-gray-800 bg-opacity-40 dark:bg-opacity-40 rounded overflow-hidden'
  const animationClass = animated ? 'animate-pulse' : ''
  
  // Get styles based on type
  const getTypeStyles = () => {
    switch (type) {
      case 'text':
        return 'h-4 rounded w-full'
      case 'circle':
        return 'rounded-full aspect-square'
      case 'avatar':
        return 'rounded-full aspect-square w-12 h-12'
      case 'button':
        return 'h-10 rounded-lg'
      case 'card':
        return 'rounded-lg h-24'
      case 'rectangle':
      default:
        return 'rounded'
    }
  }
  
  // Custom width/height styles
  const sizeStyle = {
    width: width || (type === 'text' ? '100%' : undefined),
    height: height
  }
  
  // Render multiple items if count > 1
  if (count > 1) {
    return (
      <div className="space-y-2">
        {Array(count).fill(null).map((_, index) => (
          <div
            key={index}
            className={`${baseClass} ${getTypeStyles()} ${animationClass} ${className}`}
            style={{
              ...sizeStyle,
              width: type === 'text' && index === count - 1 ? '70%' : sizeStyle.width
            }}
          />
        ))}
      </div>
    )
  }
  
  return (
    <div
      className={`${baseClass} ${getTypeStyles()} ${animationClass} ${className}`}
      style={sizeStyle}
    />
  )
}

interface SkeletonLoaderProps {
  type?: 'list' | 'card' | 'table' | 'profile' | 'exam' | 'detail'
  rows?: number
  className?: string
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  type = 'card',
  rows = 3,
  className = ''
}) => {
  switch (type) {
    case 'list':
      return (
        <div className={`space-y-4 ${className}`}>
          {Array(rows).fill(null).map((_, index) => (
            <div key={index} className="flex items-center space-x-4 rtl:space-x-reverse p-2">
              <Skeleton type="avatar" />
              <div className="flex-1 space-y-2">
                <Skeleton type="text" />
                <Skeleton type="text" width="60%" />
              </div>
            </div>
          ))}
        </div>
      )
      
    case 'table':
      return (
        <div className={`space-y-2 ${className}`}>
          <div className="flex space-x-4 rtl:space-x-reverse">
            <Skeleton type="text" width="20%" height="2rem" className="opacity-50" />
            <Skeleton type="text" width="40%" height="2rem" className="opacity-50" />
            <Skeleton type="text" width="40%" height="2rem" className="opacity-50" />
          </div>
          {Array(rows).fill(null).map((_, index) => (
            <div key={index} className="flex space-x-4 rtl:space-x-reverse pt-2">
              <Skeleton type="text" width="20%" />
              <Skeleton type="text" width="40%" />
              <Skeleton type="text" width="40%" />
            </div>
          ))}
        </div>
      )
      
    case 'profile':
      return (
        <div className={`space-y-6 ${className}`}>
          <div className="flex flex-col items-center space-y-4">
            <Skeleton type="circle" width="5rem" height="5rem" />
            <Skeleton type="text" width="10rem" />
            <Skeleton type="text" width="8rem" />
          </div>
          <div className="space-y-3 mt-6">
            <Skeleton type="text" />
            <Skeleton type="text" />
            <Skeleton type="text" width="70%" />
          </div>
        </div>
      )
      
    case 'exam':
      return (
        <div className={`space-y-4 ${className}`}>
          <Skeleton type="text" height="2rem" />
          <div className="py-2">
            <Skeleton type="text" height="1rem" width="30%" className="mb-1" />
            <Skeleton type="rectangle" height="0.5rem" />
          </div>
          <div className="space-y-3 py-4">
            <Skeleton type="text" height="4rem" />
            <div className="space-y-2 mt-4">
              {Array(4).fill(null).map((_, index) => (
                <Skeleton key={index} type="rectangle" height="3rem" />
              ))}
            </div>
          </div>
          <div className="flex justify-between pt-4">
            <Skeleton type="button" width="5rem" />
            <Skeleton type="button" width="5rem" />
          </div>
        </div>
      )
          
    case 'detail':
      return (
        <div className={`space-y-4 ${className}`}>
          <Skeleton type="text" height="2rem" width="60%" />
          <Skeleton type="text" height="1rem" width="40%" />
          <div className="py-4">
            <Skeleton type="rectangle" height="12rem" />
          </div>
          <div className="space-y-2">
            <Skeleton type="text" />
            <Skeleton type="text" />
            <Skeleton type="text" width="90%" />
            <Skeleton type="text" width="80%" />
          </div>
        </div>
      )
      
    case 'card':
    default:
      return (
        <div className={`space-y-3 ${className}`}>
          <Skeleton type="text" height="1.5rem" width="70%" />
          <Skeleton type="text" height="1rem" width="40%" />
          <Skeleton type="text" count={rows} />
          <Skeleton type="rectangle" height="3rem" />
        </div>
      )
  }
}

export default SkeletonLoader 