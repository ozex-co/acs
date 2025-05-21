import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../../services';
import { Section } from '../../types';
import { useApi } from '../../ApiProvider';

// Query key
const ADMIN_SECTIONS_KEY = 'adminSections';

/**
 * Hook for fetching all sections (admin only)
 */
export const useAdminSections = () => {
  const { isAuthenticated, isAdmin } = useApi();
  
  const query = useQuery({
    queryKey: [ADMIN_SECTIONS_KEY],
    queryFn: () => adminService.getSections(),
    enabled: isAuthenticated && isAdmin, // Only run if user is authenticated as admin
  });
  
  return {
    sections: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook for creating a section (admin only)
 */
export const useAdminSectionCreate = () => {
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: (sectionData: { name: string; description?: string }) => 
      adminService.createSection(sectionData),
    onSuccess: () => {
      // Invalidate sections list to reflect changes
      queryClient.invalidateQueries({ queryKey: [ADMIN_SECTIONS_KEY] });
    },
  });
  
  return {
    createSection: mutation.mutate,
    isCreating: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    createdSection: mutation.data,
  };
};

/**
 * Hook for updating a section (admin only)
 */
export const useAdminSectionUpdate = () => {
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: ({ 
      sectionId, 
      sectionData 
    }: { 
      sectionId: string | number; 
      sectionData: Partial<Section>;
    }) => adminService.updateSection(sectionId, sectionData),
    onSuccess: () => {
      // Invalidate sections list to reflect changes
      queryClient.invalidateQueries({ queryKey: [ADMIN_SECTIONS_KEY] });
    },
  });
  
  return {
    updateSection: mutation.mutate,
    isUpdating: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    updatedSection: mutation.data,
  };
};

/**
 * Hook for deleting a section (admin only)
 */
export const useAdminSectionDelete = () => {
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: (sectionId: string | number) => 
      adminService.deleteSection(sectionId),
    onSuccess: () => {
      // Invalidate sections list to reflect changes
      queryClient.invalidateQueries({ queryKey: [ADMIN_SECTIONS_KEY] });
    },
  });
  
  return {
    deleteSection: mutation.mutate,
    isDeleting: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
  };
}; 