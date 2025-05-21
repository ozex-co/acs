import React, { createContext, useContext } from 'react';

// We're enforcing light theme only
export type ThemeType = 'light';

// Define theme properties
export interface ThemeProperties {
  id: ThemeType;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  mutedColor: string;
  borderColor: string;
}

// Light theme definition with our required color palette
export const lightTheme: ThemeProperties = {
  id: 'light',
  name: 'وضع الإضاءة',
  primaryColor: '#06b6d4', // cyan-400
  secondaryColor: '#a855f7', // purple-500
  accentColor: '#facc15', // yellow-400
  backgroundColor: '#ffffff', // pure white
  textColor: '#0f172a', // slate-900
  mutedColor: '#64748b', // slate-500
  borderColor: '#e2e8f0', // slate-200
};

interface ThemeContextType {
  themeType: ThemeType;
  theme: ThemeProperties;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Always use light theme
  const themeType: ThemeType = 'light';

  // Apply theme to CSS variables and HTML/body elements on first render
  React.useEffect(() => {
    // Update document properties
    document.documentElement.classList.add('light');
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('theme-light');
    
    // Apply CSS variables for theming
    document.documentElement.style.setProperty('--color-primary', lightTheme.primaryColor);
    document.documentElement.style.setProperty('--color-secondary', lightTheme.secondaryColor);
    document.documentElement.style.setProperty('--color-accent', lightTheme.accentColor);
    document.documentElement.style.setProperty('--color-bg', lightTheme.backgroundColor);
    document.documentElement.style.setProperty('--color-text', lightTheme.textColor);
    document.documentElement.style.setProperty('--color-muted', lightTheme.mutedColor);
    document.documentElement.style.setProperty('--color-border', lightTheme.borderColor);
    
    // Force white background
    document.body.style.backgroundColor = lightTheme.backgroundColor;
    document.body.style.color = lightTheme.textColor;
    
    // Add theme class to the body
    document.body.className = 'theme-light';
    
    // Set data-theme attribute for CSS selectors
    document.documentElement.setAttribute('data-theme', 'light');
    
    // Apply meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', lightTheme.primaryColor);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = lightTheme.primaryColor;
      document.head.appendChild(meta);
    }
  }, []);

  return (
    <ThemeContext.Provider 
      value={{ 
        themeType, 
        theme: lightTheme
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 