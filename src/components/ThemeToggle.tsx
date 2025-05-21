import React from 'react';
import { FaSun } from 'react-icons/fa';

interface ThemeToggleProps {
  showName?: boolean;
  variant?: 'icon' | 'button';
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  showName = false,
  variant = 'icon'
}) => {
  // In light-only mode, this is just a decorative element
  
  if (variant === 'button') {
    return (
      <button 
        className="relative px-3 py-2 rounded-md transition-all focus:outline-none flex items-center gap-2 bg-primary-50 text-primary border border-primary-100 cursor-default shadow-sm"
        aria-label="وضع الإضاءة"
        disabled
        title="وضع الإضاءة"
      >
        <div className="transform">
          <FaSun />
        </div>
        {showName && <span>وضع الإضاءة</span>}
      </button>
    );
  }

  // Default icon variant
  return (
    <button 
      className="relative p-2 rounded-full transition-all focus:outline-none bg-primary-50 text-primary cursor-default shadow-sm"
      aria-label="وضع الإضاءة"
      disabled
      title="وضع الإضاءة"
    >
      <div>
        <FaSun />
      </div>
      <span className="sr-only">وضع الإضاءة</span>
    </button>
  );
};

export default ThemeToggle; 