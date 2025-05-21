import apiClient from '../apiClient';
import { API_STRUCTURE } from '../api-structure.generated';
import { 
  UserExamResult, 
  UserExamResultSchema,
  ResultDetails,
  ResultDetailsSchema
} from '../types';

/**
 * Result Service
 * Handles all exam result-related API interactions
 */
class ResultService {
  /**
   * Get all results for the current user
   */
  async getAllResults(): Promise<UserExamResult[]> {
    const response = await apiClient.get<{ results: UserExamResult[] }>(
      API_STRUCTURE.results.getAll.path
    );
    
    // Parse response with Zod for type safety
    const results = response.data.results.map(result => UserExamResultSchema.parse(result));
    
    return results;
  }
  
  /**
   * Get detailed result by ID
   */
  async getResultById(resultId: string | number): Promise<ResultDetails> {
    const url = apiClient.buildUrl(API_STRUCTURE.results.getById.path, { resultId });
    
    const response = await apiClient.get<{ result: ResultDetails }>(url);
    
    // Parse response with Zod for type safety
    const result = ResultDetailsSchema.parse(response.data.result);
    
    return result;
  }
  
  /**
   * Share result with others
   */
  async shareResult(resultId: string | number): Promise<{ shareUrl: string }> {
    const url = apiClient.buildUrl(API_STRUCTURE.results.share.path, { resultId });
    
    const response = await apiClient.post<{ shareUrl: string }>(url);
    
    return { shareUrl: response.data.shareUrl };
  }
}

// Create and export a single instance
const resultService = new ResultService();
export default resultService; 