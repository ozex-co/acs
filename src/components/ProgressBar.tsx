import React, { useEffect, useState } from 'react';

interface ProgressBarProps {
  currentQuestion: number;
  totalQuestions: number;
  variant?: 'primary' | 'secondary' | 'accent';
  showLabels?: boolean;
  animated?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  currentQuestion, 
  totalQuestions,
  variant = 'primary',
  showLabels = true,
  animated = true,
  size = 'md'
}) => {
  const [displayedProgress, setDisplayedProgress] = useState(0);
  const progressPercentage = (currentQuestion / totalQuestions) * 100;
  
  // Animation effect when progress changes
  useEffect(() => {
    if (!animated) {
      setDisplayedProgress(progressPercentage);
      return;
    }
    
    // Animate progress smoothly
    let start: number;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const duration = 600; // Animation duration in ms
      
      const nextProgress = Math.min(
        displayedProgress + ((progressPercentage - displayedProgress) * elapsed) / duration,
        progressPercentage
      );
      
      setDisplayedProgress(nextProgress);
      
      if (elapsed < duration && nextProgress < progressPercentage) {
        window.requestAnimationFrame(step);
      } else {
        setDisplayedProgress(progressPercentage);
      }
    };
    
    window.requestAnimationFrame(step);
  }, [progressPercentage, animated, displayedProgress]);
  
  // Color mappings for different variants
  const colorMap = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    accent: 'bg-accent'
  };
  
  // Size mappings
  const sizeMap = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };
  
  // Get color based on progress
  const getColorClass = () => {
    if (progressPercentage < 25) return 'bg-red-500';
    if (progressPercentage < 50) return 'bg-orange-500';
    if (progressPercentage < 75) return colorMap[variant];
    return 'bg-green-500';
  };
  
  return (
    <div className="w-full mb-4 fade-in">
      {showLabels && (
        <div className="flex justify-between items-center mb-1 text-sm">
          <span className="text-gray-400">السؤال {currentQuestion} من {totalQuestions}</span>
          <span className={`font-semibold ${progressPercentage >= 75 ? 'text-green-500' : 'text-primary'}`}>
            {Math.round(progressPercentage)}%
          </span>
        </div>
      )}
      <div className={`progress-container overflow-hidden rounded-full ${sizeMap[size]}`}>
        <div 
          className={`progress-bar ${animated ? 'transition-none' : 'transition-all'} ${getColorClass()}`}
          style={{ 
            width: `${displayedProgress}%`,
            transition: animated ? 'none' : 'width 0.5s ease-out'
          }}
          aria-valuenow={currentQuestion}
          aria-valuemin={1}
          aria-valuemax={totalQuestions}
          role="progressbar"
          aria-label={`${Math.round(progressPercentage)}% complete`}
        />
      </div>
    </div>
  );
};

export default React.memo(ProgressBar); 