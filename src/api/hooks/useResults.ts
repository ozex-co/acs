import { useQuery, useMutation } from '@tanstack/react-query';
import { resultService } from '../services';
import { ResultDetails, UserExamResult } from '../types';
import { useApi } from '../ApiProvider';

// Query keys
const RESULTS_LIST_KEY = 'resultsList';
const RESULT_DETAILS_KEY = 'resultDetails';

/**
 * Hook for fetching user's exam results
 */
export const useResults = () => {
  const { isAuthenticated } = useApi();
  
  const query = useQuery({
    queryKey: [RESULTS_LIST_KEY],
    queryFn: () => resultService.getAllResults(),
    enabled: isAuthenticated, // Only run if user is authenticated
  });
  
  return {
    results: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook for fetching detailed result by ID
 */
export const useResultDetails = (resultId: string | number | undefined) => {
  const { isAuthenticated } = useApi();
  
  const query = useQuery({
    queryKey: [RESULT_DETAILS_KEY, resultId],
    queryFn: () => resultId ? resultService.getResultById(resultId) : null,
    enabled: Boolean(resultId) && isAuthenticated, // Only run if resultId exists and user is authenticated
  });
  
  return {
    result: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook for sharing a result
 */
export const useShareResult = () => {
  const mutation = useMutation({
    mutationFn: (resultId: string | number) => 
      resultService.shareResult(resultId),
  });
  
  return {
    shareResult: mutation.mutate,
    isSharing: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    shareUrl: mutation.data?.shareUrl,
    reset: mutation.reset,
  };
}; 