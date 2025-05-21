import { useState, useEffect, useCallback } from 'react';
import { useLoading } from '../context/LoadingContext';
import { useErrorHandler } from '../context/ErrorContext';

interface FetchOptions<T> {
  /** Initial data if needed */
  initialData?: T;
  /** Loading area ID for loading context */
  loadingId?: string; 
  /** Whether to fetch immediately when the component mounts */
  fetchOnMount?: boolean;
  /** Custom function to determine if the data is empty */
  isDataEmpty?: (data: T) => boolean;
  /** Handler for response errors (e.g., 404, 500) */
  onResponseError?: (response: Response) => void;
  /** Handler for successful fetch but empty data */
  onEmptyData?: () => void;
  /** Transform the data after it's fetched */
  transformData?: (data: any) => T;
  /** Dependencies that will trigger a refetch when changed */
  dependencies?: any[];
}

/**
 * Custom hook for data fetching with integrated loading and error handling
 */
export function useDataFetch<T>(
  url: string | null,
  options: FetchOptions<T> = {}
) {
  // Destructure options with defaults
  const {
    initialData,
    loadingId = 'data-fetch', 
    fetchOnMount = true,
    isDataEmpty = (data: T) => {
      if (Array.isArray(data)) return data.length === 0;
      if (typeof data === 'object' && data !== null) return Object.keys(data).length === 0;
      return data === null || data === undefined;
    },
    onResponseError,
    onEmptyData,
    transformData = (data: any) => data as T,
    dependencies = []
  } = options;

  // State
  const [data, setData] = useState<T | undefined>(initialData);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(fetchOnMount);
  const [isEmpty, setIsEmpty] = useState(false);
  
  // Hooks
  const { startLoading, stopLoading } = useLoading();
  const { handleError } = useErrorHandler();

  // Fetch function
  const fetchData = useCallback(async () => {
    if (!url) return;
    
    try {
      setIsLoading(true);
      setError(null);
      startLoading(loadingId);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = `Error ${response.status}: ${response.statusText}`;
        setError(errorText);
        
        if (onResponseError) {
          onResponseError(response);
        } else {
          handleError(new Error(errorText));
        }
        return;
      }
      
      // Parse response as JSON
      const jsonData = await response.json();
      
      // Apply data transformation
      const transformedData = transformData(jsonData);
      setData(transformedData);
      
      // Check if data is empty
      const dataIsEmpty = isDataEmpty(transformedData);
      setIsEmpty(dataIsEmpty);
      
      if (dataIsEmpty && onEmptyData) {
        onEmptyData();
      }
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'حدث خطأ أثناء جلب البيانات';
      
      setError(errorMessage);
      handleError(err);
    } finally {
      setIsLoading(false);
      stopLoading(loadingId);
    }
  }, [url, loadingId, handleError, startLoading, stopLoading, transformData, isDataEmpty, onEmptyData, onResponseError]);

  // Fetch on mount if fetchOnMount is true
  useEffect(() => {
    if (fetchOnMount && url) {
      fetchData();
    }
  }, [fetchOnMount, url, ...dependencies]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refetch can be called manually
  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    error,
    isLoading,
    isEmpty,
    refetch,
    setData, // Expose setData for local updates
  };
}

export default useDataFetch; 