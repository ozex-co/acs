import { useQuery } from '@tanstack/react-query';
import { sectionService } from '../services';
import { Section } from '../types';

// Query key
const SECTIONS_KEY = 'sections';

/**
 * Hook for fetching all sections
 */
export const useSections = () => {
  const query = useQuery({
    queryKey: [SECTIONS_KEY],
    queryFn: () => sectionService.getAllSections(),
    staleTime: 1000 * 60 * 30, // 30 minutes - sections don't change often
  });
  
  return {
    sections: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}; 