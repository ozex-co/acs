import { useQuery } from '@tanstack/react-query';
import { adminService } from '../../services';
import { AdminStats } from '../../types';
import { useApi } from '../../ApiProvider';

// Query key
const ADMIN_STATS_KEY = 'adminStats';

/**
 * Hook for fetching admin dashboard statistics
 */
export const useAdminStats = () => {
  const { isAuthenticated, isAdmin } = useApi();
  
  const query = useQuery({
    queryKey: [ADMIN_STATS_KEY],
    queryFn: () => adminService.getStats(),
    enabled: isAuthenticated && isAdmin, // Only run if user is authenticated as admin
    staleTime: 1000 * 60 * 5, // 5 minutes 
  });
  
  return {
    stats: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}; 