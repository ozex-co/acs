import apiClient from '../apiClient';
import { API_STRUCTURE } from '../api-structure.generated';
import { 
  ExamSummary, 
  ExamSummarySchema,
  ExamWithQuestions,
  ExamWithQuestionsSchema,
  SubmitExamRequest,
  SubmitExamRequestSchema,
  UserExamResult,
  UserExamResultSchema
} from '../types';

/**
 * Exam Service
 * Handles all exam-related API interactions
 */
class ExamService {
  /**
   * Get all available exams with optional filtering
   */
  async getAllExams(params?: { 
    page?: number; 
    limit?: number; 
    section?: number;
  }): Promise<ExamSummary[]> {
    const response = await apiClient.get<{ exams: ExamSummary[] }>(
      API_STRUCTURE.exams.getAll.path,
      params
    );
    
    // Parse response with Zod for type safety
    const exams = response.data.exams.map(exam => ExamSummarySchema.parse(exam));
    
    return exams;
  }
  
  /**
   * Get specific exam by ID with full questions
   */
  async getExamById(examId: string | number): Promise<ExamWithQuestions> {
    const url = apiClient.buildUrl(API_STRUCTURE.exams.getById.path, { examId });
    
    const response = await apiClient.get<{ exam: ExamWithQuestions }>(url);
    
    // Parse response with Zod for type safety
    const exam = ExamWithQuestionsSchema.parse(response.data.exam);
    
    return exam;
  }
  
  /**
   * Submit exam answers for grading
   */
  async submitExam(
    examId: string | number, 
    answers: Array<{
      questionId: string;
      selectedOptionId?: string; 
      answerText?: string;
      matchingAnswers?: Array<{ leftId: string; rightId: string; }>;
      orderingAnswer?: string[];
    }>,
    timeSpent: number
  ): Promise<UserExamResult> {
    // Format data for the API
    const requestData = {
      answers,
      timeSpent
    };
    
    const url = apiClient.buildUrl(API_STRUCTURE.exams.submit.path, { examId });
    
    const response = await apiClient.post<{ 
      result: UserExamResult;
      resultId: string; // Some backends may return resultId at top level
    }>(url, requestData);
    
    // Parse response with Zod for type safety
    const result = UserExamResultSchema.parse(response.data.result);
    
    return result;
  }
}

// Create and export a single instance
const examService = new ExamService();
export default examService; 