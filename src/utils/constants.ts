/**
 * Application Constants
 */

// App metadata
export const APP = {
  NAME: 'ACS',
  FULL_NAME: 'ACS - نظام الاختبارات التعليمي',
  VERSION: '1.0.0',
  DESCRIPTION: 'منصة تعليمية متكاملة للاختبارات والتقييم',
  COPYRIGHT: `© ${new Date().getFullYear()} ACS. جميع الحقوق محفوظة`,
};

// Theme settings
export const THEME = {
  PRIMARY_COLOR: '#00bcd4', // Updated cyan primary
  SECONDARY_COLOR: '#4f46e5', // Indigo as secondary
  ACCENT_COLOR: '#67e8f9', // Cyan-300
  LIGHT_BG: '#ffffff',
  DARK_BG: '#0c0a09',
  CONTAINER_BG: '#f0f9ff', // Light blue-50
  CARD_BG: '#f1f5f9', // Slate-100
  TEXT_LIGHT: '#475569', // Slate-600
  HEADING_LIGHT: '#0e7490', // Cyan-700
};

// API settings
export const API = {
  // Use environment variable for base URL, fallback to localhost for development
  BASE_URL: 'http://localhost:5000',
  TIMEOUT: 20000, // Default API request timeout in ms
  RETRY_ATTEMPTS: 2, // Default retry attempts for failed requests
  // Auth endpoints
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  LOGOUT: '/api/auth/logout',
  ADMIN_LOGIN: '/api/auth/q0z3x-management/login',
  ADMIN_LOGOUT: '/api/auth/q0z3x-management/logout',
  REFRESH_TOKEN: '/api/auth/refresh',
  ADMIN_REFRESH_TOKEN: '/api/auth/q0z3x-management/refresh',
  // User endpoints
  USER_PROFILE: '/api/user/profile',
  USER_RESULTS: '/api/user/results',
  // Admin endpoints
  ADMIN_PROFILE: '/api/admin/profile',
  ADMIN_USERS: '/api/admin/users',
  ADMIN_DASHBOARD: '/api/admin/dashboard',
  ADMIN_EXAMS: '/api/admin/exams',
  ADMIN_SECTIONS: '/api/admin/sections',
  ADMIN_STATS: '/api/admin/stats',
  // Public endpoints
  EXAMS: '/api/exams',
  SECTIONS: '/api/sections',
  HEALTH: '/api/health',
  VERSION: '/api/version',
  CSRF_TOKEN: '/api/csrf-token',
};

// Storage keys
export const STORAGE = {
  USER_DATA: 'userData',
  ADMIN_DATA: 'adminData',
  THEME: 'acs_theme',
  LOCALE: 'acs_locale',
  PENDING_SUBMISSIONS_KEY: 'acs_pending_submissions', // Key for offline submissions
  EXAM_ANSWERS_PREFIX: 'acs_exam_answers_', // Prefix for auto-saved answers (e.g., acs_exam_answers_123)
  EXAM_DATA_PREFIX: 'acs_exam_data_', // Prefix for cached exam data (e.g., acs_exam_data_123)
  CSRF_TOKEN: 'csrf_token', // Key for CSRF token storage
};

// Animation settings
export const ANIMATIONS = {
  DEFAULT_DURATION: 800,
  DEFAULT_DELAY: 150,
  STAGGER_DELAY: 75,
  EASING: 'ease-out-cubic',
};

// Route paths
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  PROFILE: '/profile',
  EXAM: '/exam',
  RESULT: '/result',
  ADMIN: {
    LOGIN: '/admin/login',
    DASHBOARD: '/admin/dashboard',
    USERS: '/admin/users',
    EXAMS: '/admin/exams',
    SECTIONS: '/admin/sections',
  },
};

// Add exports for compatibility with existing code
export const API_ROUTES = {
  BASE_URL: API.BASE_URL,
  LOGIN: API.LOGIN,
  REGISTER: API.REGISTER,
  LOGOUT: API.LOGOUT,
  ADMIN_LOGIN: API.ADMIN_LOGIN,
  ADMIN_LOGOUT: API.ADMIN_LOGOUT,
  REFRESH_TOKEN: API.REFRESH_TOKEN,
  ADMIN_REFRESH_TOKEN: API.ADMIN_REFRESH_TOKEN,
  USER_PROFILE: API.USER_PROFILE,
  USER_RESULTS: API.USER_RESULTS,
  ADMIN_PROFILE: API.ADMIN_PROFILE,
  ADMIN_DASHBOARD: API.ADMIN_DASHBOARD,
  ADMIN_USERS: API.ADMIN_USERS,
  ADMIN_EXAMS: API.ADMIN_EXAMS,
  ADMIN_SECTIONS: API.ADMIN_SECTIONS,
  ADMIN_STATS: API.ADMIN_STATS,
  EXAMS: API.EXAMS,
  SECTIONS: API.SECTIONS,
  CSRF_TOKEN: API.CSRF_TOKEN,
  
  // Dynamic route generators
  EXAM: (id: string | number) => `${API.EXAMS}/${id}`,
  USER_RESULT: (id: string | number) => `${API.USER_RESULTS}/${id}`,
  ADMIN_USER: (id: string | number) => `${API.ADMIN_USERS}/${id}`,
  ADMIN_EXAM: (id: string | number) => `${API.ADMIN_EXAMS}/${id}`,
  ADMIN_SECTION: (id: string | number) => `${API.ADMIN_SECTIONS}/${id}`,
  EXAM_SUBMIT: (id: string | number) => `${API.EXAMS}/${id}/submit`,
  
  // For backwards compatibility
  GET_EXAMS: API.EXAMS,
  GET_EXAM: (id: string | number) => `${API.EXAMS}/${id}`,
  SUBMIT_EXAM: (id: string | number) => `${API.EXAMS}/${id}/submit`,
  GET_RESULTS: API.USER_RESULTS,
  GET_RESULT: (id: string | number) => `${API.USER_RESULTS}/${id}`,
  GET_SECTIONS: API.SECTIONS
};

export const STORAGE_KEYS = {
  USER: STORAGE.USER_DATA,
  ADMIN: STORAGE.ADMIN_DATA,
  THEME: STORAGE.THEME,
  LOCALE: STORAGE.LOCALE,
  CSRF_TOKEN: 'csrf_token',
  PENDING_SUBMISSIONS: STORAGE.PENDING_SUBMISSIONS_KEY,
  EXAM_ANSWERS_PREFIX: STORAGE.EXAM_ANSWERS_PREFIX,
  EXAM_DATA_PREFIX: STORAGE.EXAM_DATA_PREFIX
}; 