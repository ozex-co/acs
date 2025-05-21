import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../../services';
import { Exam, ExamWithQuestions } from '../../types';
import { useApi } from '../../ApiProvider';

// Query keys
const ADMIN_EXAMS_LIST_KEY = 'adminExamsList';
const ADMIN_EXAM_DETAILS_KEY = 'adminExamDetails';

// Interface to handle different response structures
interface AdminExamsResponse {
  exams?: Exam[];
  data?: {
    exams?: Exam[];
    data?: {
      exams?: Exam[];
    }
  };
  pagination?: any;
}

/**
 * Hook for fetching exams list (admin only)
 */
export const useAdminExams = (params?: { 
  page?: number; 
  limit?: number; 
  sectionId?: number;
  search?: string;
}) => {
  const { isAuthenticated, isAdmin } = useApi();
  
  const query = useQuery({
    queryKey: [ADMIN_EXAMS_LIST_KEY, params],
    queryFn: async () => {
      const response = await adminService.getExams(params) as unknown as AdminExamsResponse;
      
      // Debug log the response structure
      console.log('Admin exams response:', response);
      
      let exams: Exam[] = [];
      let pagination = null;
      
      // Handle different response structures
      if (response?.exams && Array.isArray(response.exams)) {
        exams = response.exams;
      } else if (response?.data?.exams && Array.isArray(response.data.exams)) {
        exams = response.data.exams;
      } else if (response?.data?.data?.exams && Array.isArray(response.data.data.exams)) {
        exams = response.data.data.exams;
      }
      
      // Extract pagination if available
      if (response?.pagination) {
        pagination = response.pagination;
      } else if (response?.data?.pagination) {
        pagination = response.data.pagination;
      }
      
      return { 
        exams,
        pagination
      };
    },
    enabled: isAuthenticated && isAdmin, // Only run if user is authenticated as admin
  });
  
  return {
    data: query.data,
    exams: query.data?.exams || [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook for fetching exam details by ID (admin only)
 */
export const useAdminExamDetails = (examId: string | number | undefined) => {
  const { isAuthenticated, isAdmin } = useApi();
  
  const query = useQuery({
    queryKey: [ADMIN_EXAM_DETAILS_KEY, examId],
    queryFn: () => examId ? adminService.getExamById(examId) : null,
    enabled: Boolean(examId) && isAuthenticated && isAdmin, // Only run if examId exists and user is admin
  });
  
  return {
    exam: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook for creating a new exam (admin only)
 */
export const useAdminExamCreate = () => {
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: (examData: Partial<ExamWithQuestions>) => 
      adminService.createExam(examData),
    onSuccess: () => {
      // Invalidate exams list to reflect changes
      queryClient.invalidateQueries({ queryKey: [ADMIN_EXAMS_LIST_KEY] });
    },
  });
  
  return {
    createExam: mutation.mutate,
    isCreating: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    createdExam: mutation.data,
  };
};

/**
 * Hook for updating an exam (admin only)
 */
export const useAdminExamUpdate = (examId: string | number) => {
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: (examData: Partial<ExamWithQuestions>) => 
      adminService.updateExam(examId, examData),
    onSuccess: (updatedExam) => {
      // Update cache with new exam data
      queryClient.setQueryData([ADMIN_EXAM_DETAILS_KEY, examId], updatedExam);
      // Invalidate exams list to reflect changes
      queryClient.invalidateQueries({ queryKey: [ADMIN_EXAMS_LIST_KEY] });
    },
  });
  
  return {
    updateExam: mutation.mutate,
    isUpdating: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    updatedExam: mutation.data,
  };
};

/**
 * Hook for deleting an exam (admin only)
 */
export const useAdminExamDelete = () => {
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: (examId: string | number) => 
      adminService.deleteExam(examId),
    onSuccess: (_data, examId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: [ADMIN_EXAM_DETAILS_KEY, examId] });
      // Invalidate exams list to reflect changes
      queryClient.invalidateQueries({ queryKey: [ADMIN_EXAMS_LIST_KEY] });
    },
  });
  
  return {
    deleteExam: mutation.mutate,
    isDeleting: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
  };
};

/**
 * Hook for deleting a question (admin only)
 */
export const useAdminQuestionDelete = () => {
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: (questionId: string | number) => 
      adminService.deleteQuestion(questionId),
    onSuccess: (_data, questionId) => {
      // Invalidate all exam details queries since a question was deleted
      queryClient.invalidateQueries({ queryKey: [ADMIN_EXAM_DETAILS_KEY] });
    },
  });
  
  return {
    deleteQuestion: mutation.mutate,
    isDeleting: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
  };
}; 