import React, { useEffect, lazy, Suspense } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate,
  createRoutesFromElements
} from 'react-router-dom';
import { 
  createBrowserRouter,
  RouterProvider,
  UNSAFE_DataRouterContext
} from 'react-router-dom';

// Global App Lock Flag - Set to false to enable maintenance mode
// const APP_ENABLED = true;

// This import is for future flags
import * as ReactRouter from "react-router";

// Enable future flags directly for React Router v6
// @ts-ignore - These properties might not exist on all React Router versions
if (ReactRouter.UNSAFE_useRoutesImpl && typeof ReactRouter.UNSAFE_useRoutesImpl === 'function') {
  // @ts-ignore
  ReactRouter.UNSAFE_useRoutesImpl.v7_startTransition = true;
  // @ts-ignore
  ReactRouter.UNSAFE_useRoutesImpl.v7_relativeSplatPath = true;
}

// Contexts
import { LoadingProvider } from './context/LoadingContext';
import { ErrorProvider } from './context/ErrorContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';

// Components
import ErrorDisplay from './components/ErrorDisplay';
import NotificationsDisplay from './components/NotificationsDisplay';
import MaintenancePage from './components/MaintenancePage';
import AppLock from './components/AppLock';

// Hooks
import useAOS from './hooks/useAOS';

// Pages
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import ExamPage from './pages/ExamPage';
import ResultPage from './pages/ResultPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy load admin pages
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'));
const AdminExamsPage = lazy(() => import('./pages/AdminExamsPage'));
const AdminCreateExamPage = lazy(() => import('./pages/AdminCreateExamPage'));
const AdminEditExamPage = lazy(() => import('./pages/AdminEditExamPage'));
const AdminStatsPage = lazy(() => import('./pages/AdminStatsPage'));
const AdminSectionsPage = lazy(() => import('./pages/AdminSectionsPage'));

// Utils
import { STORAGE } from './utils/constants';
import { examApi, fetchCsrfToken, API_FEATURES } from './utils/api';
import axios from 'axios';

// Simple fallback component for lazy loading
function LoadingFallback() {
  return <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>;
}

// Set the document title
document.title = 'ACS - نظام الاختبارات التعليمي';

// Function to attempt syncing pending submissions
const syncPendingSubmissions = async () => {
  const pendingSubmissionsRaw = localStorage.getItem(STORAGE.PENDING_SUBMISSIONS_KEY);
  if (!pendingSubmissionsRaw) return; // No pending submissions

  let pendingSubmissions = [];
  try {
    pendingSubmissions = JSON.parse(pendingSubmissionsRaw);
    if (!Array.isArray(pendingSubmissions) || pendingSubmissions.length === 0) {
      localStorage.removeItem(STORAGE.PENDING_SUBMISSIONS_KEY); // Clear invalid data
      return;
    }
  } catch (e) {
    console.error("Failed to parse pending submissions:", e);
    localStorage.removeItem(STORAGE.PENDING_SUBMISSIONS_KEY); // Clear corrupted data
    return;
  }

  console.log(`Attempting to sync ${pendingSubmissions.length} pending submissions...`);
  const remainingSubmissions = [...pendingSubmissions]; // Copy to modify while iterating

  for (let i = 0; i < pendingSubmissions.length; i++) {
    const submission = pendingSubmissions[i];
    try {
      // Check if submission payload is valid (basic check)
      if (!submission.examId || !submission.payload?.answers || !submission.payload?.timeSpent) {
          console.warn("Skipping invalid pending submission:", submission);
          remainingSubmissions.splice(remainingSubmissions.findIndex(s => s === submission), 1); // Remove invalid one
          continue; // Skip to next submission
      }

      console.log(`Syncing submission for exam ${submission.examId}...`);
      const response = await examApi.submitExam(submission.examId, submission.payload);
      
      if (response.error) {
        // Handle specific errors? e.g., 401 Unauthorized might mean user logged out
        console.error(`Failed to sync submission for exam ${submission.examId}:`, response.error);
        // Keep submission in the queue for retry? Or discard?
        // For now, let's keep it and try again later.
      } else {
        console.log(`Successfully synced submission for exam ${submission.examId}`);
        // Remove successful submission from the array we're tracking
        remainingSubmissions.splice(remainingSubmissions.findIndex(s => s === submission), 1);
      }
    } catch (error) {
      console.error(`Unexpected error syncing submission for exam ${submission.examId}:`, error);
      // Keep submission for retry on unexpected errors
    }
  }

  // Update localStorage with remaining submissions
  if (remainingSubmissions.length > 0) {
    localStorage.setItem(STORAGE.PENDING_SUBMISSIONS_KEY, JSON.stringify(remainingSubmissions));
    console.log(`${remainingSubmissions.length} submissions still pending.`);
  } else {
    localStorage.removeItem(STORAGE.PENDING_SUBMISSIONS_KEY);
    console.log('All pending submissions synced.');
  }
};

