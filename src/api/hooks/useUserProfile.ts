import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../services';
import { UpdateProfileRequest, User } from '../types';
import { useApi } from '../ApiProvider';

// Query key
const USER_PROFILE_KEY = 'userProfile';

/**
 * Hook for fetching and managing user profile data
 */
export const useUserProfile = () => {
  const { isAuthenticated } = useApi();
  const queryClient = useQueryClient();
  
  // Query to get user profile
  const query = useQuery({
    queryKey: [USER_PROFILE_KEY],
    queryFn: () => userService.getProfile(),
    enabled: isAuthenticated, // Only run if user is authenticated
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Mutation to update user profile
  const updateMutation = useMutation({
    mutationFn: (profileData: UpdateProfileRequest) => 
      userService.updateProfile(profileData),
    onSuccess: (updatedUser) => {
      // Update cache with new user data
      queryClient.setQueryData([USER_PROFILE_KEY], updatedUser);
    },
  });
  
  // Mutation to change password
  const changePasswordMutation = useMutation({
    mutationFn: (passwordData: { currentPassword: string; newPassword: string }) => 
      userService.changePassword(passwordData),
  });
  
  return {
    profile: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    updateProfile: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
    changePassword: changePasswordMutation.mutate,
    isChangingPassword: changePasswordMutation.isPending,
    changePasswordError: changePasswordMutation.error,
    refetch: query.refetch,
  };
}; 