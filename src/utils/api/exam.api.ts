import { apiClient, API_ROUTES, extractSpecificData } from '../api';
import { ApiHandlerResponse, GetExamByIdResponse, GetExamsResponse, SubmitExamResponse } from '../../types/api';

/**
 * Exam API handlers
 * Handles integration issues between frontend and backend
 */
const examApi = {
  /**
   * Get all exams available to the current user
   * @returns List of exams
   */
  getExams: async (sectionId?: string): Promise<ApiHandlerResponse<GetExamsResponse>> => {
    try {
      // Prepare query params if necessary
      const params = new URLSearchParams();
      if (sectionId) {
        params.append('sectionId', sectionId.toString());
      }
      
      // Make API request
      const url = `${API_ROUTES.GET_EXAMS}${sectionId ? `?${params.toString()}` : ''}`;
      const response = await apiClient.get(url);
      
      // Add debug logging to see the response structure
      console.log('Raw exam API response:', response.data);
      
      // Extract exams data safely, handling different response formats
      let exams = extractSpecificData<any[]>(response.data, 'exams');
      
      // Handle the nested data.data.exams structure if the above extraction fails
      if (!exams && response.data?.data?.data?.exams) {
        exams = response.data.data.data.exams;
        console.log('Found exams in deeply nested structure', exams);
      }
      
      // If still no exams but we have a success response, check other structures
      if (!exams && response.data?.success === true) {
        if (response.data?.data?.exams) {
          exams = response.data.data.exams;
          console.log('Found exams in data.exams structure', exams);
        }
      }
      
      return {
        success: true,
        data: { exams: exams || [] }
      };
    } catch (error: any) {
      console.error('Failed to fetch exams:', error);
      return {
        success: false,
        error: error?.message || 'Failed to fetch exams'
      };
    }
  },
  
  /**
   * Get exam by ID with questions
   * @param examId Exam ID
   * @returns Exam with questions
   */
  getExamById: async (examId: string): Promise<ApiHandlerResponse<GetExamByIdResponse>> => {
    try {
      // Format examId - ensure it's a valid format
      const formattedExamId = String(examId).trim();
      
      // Log the URL we're requesting 
      console.log(`Requesting exam URL: ${API_ROUTES.GET_EXAM(formattedExamId)}`);

      // Try using a slightly different request pattern with error handling
      let response;
      try {
        response = await apiClient.get(API_ROUTES.GET_EXAM(formattedExamId));
      } catch (requestError: any) {
        // If we get a 500 error, try an alternate approach
        if (requestError?.response?.status === 500) {
          console.warn(`Received 500 error on first attempt, trying alternate URL format`);
          // Try a different format of URL (sometimes needed if API has inconsistent behavior)
          try {
            response = await apiClient.get(`${API_ROUTES.GET_EXAMS}/${formattedExamId}`);
          } catch (altError: any) {
            // If this also fails, throw the original error
            throw requestError;
          }
        } else {
          throw requestError;
        }
      }
      
      // Add debug logging to see the response structure
      console.log(`Raw exam API response for ID ${examId}:`, response.data);
      
      // Extract exam data safely, handling different response formats
      let exam = extractSpecificData<any>(response.data, 'exam');
      
      // Handle the nested data.data.exam structure if the above extraction fails
      if (!exam && response.data?.data?.data?.exam) {
        exam = response.data.data.data.exam;
        console.log('Found exam in deeply nested structure', exam);
      }
      
      // If still no exam but we have a success response, check other structures
      if (!exam && response.data?.success === true) {
        if (response.data?.data?.exam) {
          exam = response.data.data.exam;
          console.log('Found exam in data.exam structure', exam);
        }
      }
      
      // Try more locations if the above didn't work
      if (!exam) {
        // Try using the data directly if it has the right shape
        if (response.data?.title && (response.data?.questions || response.data?.questionsCount)) {
          console.log('Found exam data directly in response.data');
          exam = response.data;
        }
        // Try data.data if it has the right shape
        else if (response.data?.data?.title && (response.data?.data?.questions || response.data?.data?.questionsCount)) {
          console.log('Found exam data in response.data.data');
          exam = response.data.data;
        }
      }
      
      if (!exam) {
        console.warn(`Could not find exam data for ID ${examId} in response:`, response.data);
        return {
          success: false,
          error: 'Exam not found'
        };
      }
      
      return {
        success: true,
        data: { exam }
      };
    } catch (error: any) {
      console.error(`Failed to fetch exam ${examId}:`, error);
      return {
        success: false,
        error: error?.message || 'Failed to fetch exam'
      };
    }
  },
  
  /**
   * Submit exam answers
   * @param examId Exam ID
   * @param answers User answers
   * @param timeSpent Time spent in seconds
   * @returns Submission result
   */
  submitExam: async (
    examId: string, 
    answers: any[],
    timeSpent: number
  ): Promise<ApiHandlerResponse<SubmitExamResponse>> => {
    try {
      const response = await apiClient.post(
        API_ROUTES.SUBMIT_EXAM(examId),
        { answers, timeSpent }
      );
      
      // Add debug logging for the response
      console.log(`Raw submit exam API response for ID ${examId}:`, response.data);
      
      // Extract result data safely, handling different response formats
      const result = extractSpecificData<any>(response.data, 'result');
      
      // Get resultId, which might be directly in the response data or in the result object
      const resultId = response.data?.resultId || 
                      response.data?.data?.resultId || 
                      (result && 'id' in result ? result.id : null) || 
                      null;
      
      if (!result || !resultId) {
        console.error('Failed to extract result data from response:', response.data);
        return {
          success: false,
          error: 'Failed to process exam submission'
        };
      }
      
      return {
        success: true,
        data: {
          result,
          resultId: String(resultId)
        }
      };
    } catch (error: any) {
      console.error(`Failed to submit exam ${examId}:`, error);
      return {
        success: false,
        error: error?.message || 'Failed to submit exam'
      };
    }
  }
};

export default examApi; 