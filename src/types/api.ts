// src/types/api.ts

/**
 * API Response Types
 */

/**
 * Common API Response Structure
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
  code?: string;
}

/**
 * API Error Response Structure
 */
export interface ApiErrorResponse {
  success: false;
  message: string;
  code?: string;
  details?: any;
  fieldErrors?: Record<string, string[]>;
}

/**
 * API Handler Response (internal frontend structure)
 */
export interface ApiHandlerResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
  status?: number;
  rawResponse?: any;
}

/**
 * Authentication Response Structures
 */
export interface User {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  dateOfBirth?: string;
  isAdmin: boolean;
}

export interface Admin {
  id: string;
  username: string;
  email?: string;
  // Add other admin-specific fields from backend if necessary
  // isAdmin property might be implicitly true or can be explicitly set
  isAdmin: true; 
}

export interface AuthResponse {
  token: string;
  user?: User;   // User object for user login/refresh
  admin?: Admin; // Admin object for admin login/refresh
}

/**
 * Exam Option Interface
 */
export interface ExamOption {
  id: string;
  text: string;
}

/**
 * Exam-related Responses
 */
export interface Exam {
  id: string;
  title: string;
  description: string;
  questionsCount: number;
  duration: number;
  sectionId: string;
  section?: {
    id: string;
    name: string;
  };
  difficulty: number;
  minAge?: number;
  maxAge?: number;
  isPublic: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExamQuestion {
  id: string;
  text: string;
  options: ExamOption[] | string[];
  correctOption?: number; // Only available for admins
  explanation?: string;
  imageUrl?: string;
  orderIndex: number;
  type?: 'multiple-choice' | 'true-false' | 'short-answer' | 'matching' | 'ordering';
  matchingPairs?: {
    id: string;
    left: string;
    right: string;
  }[];
  orderingItems?: {
    id: string;
    text: string;
    position?: number;
  }[];
}

export interface ExamWithQuestions extends Exam {
  questions: ExamQuestion[];
  sectionName?: string;
}

export interface ExamSummary {
  id: string;
  title: string;
  description: string;
  section: {
    id: string;
    name: string;
  };
  questionsCount: number;
  duration: number;
  difficulty: number;
}

export interface GetExamsResponse {
  exams: ExamSummary[];
}

export interface GetExamByIdResponse {
  exam: ExamWithQuestions;
}

/**
 * Interface for response from submitting an exam
 */
export interface SubmitExamResponse {
  resultId?: string | number;
  result?: {
    id: string | number;
    score: number;
    totalQuestions: number;
    percentage: number;
  };
  id?: string | number; // Added for direct response format
}

/**
 * User-related Responses
 */
export interface UpdateUserProfileResponse {
  user: {
    id: string;
    fullName: string;
    phone: string;
    email?: string;
  };
}

/**
 * Result-related Responses
 */
export interface UserExamResult {
  id: string;
  examId: string;
  examTitle: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  timeSpent: number;
  createdAt: string;
  completedAt?: string;
  section?: {
    id: string;
    name: string;
  };
}

export interface ResultDetails extends UserExamResult {
  answers: {
    questionId: string;
    questionText: string;
    options: string[];
    selectedOption: number;
    correctOption: number;
    isCorrect: boolean;
    explanation?: string;
  }[];
}

export interface GetResultsResponse {
  results: UserExamResult[];
}

export interface GetResultByIdResponse {
  result: ResultDetails;
}

/**
 * Section-related Responses
 */
export interface Section {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
}

export interface GetSectionsResponse {
  sections: Section[];
}

/**
 * Admin-related Responses
 */
export interface AdminStatsResponse {
  usersCount: number;
  examsCount: number;
  resultsCount: number;
  recentResults: UserExamResult[];
  topExams: {
    id: string;
    title: string;
    attempts: number;
  }[];
} 