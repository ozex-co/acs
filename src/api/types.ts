import { z } from 'zod';

/**
 * API Response Schemas
 */

// Common API response structure
export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) => 
  z.object({
    success: z.boolean(),
    message: z.string().optional(),
    data: dataSchema,
    code: z.string().optional(),
  });

// Error response structure
export const ApiErrorSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  code: z.string().optional(),
  details: z.any().optional(),
  fieldErrors: z.record(z.array(z.string())).optional(),
});

/**
 * User & Auth Schemas
 */

// User schema
export const UserSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  phone: z.string(),
  email: z.string().nullable().optional(),
  dateOfBirth: z.string().optional(),
  age: z.number().optional(),
  lastLoginAt: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  isAdmin: z.boolean().default(false),
  completedExams: z.array(z.string()).optional()
});

// Admin schema
export const AdminSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string().nullable().optional(),
  isAdmin: z.literal(true),
});

// Auth response schema
export const AuthResponseSchema = z.object({
  token: z.string(),
  user: UserSchema.optional(),
  admin: AdminSchema.optional(),
});

// CSRF token response
export const CsrfTokenSchema = z.object({
  csrfToken: z.string(),
});

/**
 * Exam Schemas
 */

// Section schema
export const SectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

// Exam option schema
export const ExamOptionSchema = z.union([
  z.array(z.string()),
  z.array(z.object({
    id: z.string(),
    text: z.string()
  }))
]);

// Exam question schema
export const ExamQuestionSchema = z.object({
  id: z.string(),
  text: z.string(),
  options: ExamOptionSchema,
  correctOption: z.string().optional(), // Only available for admins
  correctOptionId: z.string().optional(), // Store the ID of the correct option for easier validation
  explanation: z.string().optional(),
  imageUrl: z.string().optional(),
  orderIndex: z.number().default(0),
});

// Basic exam schema 
export const ExamSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  questionsCount: z.number(),
  duration: z.number(),
  sectionId: z.string(),
  section: z.object({
    id: z.string(),
    name: z.string(),
  }).optional(),
  difficulty: z.union([z.number(), z.string()]).transform((val: number | string) => 
    typeof val === 'string' ? parseInt(val, 10) : val
  ),
  minAge: z.number().optional(),
  maxAge: z.number().optional(),
  isPublic: z.boolean().default(false),
  isActive: z.boolean().default(true),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

// Exam with questions schema
export const ExamWithQuestionsSchema = ExamSchema.extend({
  questions: z.array(ExamQuestionSchema),
});

// Exam summary schema for listing
export const ExamSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  section: z.object({
    id: z.string(),
    name: z.string(),
  }).optional(),
  questionsCount: z.number(),
  duration: z.number(),
  difficulty: z.union([z.number(), z.string()]).transform((val: number | string) => 
    typeof val === 'string' ? parseInt(val, 10) : val
  ),
});

/**
 * Result Schemas
 */

// Basic exam result schema
export const UserExamResultSchema = z.object({
  id: z.string(),
  examId: z.string(),
  examTitle: z.string(),
  score: z.number(),
  totalQuestions: z.number(),
  percentage: z.number(),
  timeSpent: z.number(),
  createdAt: z.string().optional(),
  completedAt: z.string().optional(),
  section: z.object({
    id: z.string(),
    name: z.string(),
  }).optional(),
});

// Result with answer details schema
export const ResultDetailsSchema = UserExamResultSchema.extend({
  answers: z.array(z.object({
    questionId: z.string(),
    questionText: z.string(),
    options: z.array(z.string()),
    selectedOption: z.number(),
    correctOption: z.number(),
    isCorrect: z.boolean(),
    explanation: z.string().optional(),
  })),
});

/**
 * Admin Schemas
 */

export const AdminStatsSchema = z.object({
  usersCount: z.number(),
  examsCount: z.number(),
  resultsCount: z.number(),
  recentResults: z.array(UserExamResultSchema),
  topExams: z.array(z.object({
    id: z.string(),
    title: z.string(),
    attempts: z.number(),
  })),
});

/**
 * Request Schemas
 */

// Register request
export const RegisterRequestSchema = z.object({
  fullName: z.string().min(2, 'الاسم الكامل مطلوب'),
  phone: z.string().min(10, 'رقم الهاتف غير صحيح'),
  email: z.string().email('البريد الإلكتروني غير صحيح').optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'تاريخ الميلاد غير صحيح (YYYY-MM-DD)'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون على الأقل 6 أحرف'),
});

// Login request
export const LoginRequestSchema = z.object({
  phone: z.string().min(10, 'رقم الهاتف غير صحيح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون على الأقل 6 أحرف'),
});

// Admin login request
export const AdminLoginRequestSchema = z.object({
  username: z.string().min(3, 'اسم المستخدم غير صحيح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون على الأقل 6 أحرف'),
});

// Update profile request
export const UpdateProfileRequestSchema = z.object({
  fullName: z.string().min(2, 'الاسم الكامل مطلوب').optional(),
  email: z.string().email('البريد الإلكتروني غير صحيح').optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'تاريخ الميلاد غير صحيح (YYYY-MM-DD)').optional(),
});

// Change password request
export const ChangePasswordRequestSchema = z.object({
  currentPassword: z.string().min(6, 'كلمة المرور الحالية يجب أن تكون على الأقل 6 أحرف'),
  newPassword: z.string().min(6, 'كلمة المرور الجديدة يجب أن تكون على الأقل 6 أحرف'),
});

// Submit exam request
export const SubmitExamRequestSchema = z.object({
  answers: z.array(z.object({
    questionId: z.string(),
    selectedOption: z.number(),
  })),
  timeSpent: z.number().min(0),
});

// Response Types (inferred from schemas)
export type ApiResponse<T> = z.infer<ReturnType<typeof ApiResponseSchema<z.ZodType<T>>>>;
export type ApiError = z.infer<typeof ApiErrorSchema>;
export type User = z.infer<typeof UserSchema>;
export type Admin = z.infer<typeof AdminSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
export type Section = z.infer<typeof SectionSchema>;
export type ExamQuestion = z.infer<typeof ExamQuestionSchema>;
export type Exam = z.infer<typeof ExamSchema>;
export type ExamWithQuestions = z.infer<typeof ExamWithQuestionsSchema>;
export type ExamSummary = z.infer<typeof ExamSummarySchema>;
export type UserExamResult = z.infer<typeof UserExamResultSchema>;
export type ResultDetails = z.infer<typeof ResultDetailsSchema>;
export type AdminStats = z.infer<typeof AdminStatsSchema>;

// Request Types
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type AdminLoginRequest = z.infer<typeof AdminLoginRequestSchema>;
export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequestSchema>;
export type ChangePasswordRequest = z.infer<typeof ChangePasswordRequestSchema>;
export type SubmitExamRequest = z.infer<typeof SubmitExamRequestSchema>;

// Common types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  firstName: string;
  lastName: string;
}

// API Response types have been removed (duplicate with Zod schemas) 