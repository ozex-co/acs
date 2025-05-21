/**
 * API STRUCTURE DOCUMENTATION
 * 
 * This file is auto-generated based on backend API endpoints.
 * It serves as a single source of truth for all API endpoints used in the application.
 * 
 * Base URL: /api
 */

export const API_STRUCTURE = {
  baseUrl: '/api',
  
  // Authentication endpoints
  auth: {
    register: {
      path: '/auth/register',
      method: 'POST',
      requiresAuth: false,
      description: 'Register a new user',
      requestBody: {
        fullName: 'string',
        phone: 'string',
        email: 'string (optional)',
        dateOfBirth: 'YYYY-MM-DD',
        password: 'string'
      }
    },
    
    login: {
      path: '/auth/login',
      method: 'POST',
      requiresAuth: false,
      description: 'User login',
      requestBody: {
        phone: 'string',
        password: 'string'
      }
    },
    
    adminLogin: {
      path: '/auth/admin/login',
      method: 'POST',
      requiresAuth: false,
      description: 'Admin login',
      requestBody: {
        username: 'string',
        password: 'string'
      }
    },
    
    logout: {
      path: '/auth/logout',
      method: 'POST',
      requiresAuth: true,
      description: 'User logout'
    },
    
    adminLogout: {
      path: '/auth/admin/logout',
      method: 'POST',
      requiresAuth: true,
      description: 'Admin logout'
    },
    
    csrfToken: {
      path: '/api/csrf-token',
      method: 'GET',
      requiresAuth: false,
      description: 'Get CSRF token'
    }
  },
  
  // User endpoints
  user: {
    profile: {
      path: '/user/profile',
      method: 'GET',
      requiresAuth: true,
      description: 'Get user profile'
    },
    
    updateProfile: {
      path: '/user/profile',
      method: 'PUT',
      requiresAuth: true,
      description: 'Update user profile',
      requestBody: {
        fullName: 'string (optional)',
        email: 'string (optional)',
        dateOfBirth: 'YYYY-MM-DD (optional)'
      }
    },
    
    changePassword: {
      path: '/user/password',
      method: 'PUT',
      requiresAuth: true,
      description: 'Change user password',
      requestBody: {
        currentPassword: 'string',
        newPassword: 'string'
      }
    },
    
    results: {
      path: '/user/results',
      method: 'GET',
      requiresAuth: true,
      description: 'Get user\'s exam results'
    },
    
    resultById: {
      path: '/user/results/:resultId',
      method: 'GET',
      requiresAuth: true,
      description: 'Get specific result details',
      urlParams: {
        resultId: 'number'
      }
    }
  },
  
  // Exams endpoints
  exams: {
    getAll: {
      path: '/exams',
      method: 'GET',
      requiresAuth: true,
      description: 'Get available exams',
      queryParams: {
        page: 'number (optional, default: 1)',
        limit: 'number (optional, default: 20)',
        section: 'number (optional, filter by section)'
      }
    },
    
    getById: {
      path: '/exams/:examId',
      method: 'GET',
      requiresAuth: true,
      description: 'Get specific exam by ID with questions',
      urlParams: {
        examId: 'number'
      }
    },
    
    submit: {
      path: '/exams/:examId/submit',
      method: 'POST',
      requiresAuth: true,
      description: 'Submit exam answers for grading',
      urlParams: {
        examId: 'number'
      },
      requestBody: {
        answers: 'Array of { questionId: number, selectedOption: number }',
        timeSpent: 'number (seconds)'
      }
    }
  },
  
  // Results endpoints
  results: {
    getAll: {
      path: '/results',
      method: 'GET',
      requiresAuth: true,
      description: 'Get all results for the current user'
    },
    
    getById: {
      path: '/results/:resultId',
      method: 'GET',
      requiresAuth: true,
      description: 'Get a specific result',
      urlParams: {
        resultId: 'number'
      }
    },
    
    share: {
      path: '/results/:resultId/share',
      method: 'POST',
      requiresAuth: true,
      description: 'Share a result',
      urlParams: {
        resultId: 'number'
      }
    }
  },
  
  // Sections endpoints
  sections: {
    getAll: {
      path: '/sections',
      method: 'GET',
      requiresAuth: false,
      description: 'Get all sections'
    }
  },
  
  // Admin endpoints
  admin: {
    users: {
      getAll: {
        path: '/admin/users',
        method: 'GET',
        requiresAuth: true,
        requiresAdmin: true,
        description: 'Get all users (admin only)',
        queryParams: {
          page: 'number (optional, default: 1)',
          limit: 'number (optional, default: 20)',
          search: 'string (optional, search by name or phone)'
        }
      },
      
      getById: {
        path: '/admin/users/:userId',
        method: 'GET',
        requiresAuth: true,
        requiresAdmin: true,
        description: 'Get user by ID (admin only)',
        urlParams: {
          userId: 'number'
        }
      },
      
      update: {
        path: '/admin/users/:userId',
        method: 'PUT',
        requiresAuth: true,
        requiresAdmin: true,
        description: 'Update user (admin only)',
        urlParams: {
          userId: 'number'
        },
        requestBody: {
          fullName: 'string (optional)',
          email: 'string (optional)',
          dateOfBirth: 'YYYY-MM-DD (optional)',
          isActive: 'boolean (optional)'
        }
      }
    },
    
    exams: {
      getAll: {
        path: '/admin/exams',
        method: 'GET',
        requiresAuth: true,
        requiresAdmin: true,
        description: 'Get all exams (admin only)',
        queryParams: {
          page: 'number (optional, default: 1)',
          limit: 'number (optional, default: 20)',
          sectionId: 'number (optional)',
          search: 'string (optional)'
        }
      },
      
      getById: {
        path: '/admin/exams/:examId',
        method: 'GET',
        requiresAuth: true,
        requiresAdmin: true,
        description: 'Get exam by ID (admin only)',
        urlParams: {
          examId: 'number'
        }
      },
      
      create: {
        path: '/admin/exams',
        method: 'POST',
        requiresAuth: true,
        requiresAdmin: true,
        description: 'Create new exam (admin only)',
        requestBody: {
          title: 'string',
          description: 'string (optional)',
          sectionId: 'number',
          duration: 'number (minutes)',
          minAge: 'number (optional)',
          maxAge: 'number (optional)',
          difficulty: 'string',
          isPublic: 'boolean',
          questions: 'Array of exam questions'
        }
      },
      
      update: {
        path: '/admin/exams/:examId',
        method: 'PUT',
        requiresAuth: true,
        requiresAdmin: true,
        description: 'Update exam (admin only)',
        urlParams: {
          examId: 'number'
        },
        requestBody: {
          title: 'string (optional)',
          description: 'string (optional)',
          sectionId: 'number (optional)',
          duration: 'number (optional)',
          minAge: 'number (optional)',
          maxAge: 'number (optional)',
          difficulty: 'string (optional)',
          isPublic: 'boolean (optional)',
          isActive: 'boolean (optional)',
          questions: 'Array of exam questions (optional)'
        }
      },
      
      delete: {
        path: '/admin/exams/:examId',
        method: 'DELETE',
        requiresAuth: true,
        requiresAdmin: true,
        description: 'Delete exam (admin only)',
        urlParams: {
          examId: 'number'
        }
      }
    },
    
    sections: {
      getAll: {
        path: '/admin/sections',
        method: 'GET',
        requiresAuth: true,
        requiresAdmin: true,
        description: 'Get all sections (admin only)'
      },
      
      create: {
        path: '/admin/sections',
        method: 'POST',
        requiresAuth: true,
        requiresAdmin: true,
        description: 'Create new section (admin only)',
        requestBody: {
          name: 'string',
          description: 'string (optional)'
        }
      },
      
      update: {
        path: '/admin/sections/:sectionId',
        method: 'PUT',
        requiresAuth: true,
        requiresAdmin: true,
        description: 'Update section (admin only)',
        urlParams: {
          sectionId: 'number'
        },
        requestBody: {
          name: 'string (optional)',
          description: 'string (optional)',
          isActive: 'boolean (optional)'
        }
      },
      
      delete: {
        path: '/admin/sections/:sectionId',
        method: 'DELETE',
        requiresAuth: true,
        requiresAdmin: true,
        description: 'Delete section (admin only)',
        urlParams: {
          sectionId: 'number'
        }
      }
    },
    
    stats: {
      get: {
        path: '/admin/stats',
        method: 'GET',
        requiresAuth: true,
        requiresAdmin: true,
        description: 'Get admin dashboard statistics'
      }
    }
  }
};

export default API_STRUCTURE; 