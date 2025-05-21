// App Configuration
export const APP_CONFIG = {
  // Set to false to enable maintenance mode
  APP_ENABLED: true,
  
  // Add any paths that should bypass the maintenance mode
  EXEMPT_PATHS: ['/login', '/admin'],
  
  // Contact email for maintenance page
  CONTACT_EMAIL: 'support@qozex.com',
  
  // Theme settings
  THEME: {
    // Colors with better contrast for dark mode
    DARK_TEXT_PRIMARY: 'text-white',
    DARK_TEXT_SECONDARY: 'text-slate-200', 
    DARK_TEXT_MUTED: 'text-slate-400',
    
    // Background colors
    DARK_BG_PRIMARY: 'bg-slate-900',
    DARK_BG_SECONDARY: 'bg-slate-800', 
    DARK_BG_ACCENT: 'bg-primary-600',
    
    // Border colors
    DARK_BORDER: 'border-slate-700',
    
    // Animations
    FADE_IN: 'animate-in fade-in',
    SLIDE_IN_LEFT: 'animate-in slide-in-from-left',
    SLIDE_IN_RIGHT: 'animate-in slide-in-from-right',
    SLIDE_IN_BOTTOM: 'animate-in slide-in-from-bottom',
    ZOOM_IN: 'animate-in zoom-in',
  }
};

export default APP_CONFIG; 