import { useMutation, useQueryClient } from '@tanstack/react-query';
import { examService } from '../services';
import { SubmitExamRequest, UserExamResult } from '../types';

// Keys for queries to invalidate after submission
const RESULTS_LIST_KEY = 'resultsList';

/**
 * Hook for submitting exam answers
 */
export const useExamSubmission = (examId: string | number) => {
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: (submission: SubmitExamRequest) => 
      examService.submitExam(examId, submission),
    onSuccess: () => {
      // Invalidate the results list so it will be refetched with the new result
      queryClient.invalidateQueries({ queryKey: [RESULTS_LIST_KEY] });
    },
  });
  
  return {
    submitExam: mutation.mutate,
    isSubmitting: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    result: mutation.data,
    reset: mutation.reset,
  };
}; 