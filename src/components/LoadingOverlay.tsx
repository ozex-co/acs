import React, { useEffect, useState } from 'react';
import { useLoading } from '../context/LoadingContext';
import Loader from './Loader';

interface LoadingOverlayProps {
  id?: string;
  fullScreen?: boolean;
  children?: React.ReactNode;
  height?: string;
  minHeight?: string;
  showMessage?: boolean;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  id = 'global',
  fullScreen = false,
  children,
  height = 'h-full',
  minHeight = 'min-h-[120px]',
  showMessage = true
}) => {
  const { isLoading, getLoadingMessage } = useLoading();
  const [visible, setVisible] = useState(false);
  
  const loading = isLoading(id);
  const message = getLoadingMessage(id);
  
  // Add a slight delay before showing and hiding the overlay to prevent flashing
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    
    if (loading) {
      // Show immediately when loading starts
      setVisible(true);
    } else {
      // Add a small delay before hiding to ensure animations complete
      timeoutId = setTimeout(() => {
        setVisible(false);
      }, 300);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [loading]);

  if (!loading && !visible) {
    // If not loading and not visible, render children without overlay
    return <>{children}</> || null;
  }
  
  if (fullScreen) {
    // Full screen overlay (use sparingly)
    return (
      <div 
        className="fixed inset-0 bg-[rgba(6,182,212,0.08)] flex flex-col items-center justify-center z-[9999] transition-opacity duration-300"
        style={{ 
          backdropFilter: 'blur(4px)',
          opacity: loading ? 1 : 0
        }}
        aria-live="polite"
        role="status"
      >
        <div className="scale-in-center flex flex-col items-center">
          <Loader size="lg" variant="primary" thickness="thick" withLabel={!!message} label={message} />
        </div>
      </div>
    );
  }
  
  // Container-specific overlay
  return (
    <div className={`relative ${minHeight}`}>
      {children}
      
      <div 
        className={`absolute inset-0 bg-[rgba(6,182,212,0.04)] backdrop-blur-[1px] flex items-center justify-center z-10 transition-opacity duration-300 ${height}`}
        style={{ opacity: loading ? 1 : 0 }}
        aria-live="polite"
        role="status"
      >
        <div className="scale-in-center">
          <Loader 
            size="md"
            variant="primary"
            withLabel={!!message && showMessage}
            label={message}
          />
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay; 