function AppContent() {
  // Initialize AOS just once in the app lifecycle
  useAOS({
    once: true,
    duration: 800,
    easing: 'ease-out-cubic',
    offset: 80
  });
  
  // Make app-wide modifications
  useEffect(() => {
    // Add app version to console (helpful for debugging)
    console.info('ACS App Version: 1.0.0');
    
    // Replace favicon (if needed)
    const favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement;
    if (favicon) {
      favicon.href = '/favicon.ico'; // Make sure to have this file in the public directory
    }
    
    // Fetch CSRF token on app initialization
    fetchCsrfToken().then(token => {
      if (token) {
        console.info('CSRF token initialized successfully');
      } else {
        // Don't show a warning - the API may not support CSRF tokens
        console.info('CSRF token not available - continuing without CSRF protection');
      }
    }).catch(error => {
      // Only log this as an error if it's not a 404 (endpoint not found)
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.info('CSRF token endpoint not available - continuing without CSRF protection');
      } else {
        console.error('Error initializing CSRF token:', error);
      }
    });
    
    // Set up timeout handler for fetch operations
    const originalFetch = window.fetch;
    window.fetch = function(input, init) {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout after 20s')), 20000);
      });
      
      return Promise.race([originalFetch(input, init), timeoutPromise]) as Promise<Response>;
    };
    
    return () => {
      // Restore original fetch when component unmounts
      window.fetch = originalFetch;
    };
  }, []);
  
  // Effect for handling online/offline status and syncing
  useEffect(() => {
    // Attempt sync on initial load if online
    if (navigator.onLine) {
      syncPendingSubmissions();
    }

    // Listen for online event
    const handleOnline = () => {
      console.log('Application came online. Checking for pending submissions...');
      syncPendingSubmissions();
    };

    window.addEventListener('online', handleOnline);

    // Cleanup listener
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []); // Run only once on mount
  
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />
      
      {/* Protected user routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <HomePage />
        </ProtectedRoute>
      } />
      
      <Route path="/exam/:examId" element={
        <ProtectedRoute>
          <ExamPage />
        </ProtectedRoute>
      } />
      
      <Route path="/result/:resultId" element={
        <ProtectedRoute>
          <ResultPage />
        </ProtectedRoute>
      } />
      
      <Route path="/profile" element={
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      } />
      
      {/* Wrap Admin routes (including login) in Suspense */}
      <Route
        path="/admin/*" // Match all routes starting with /admin
        element={
          <Suspense fallback={<LoadingFallback />}>
            <Routes> {/* Nested Routes for admin section */}
              <Route path="/login" element={<AdminLoginPage />} />
              
              <Route path="/dashboard" element={
        <ProtectedRoute adminOnly>
          <AdminDashboardPage />
        </ProtectedRoute>
      } />
      
              <Route path="/users" element={
        <ProtectedRoute adminOnly>
          <AdminUsersPage />
        </ProtectedRoute>
      } />
      
              <Route path="/exams" element={
        <ProtectedRoute adminOnly>
          <AdminExamsPage />
        </ProtectedRoute>
      } />
      
              <Route path="/exams/create" element={
        <ProtectedRoute adminOnly>
          <AdminCreateExamPage />
        </ProtectedRoute>
      } />
      
              <Route path="/exams/edit/:examId" element={
        <ProtectedRoute adminOnly>
          <AdminEditExamPage />
        </ProtectedRoute>
      } />
      
              <Route path="/stats" element={
        <ProtectedRoute adminOnly>
          <AdminStatsPage />
        </ProtectedRoute>
      } />
      
              <Route path="/sections" element={
        <ProtectedRoute adminOnly>
          <AdminSectionsPage />
        </ProtectedRoute>
      } />
      
              {/* Optional: Redirect base /admin to /admin/dashboard or handle differently */}
              <Route index element={<Navigate to="/admin/dashboard" replace />} /> 
              
              {/* Catch-all for non-matched admin routes - could render admin-specific 404 */}
              <Route path="*" element={<NotFoundPage />} /> 
            </Routes>
          </Suspense>
        }
      />
      
      {/* 404 page for any unknown top-level routes */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <LoadingProvider>
            <ErrorProvider>
              <NotificationProvider>
                {/* Use AppLock component instead of inline maintenance check */}
                <AppLock>
                  <ErrorDisplay />
                  <NotificationsDisplay />
                  <AppContent />
                </AppLock>
              </NotificationProvider>
            </ErrorProvider>
          </LoadingProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
