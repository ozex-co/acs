import { useQuery } from '@tanstack/react-query';
import { examService } from '../services';
import { ExamSummary, ExamWithQuestions } from '../types';
import { useApi } from '../ApiProvider';

// Query keys
const EXAMS_LIST_KEY = 'examsList';
const EXAM_DETAILS_KEY = 'examDetails';

// Interface to handle different response structures
interface ApiResponse {
  data?: {
    exams?: ExamSummary[];
    data?: {
      exams?: ExamSummary[];
    }
  };
  exams?: ExamSummary[];
}

/**
 * Hook for fetching available exams list
 */
export const useExams = (params?: { page?: number; limit?: number; section?: number }) => {
  const { isAuthenticated } = useApi();
  
  const query = useQuery({
    queryKey: [EXAMS_LIST_KEY, params],
    queryFn: async () => {
      const response = await examService.getAllExams(params) as unknown as ApiResponse | ExamSummary[];
      
      // Debug log to see the response structure
      console.log('useExams query response:', response);
      
      // Check if the API response is properly structured
      // If not, we need to extract the exams from the nested structure
      if (response && Array.isArray(response)) {
        return response;
      } else if (response?.data?.exams && Array.isArray(response.data.exams)) {
        return response.data.exams;
      } else if (response?.data?.data?.exams && Array.isArray(response.data.data.exams)) {
        return response.data.data.exams;
      } else if (response?.exams && Array.isArray(response.exams)) {
        return response.exams;
      }
      
      // Default empty array if we couldn't find exams
      console.warn('Could not find exams array in API response:', response);
      return [] as ExamSummary[];
    },
    enabled: isAuthenticated, // Only run if user is authenticated
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  return {
    exams: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook for fetching exam details by ID
 */
export const useExamDetails = (examId: string | number | undefined) => {
  const { isAuthenticated } = useApi();
  
  const query = useQuery({
    queryKey: [EXAM_DETAILS_KEY, examId],
    queryFn: () => examId ? examService.getExamById(examId) : null,
    enabled: Boolean(examId) && isAuthenticated, // Only run if examId exists and user is authenticated
  });
  
  return {
    exam: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}; 