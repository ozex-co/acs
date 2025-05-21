import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../../services';
import { User } from '../../types';
import { useApi } from '../../ApiProvider';

// Query keys
const ADMIN_USERS_LIST_KEY = 'adminUsersList';
const ADMIN_USER_DETAILS_KEY = 'adminUserDetails';

/**
 * Hook for fetching users list (admin only)
 */
export const useAdminUsers = (params?: { 
  page?: number; 
  limit?: number; 
  search?: string;
}) => {
  const { isAuthenticated, isAdmin } = useApi();
  
  const query = useQuery({
    queryKey: [ADMIN_USERS_LIST_KEY, params],
    queryFn: () => adminService.getUsers(params),
    enabled: isAuthenticated && isAdmin, // Only run if user is authenticated as admin
  });
  
  return {
    data: query.data,
    users: query.data?.users || [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook for fetching user details by ID (admin only)
 */
export const useAdminUserDetails = (userId: string | number | undefined) => {
  const { isAuthenticated, isAdmin } = useApi();
  
  const query = useQuery({
    queryKey: [ADMIN_USER_DETAILS_KEY, userId],
    queryFn: () => userId ? adminService.getUserById(userId) : null,
    enabled: Boolean(userId) && isAuthenticated && isAdmin, // Only run if userId exists and user is admin
  });
  
  return {
    user: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook for updating user (admin only)
 */
export const useAdminUserUpdate = (userId: string | number) => {
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: (userData: Partial<User>) => 
      adminService.updateUser(userId, userData),
    onSuccess: (updatedUser) => {
      // Update cache with new user data
      queryClient.setQueryData([ADMIN_USER_DETAILS_KEY, userId], updatedUser);
      // Invalidate users list to reflect changes
      queryClient.invalidateQueries({ queryKey: [ADMIN_USERS_LIST_KEY] });
    },
  });
  
  return {
    updateUser: mutation.mutate,
    isUpdating: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    updatedUser: mutation.data,
  };
}; 