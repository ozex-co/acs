import { useEffect, useRef } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';

// Valid easing functions from AOS
type EasingType = 
  | 'linear' 
  | 'ease' 
  | 'ease-in' 
  | 'ease-out' 
  | 'ease-in-out' 
  | 'ease-in-back' 
  | 'ease-out-back' 
  | 'ease-in-out-back' 
  | 'ease-in-sine' 
  | 'ease-out-sine' 
  | 'ease-in-out-sine' 
  | 'ease-in-quad' 
  | 'ease-out-quad' 
  | 'ease-in-out-quad' 
  | 'ease-in-cubic' 
  | 'ease-out-cubic' 
  | 'ease-in-out-cubic' 
  | 'ease-in-quart' 
  | 'ease-out-quart' 
  | 'ease-in-out-quart';

interface AOSOptions {
  once?: boolean;
  duration?: number;
  easing?: EasingType;
  offset?: number;
  delay?: number;
  disableMutationObserver?: boolean;
}

/**
 * Custom hook to initialize AOS (Animate On Scroll) library
 * Ensures AOS is initialized only once and reinitializes on route changes
 * Can be used in App.tsx or a layout component
 */
export const useAOS = (options: AOSOptions = {}) => {
  const initialized = useRef(false);
  
  useEffect(() => {
    // Default options with better performance settings
    const defaultOptions: AOSOptions = {
      once: true, // Only animate elements once (better performance)
      duration: 700, // Default animation duration
      easing: 'ease-out-cubic', // Smooth easing
      offset: 100, // Offset (in px) from the original trigger point
      disableMutationObserver: true, // Disable mutation observer for better performance
    };
    
    // Merge default options with user options
    const aosOptions = { ...defaultOptions, ...options };
    
    // Initialize AOS if not already initialized
    if (!initialized.current) {
      AOS.init(aosOptions as AOS.AosOptions);
      initialized.current = true;
      console.log('AOS initialized');
    } else {
      // Refresh AOS on subsequent renders
      AOS.refresh();
    }
    
    return () => {
      // No cleanup needed as AOS doesn't provide a cleanup method
    };
  }, [options]); // Re-initialize if options change
  
  // Return methods to manually refresh or disable AOS animations
  return {
    refresh: () => AOS.refresh(),
    disable: () => {
      // Remove AOS attributes from all elements
      document.querySelectorAll('[data-aos]').forEach(el => {
        el.removeAttribute('data-aos');
      });
    }
  };
};

export default useAOS; 