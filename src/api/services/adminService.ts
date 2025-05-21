import apiClient from '../apiClient';
import { API_STRUCTURE } from '../api-structure.generated';
import { 
  AdminStats, 
  AdminStatsSchema,
  User,
  UserSchema,
  Section,
  SectionSchema,
  Exam,
  ExamSchema,
  ExamWithQuestions,
  ExamWithQuestionsSchema,
  PaginatedResponse
} from '../types';

/**
 * Admin Service
 * Handles all admin-specific API interactions
 */
class AdminService {
  /**
   * Get admin dashboard statistics
   */
  async getStats(): Promise<AdminStats> {
    const response = await apiClient.get<AdminStats>(
      API_STRUCTURE.admin.stats.get.path
    );
    
    // Parse response with Zod for type safety
    const stats = AdminStatsSchema.parse(response.data);
    
    return stats;
  }
  
  /**
   * Get all users (admin only)
   */
  async getUsers(params?: { 
    page?: number; 
    limit?: number; 
    search?: string;
  }): Promise<{ users: User[]; pagination: any }> {
    const response = await apiClient.get<{ 
      users: User[];
      pagination: any;
    }>(API_STRUCTURE.admin.users.getAll.path, params);
    
    // Parse response with Zod for type safety
    const users = response.data.users.map(user => UserSchema.parse(user));
    
    return {
      users,
      pagination: response.data.pagination
    };
  }
  
  /**
   * Get user by ID (admin only)
   */
  async getUserById(userId: string | number): Promise<User> {
    const url = apiClient.buildUrl(API_STRUCTURE.admin.users.getById.path, { userId });
    
    const response = await apiClient.get<User>(url);
    
    // Parse response with Zod for type safety
    const user = UserSchema.parse(response.data);
    
    return user;
  }
  
  /**
   * Update user (admin only)
   */
  async updateUser(userId: string | number, userData: Partial<User>): Promise<User> {
    const url = apiClient.buildUrl(API_STRUCTURE.admin.users.update.path, { userId });
    
    const response = await apiClient.put<User>(url, userData);
    
    // Parse response with Zod for type safety
    const user = UserSchema.parse(response.data);
    
    return user;
  }
  
  /**
   * Get all exams (admin only)
   */
  async getExams(params?: { 
    page?: number; 
    limit?: number; 
    sectionId?: number;
    search?: string;
  }): Promise<PaginatedResponse<Exam>> {
    const response = await apiClient.get<PaginatedResponse<Exam>>('/admin/exams', { params });
    return response.data;
  }
  
  /**
   * Get exam by ID (admin only)
   */
  async getExamById(examId: string | number): Promise<ExamWithQuestions> {
    const response = await apiClient.get<ExamWithQuestions>(`/admin/exams/${examId}`);
    const exam = ExamWithQuestionsSchema.parse(response.data);
    return exam;
  }
  
  /**
   * Create new exam (admin only)
   */
  async createExam(examData: Partial<ExamWithQuestions>): Promise<ExamWithQuestions> {
    const response = await apiClient.post<ExamWithQuestions>('/admin/exams', examData);
    const exam = ExamWithQuestionsSchema.parse(response.data);
    return exam;
  }
  
  /**
   * Update exam (admin only)
   */
  async updateExam(examId: string | number, examData: Partial<ExamWithQuestions>): Promise<ExamWithQuestions> {
    const response = await apiClient.put<ExamWithQuestions>(`/admin/exams/${examId}`, examData);
    const exam = ExamWithQuestionsSchema.parse(response.data);
    return exam;
  }
  
  /**
   * Delete exam (admin only)
   */
  async deleteExam(examId: string | number): Promise<void> {
    await apiClient.delete(`/admin/exams/${examId}`);
  }
  
  /**
   * Get all sections (admin only)
   */
  async getSections(): Promise<Section[]> {
    const response = await apiClient.get<{ sections: Section[] }>(
      API_STRUCTURE.admin.sections.getAll.path
    );
    
    // Parse response with Zod for type safety
    const sections = response.data.sections.map(section => SectionSchema.parse(section));
    
    return sections;
  }
  
  /**
   * Create new section (admin only)
   */
  async createSection(sectionData: { name: string; description?: string }): Promise<Section> {
    const response = await apiClient.post<Section>(
      API_STRUCTURE.admin.sections.create.path,
      sectionData
    );
    
    // Parse response with Zod for type safety
    const section = SectionSchema.parse(response.data);
    
    return section;
  }
  
  /**
   * Update section (admin only)
   */
  async updateSection(
    sectionId: string | number, 
    sectionData: { name?: string; description?: string; isActive?: boolean }
  ): Promise<Section> {
    const url = apiClient.buildUrl(API_STRUCTURE.admin.sections.update.path, { sectionId });
    
    const response = await apiClient.put<Section>(url, sectionData);
    
    // Parse response with Zod for type safety
    const section = SectionSchema.parse(response.data);
    
    return section;
  }
  
  /**
   * Delete section (admin only)
   */
  async deleteSection(sectionId: string | number): Promise<void> {
    const url = apiClient.buildUrl(API_STRUCTURE.admin.sections.delete.path, { sectionId });
    
    await apiClient.delete(url);
  }

  // Questions
  async deleteQuestion(questionId: string | number): Promise<void> {
    await apiClient.delete(`/admin/questions/${questionId}`);
  }
}

// Create and export a single instance
const adminService = new AdminService();
export default adminService; 