import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

// Define loading area type
export type LoadingArea = {
  id: string;
  message?: string;
  timestamp: number;
};

interface LoadingContextProps {
  loadingAreas: LoadingArea[];
  startLoading: (id: string, message?: string) => void;
  stopLoading: (id: string) => void;
  isLoading: (id?: string) => boolean;
  getLoadingMessage: (id: string) => string | undefined;
  anyLoading: boolean;
}

const LoadingContext = createContext<LoadingContextProps>({
  loadingAreas: [],
  startLoading: () => {},
  stopLoading: () => {},
  isLoading: () => false,
  getLoadingMessage: () => undefined,
  anyLoading: false,
});

interface LoadingProviderProps {
  children: ReactNode;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [loadingAreas, setLoadingAreas] = useState<LoadingArea[]>([]);

  // Start loading for a specific area
  const startLoading = useCallback((id: string, message?: string) => {
    setLoadingAreas(prev => {
      // Check if this area is already loading
      const existing = prev.find(area => area.id === id);
      if (existing) {
        return prev.map(area => 
          area.id === id 
            ? { ...area, message, timestamp: Date.now() } 
            : area
        );
      }
      // Add new loading area
      return [...prev, { id, message, timestamp: Date.now() }];
    });
  }, []);

  // Stop loading for a specific area
  const stopLoading = useCallback((id: string) => {
    setLoadingAreas(prev => prev.filter(area => area.id !== id));
  }, []);

  // Check if a specific area is loading (or any area if id is not provided)
  const isLoading = useCallback((id?: string) => {
    if (id) {
      return loadingAreas.some(area => area.id === id);
    }
    return loadingAreas.length > 0;
  }, [loadingAreas]);

  // Get loading message for a specific area
  const getLoadingMessage = useCallback((id: string) => {
    const area = loadingAreas.find(area => area.id === id);
    return area?.message;
  }, [loadingAreas]);

  // Auto-timeout long-running loading areas (after 30 seconds)
  React.useEffect(() => {
    const timeoutCheck = setInterval(() => {
      const now = Date.now();
      setLoadingAreas(prev => 
        prev.filter(area => {
          // Remove loading areas that have been running for more than 30 seconds
          const isTimedOut = now - area.timestamp > 30000;
          if (isTimedOut) {
            console.warn(`Loading area "${area.id}" timed out after 30 seconds`);
          }
          return !isTimedOut;
        })
      );
    }, 5000);

    return () => clearInterval(timeoutCheck);
  }, []);

  return (
    <LoadingContext.Provider
      value={{
        loadingAreas,
        startLoading,
        stopLoading,
        isLoading,
        getLoadingMessage,
        anyLoading: loadingAreas.length > 0
      }}
    >
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => useContext(LoadingContext); 