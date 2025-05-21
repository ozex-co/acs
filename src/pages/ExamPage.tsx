import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import QuestionCard from '../components/QuestionCard'
import Button from '../components/Button'
import Loader from '../components/Loader'
import ProgressBar from '../components/ProgressBar'
import { useLoading } from '../context/LoadingContext'
import { useAuth } from '../context/AuthContext'
import { useError } from '../context/ErrorContext'
import { examApi } from '../utils/api'
import { API_ROUTES } from '../utils/constants'
import ErrorMessage from '../components/ErrorMessage'
import { STORAGE } from '../utils/constants'
import EmptyState from '../components/EmptyState'
import LoadingOverlay from '../components/LoadingOverlay'

// Define types locally
interface Option {
  id: string;
  text: string;
}

interface MatchingPair {
  id: string;
  left: string;
  right: string;
}

interface OrderingItem {
  id: string;
  text: string;
  position?: number;
}

interface Question {
  id: string;
  text: string;
  type?: 'multiple-choice' | 'true-false' | 'short-answer' | 'matching' | 'ordering';
  options: Option[];
  matchingPairs?: MatchingPair[];
  orderingItems?: OrderingItem[];
}

interface Exam {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  duration: number; // in minutes
}

const ExamPage = () => {
  const { examId } = useParams<{ examId: string }>()
  const navigate = useNavigate()
  const { startLoading, stopLoading } = useLoading()
  const { user, isUserLoggedIn } = useAuth()
  const { showError } = useError()
  
  const [exam, setExam] = useState<Exam | null>(null)
  const [isLoadingExam, setIsLoadingExam] = useState(true)
  const [isQuestionLoading, setIsQuestionLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})
  const [timeRemaining, setTimeRemaining] = useState(0) // in seconds
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showTypewriter, setShowTypewriter] = useState(true)
  const timerIntervalRef = useRef<number | null>(null)
  const lastVisibleTimestampRef = useRef<number | null>(null)
  const [isTimeUp, setIsTimeUp] = useState(false)
  
  // Add state for other question types
  const [shortAnswers, setShortAnswers] = useState<Record<string, string>>({})
  const [matchingSelections, setMatchingSelections] = useState<Record<string, Record<string, string>>>({})
  const [orderingSelections, setOrderingSelections] = useState<Record<string, OrderingItem[]>>({})
  
  // Use constants for localStorage keys
  const getStorageKey = useCallback((id: string | undefined) => id ? `${STORAGE.EXAM_ANSWERS_PREFIX}${id}` : null, [])
  const getExamDataStorageKey = useCallback((id: string | undefined) => id ? `${STORAGE.EXAM_DATA_PREFIX}${id}` : null, [])
  
  // Fetch exam data & Load saved answers/offline data
  useEffect(() => {
    const fetchExam = async () => {
      if (!examId) return
      const storageKey = getStorageKey(examId)
      const examDataStorageKey = getExamDataStorageKey(examId)
      
      setIsLoadingExam(true)
      setError('')
      startLoading('fetch-exam', 'جاري تحميل الاختبار...')
      
      let loadedFromCache = false

      try {
        console.log(`Fetching exam ${examId}... Online: ${navigator.onLine}`)

        // Validate examId format before making the API call
        const parsedExamId = parseInt(examId.toString());
        if (isNaN(parsedExamId) || parsedExamId <= 0) {
          throw new Error('معرف الاختبار غير صالح، يجب أن يكون رقمًا صحيحًا موجبًا');
        }

        // Log the URL we're requesting (this will help debug API issues)
        console.log(`Requesting URL: ${API_ROUTES.GET_EXAM(examId)}`);
        
        // Attempt online fetch first
        const response = await examApi.getExamById(examId)
        
        // Enhanced debugging to understand the API response structure
        console.log(`Exam API response for ID ${examId}:`, response);
        console.log(`Response data:`, response.data);
        console.log(`Response error:`, response.error);
        
        // Inspect the raw response structure from the API
        if (response.data) {
          console.log("Exam response data:", response.data);
        }
        
        if (response.error || !response.data || !response.data.exam) {
          // Log the error details
          console.error(`Error fetching exam ${examId}:`, response.error);
          console.error(`Response data structure:`, response.data);
          
          // Generate a user-friendly error message
          let errorMessage = 'فشل في تحميل الاختبار';
          if (response.error) {
            // Handle validation errors specifically
            if (response.error.includes('Validation') || response.error.includes('Invalid exam ID')) {
              errorMessage = 'رقم الاختبار غير صالح';
            } else {
              // Use the API error message directly
              errorMessage = response.error;
            }
          }
          
          // Throw error to potentially trigger offline load with the more specific message
          throw new Error(errorMessage);
        }
        
        // Online fetch successful
        const examData = response.data.exam
        
        // Validate exam has valid structure
        if (!examData) {
          throw new Error('لم يتم العثور على بيانات الاختبار');
        }
        
        console.log(`Successfully fetched exam ${examId}:`, examData);
        
        const validatedExam = validateAndStructureExamData(examData)
        setExam(validatedExam)
        setTimeRemaining(validatedExam.duration * 60)

        // Save fetched data for offline use
        if (examDataStorageKey) {
          try {
            localStorage.setItem(examDataStorageKey, JSON.stringify(validatedExam))
            console.log('Saved exam data for offline use')
          } catch (e) {
            console.error("Failed to save exam data to localStorage:", e) 
          }
        }
        
        // Load saved answers (as before)
        loadAndSetAnswers(validatedExam, storageKey)

      } catch (error: any) {
        console.warn('Online fetch failed, attempting offline load...', error)
        
        // Create a more specific error message
        let errorMessage = error.message || 'فشل تحميل الاختبار';
        
        // Attempt to load from localStorage if online fetch failed
        if (examDataStorageKey) {
            const cachedExamDataRaw = localStorage.getItem(examDataStorageKey)
            if (cachedExamDataRaw) {
                try {
                    const cachedExamData = JSON.parse(cachedExamDataRaw)
                    setExam(cachedExamData) // Assume cached data is already validated
                    setTimeRemaining(cachedExamData.duration * 60)
                    loadAndSetAnswers(cachedExamData, storageKey) // Load answers for cached exam
                    console.log('Successfully loaded exam data from cache')
                    loadedFromCache = true
                } catch (parseError) {
                    console.error("Failed to parse cached exam data:", parseError)
                    setError('فشل تحميل بيانات الاختبار المخزنة.')
                    localStorage.removeItem(examDataStorageKey)
                }
            } else {
                 setError(navigator.onLine 
                    ? errorMessage
                    : 'لا يوجد اتصال بالانترنت وبيانات مخزنة.')
            }
        } else {
            setError(navigator.onLine 
               ? errorMessage 
               : 'لا يوجد اتصال بالانترنت.')
        }
         // showError(error.message || 'فشل في تحميل الاختبار') // Consider if global error is needed
      } finally {
        setIsLoadingExam(false)
        stopLoading('fetch-exam')
      }
    }

    // Helper to validate/structure exam data (can be extracted)
    const validateAndStructureExamData = (examData: any): Exam => {
        if (!examData || !examData.questions || !Array.isArray(examData.questions)) {
          throw new Error('بيانات الاختبار غير مكتملة')
        }
        const validatedQuestions: Question[] = examData.questions.map((q: any, idx: number): Question => {
          // Ensure options have consistent ID format
          const validatedOptions = Array.isArray(q.options) ? q.options.map((opt: any, optIdx: number): Option => {
            if (typeof opt === 'string') {
              // If option is a string, create consistent ID format
              return {
                id: `option_${q.id}_${optIdx}`,
                text: opt
              };
            } else if (typeof opt === 'object' && opt !== null) {
              // If option is already an object, ensure it has a valid ID
              return {
                id: opt.id || `option_${q.id}_${optIdx}`,
                text: opt.text || 'Unknown option'
              };
            } else {
              // Fallback
              return {
                id: `option_${q.id}_${optIdx}`,
                text: `Option ${optIdx + 1}`
              };
            }
          }) : [];
          
          return {
            id: q.id || `question-${idx}`,
            text: q.text || `Question ${idx + 1}`,
            options: validatedOptions
          };
        });
        return { ...examData, questions: validatedQuestions };
    }
    
    // Helper to load answers (extracted logic)
    const loadAndSetAnswers = (currentExam: Exam, answersStorageKey: string | null) => {
      const initialAnswers = currentExam.questions.reduce((acc: Record<string, string>, q: Question) => {
        acc[q.id] = '' // Use empty string or null to indicate unanswered
        return acc
      }, {})
      
      // Initialize state for all question types
      const initialShortAnswers: Record<string, string> = {};
      const initialMatchingSelections: Record<string, Record<string, string>> = {};
      const initialOrderingSelections: Record<string, OrderingItem[]> = {};

      // Set up initial state for all question types
      currentExam.questions.forEach(q => {
        if (q.type === 'short-answer') {
          initialShortAnswers[q.id] = '';
        } else if (q.type === 'matching' && q.matchingPairs) {
          initialMatchingSelections[q.id] = {};
        } else if (q.type === 'ordering' && q.orderingItems) {
          initialOrderingSelections[q.id] = [...q.orderingItems];
        }
      });
      
      if (answersStorageKey) {
        const savedAnswersRaw = localStorage.getItem(answersStorageKey)
        if (savedAnswersRaw) {
          try {
            const savedData = JSON.parse(savedAnswersRaw)
            
            // Load multiple choice/true-false answers
            if (savedData.selectedOptions) {
              Object.keys(initialAnswers).forEach(qId => {
                if (savedData.selectedOptions[qId] !== undefined) { 
                  initialAnswers[qId] = savedData.selectedOptions[qId]
                }
              });
            }
            
            // Load short answers
            if (savedData.shortAnswers) {
              Object.keys(savedData.shortAnswers).forEach(qId => {
                initialShortAnswers[qId] = savedData.shortAnswers[qId];
              });
            }
            
            // Load matching selections
            if (savedData.matchingSelections) {
              Object.keys(savedData.matchingSelections).forEach(qId => {
                initialMatchingSelections[qId] = savedData.matchingSelections[qId] || {};
              });
            }
            
            // Load ordering selections
            if (savedData.orderingSelections) {
              Object.keys(savedData.orderingSelections).forEach(qId => {
                initialOrderingSelections[qId] = savedData.orderingSelections[qId] || [];
              });
            }
            
            console.log('Loaded saved answers for all question types');
          } catch (parseError) {
            console.error("Failed to parse saved answers:", parseError)
            localStorage.removeItem(answersStorageKey)
          }
        }
      }
      
      setSelectedOptions(initialAnswers)
      setShortAnswers(initialShortAnswers)
      setMatchingSelections(initialMatchingSelections)
      setOrderingSelections(initialOrderingSelections)
    }
    
    fetchExam()
  }, [examId, startLoading, stopLoading, navigate, showError, isUserLoggedIn, getStorageKey, getExamDataStorageKey])
  
  // Timer logic with visibility handling
  useEffect(() => {
    // Function to handle the timer tick
    const tick = () => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          if (timerIntervalRef.current !== null) clearInterval(timerIntervalRef.current) 
          setIsTimeUp(true)
          handleSubmit() // Auto-submit
          return 0
        }
        return prev - 1
      })
    }

    // Function to handle visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab hidden: Clear interval and store timestamp
        if (timerIntervalRef.current !== null) clearInterval(timerIntervalRef.current)
        lastVisibleTimestampRef.current = Date.now()
        console.log('Tab hidden, timer paused')
      } else {
        // Tab visible: Calculate elapsed time and restart interval
        if (lastVisibleTimestampRef.current) {
          const hiddenDurationMs = Date.now() - lastVisibleTimestampRef.current
          const hiddenDurationSec = Math.round(hiddenDurationMs / 1000)
          console.log(`Tab visible again after ${hiddenDurationSec}s`)
          
          setTimeRemaining(prev => {
            const newTime = Math.max(0, prev - hiddenDurationSec) // Adjust remaining time
            if (newTime <= 0) {
                handleSubmit() // Submit if time ran out while hidden
                return 0
            }
            return newTime
          })
          lastVisibleTimestampRef.current = null
        }
        // Restart interval only if time is still > 0
        setTimeRemaining(prev => {
            if (prev > 0 && !timerIntervalRef.current) { // Check !timerIntervalRef.current to avoid duplicates
                timerIntervalRef.current = window.setInterval(tick, 1000) as unknown as number
                console.log('Timer restarted')
            }
            return prev
        })
      }
    }

    // Start the initial timer if conditions met
    if (timeRemaining > 0 && !isLoadingExam && exam && !document.hidden) {
        // Type assertion might be needed if TS still infers NodeJS.Timeout
        timerIntervalRef.current = window.setInterval(tick, 1000) as unknown as number 
        console.log('Initial timer started')
    }

    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Cleanup function
    return () => {
      if (timerIntervalRef.current !== null) {
        // Use window.clearInterval for browser environments
        window.clearInterval(timerIntervalRef.current)
        console.log('Timer interval cleared on unmount')
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      console.log('Visibility listener removed')
    }
  // Rerun effect if timeRemaining hits 0 externally, or loading/exam state changes
  // Avoid adding handleSubmit to dependency array if it causes issues
  }, [timeRemaining, isLoadingExam, exam]) // Dependencies
  
  // Save answers on change - updated to handle all question types
  const handleSelectOption = useCallback((questionId: string, optionId: string) => {
    if (!optionId || !questionId) return
    
    setSelectedOptions(prev => {
      const newSelectedOptions = {
      ...prev,
      [questionId]: optionId
      }
      
      // Auto-save to localStorage with all answer types
      saveAllAnswers({
        selectedOptions: newSelectedOptions,
        shortAnswers,
        matchingSelections,
        orderingSelections
      })
      
      return newSelectedOptions
    })
  }, [examId, getStorageKey, shortAnswers, matchingSelections, orderingSelections])
  
  // Handle short answer changes
  const handleShortAnswerChange = useCallback((questionId: string, text: string) => {
    setShortAnswers(prev => {
      const newShortAnswers = {
        ...prev,
        [questionId]: text
      }
      
      // Auto-save to localStorage with all answer types
      saveAllAnswers({
        selectedOptions,
        shortAnswers: newShortAnswers,
        matchingSelections,
        orderingSelections
      })
      
      return newShortAnswers
    })
  }, [selectedOptions, matchingSelections, orderingSelections])
  
  // Handle matching selections
  const handleMatchingSelect = useCallback((questionId: string, leftId: string, rightId: string) => {
    setMatchingSelections(prev => {
      const newMatchingSelections = {
        ...prev,
        [questionId]: {
          ...(prev[questionId] || {}),
          [leftId]: rightId
        }
      }
      
      // Auto-save to localStorage with all answer types
      saveAllAnswers({
        selectedOptions,
        shortAnswers,
        matchingSelections: newMatchingSelections,
        orderingSelections
      })
      
      return newMatchingSelections
    })
  }, [selectedOptions, shortAnswers, orderingSelections])
  
  // Handle ordering changes
  const handleOrderingChange = useCallback((questionId: string, items: OrderingItem[]) => {
    setOrderingSelections(prev => {
      const newOrderingSelections = {
        ...prev,
        [questionId]: items
      }
      
      // Auto-save to localStorage with all answer types
      saveAllAnswers({
        selectedOptions,
        shortAnswers,
        matchingSelections,
        orderingSelections: newOrderingSelections
      })
      
      return newOrderingSelections
    })
  }, [selectedOptions, shortAnswers, matchingSelections])
  
  // Helper to save all answer types at once
  const saveAllAnswers = useCallback((allAnswers: {
    selectedOptions: Record<string, string>;
    shortAnswers: Record<string, string>;
    matchingSelections: Record<string, Record<string, string>>;
    orderingSelections: Record<string, OrderingItem[]>;
  }) => {
    const storageKey = getStorageKey(examId)
    if (storageKey) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(allAnswers))
        console.log('All answers auto-saved')
      } catch (saveError) {
        console.error("Failed to auto-save answers:", saveError)
      }
    }
  }, [examId, getStorageKey])
  
  const handleNextQuestion = useCallback(() => {
    if (!exam) return
    if (currentQuestionIndex < exam.questions.length - 1) {
      setIsQuestionLoading(true)
      setCurrentQuestionIndex(prev => prev + 1)
      // Reset typewriter effect for new question
      setShowTypewriter(true)
      // Smooth scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' })
      
      // Add a brief loading state for smoother transitions
      setTimeout(() => {
        setIsQuestionLoading(false)
      }, 300)
    }
  }, [exam, currentQuestionIndex])
  
  const handlePreviousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setIsQuestionLoading(true)
      setCurrentQuestionIndex(prev => prev - 1)
      // Don't show typewriter effect when going back
      setShowTypewriter(false)
      // Smooth scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' })
      
      // Add a brief loading state for smoother transitions
      setTimeout(() => {
        setIsQuestionLoading(false)
      }, 300)
    }
  }, [currentQuestionIndex])
  
  const handleSubmit = async () => {
    if (!exam || !examId) return;

    const loadingId = 'submit-exam';
    setIsSubmitting(true);
    startLoading(loadingId, 'جاري تقديم إجاباتك...');
    setError('');
    
    const storageKey = getStorageKey(examId);
    
    // Fix for Issue #1: Ensure timeSpent is calculated properly and is never 0
    const examDurationInSeconds = exam.duration * 60;
    const calculatedTimeSpent = examDurationInSeconds - timeRemaining;
    // Ensure we have a positive value and at least 1 second
    const timeSpent = Math.max(calculatedTimeSpent, 1); 
    
    console.log('Time data:', {
      examDuration: exam.duration,
      examDurationInSeconds,
      timeRemaining,
      calculatedTimeSpent,
      finalTimeSpent: timeSpent
    });
    
    // Declare variables for result tracking
    let resultId: string | undefined;
    let resultData: any;
    
    // Prepare answers in the format expected by the API
    const answers = exam.questions.map(question => {
      const baseAnswer = { 
        questionId: question.id
      };
      
      if (question.type === 'short-answer') {
        return {
          ...baseAnswer,
          answerText: shortAnswers[question.id] || ''
        };
      } else if (question.type === 'matching') {
        return {
          ...baseAnswer,
          matchingAnswers: question.matchingPairs?.map(pair => ({
            leftId: pair.id,
            rightId: matchingSelections[question.id]?.[pair.id] || ''
          })) || []
        };
      } else if (question.type === 'ordering') {
        return {
          ...baseAnswer,
          orderingAnswer: orderingSelections[question.id]?.map(item => item.id) || []
        };
      } else {
        // Default for multiple-choice and true-false
        // Ensure we're using the proper ID format that backend expects
        const selectedOptionId = selectedOptions[question.id] || '';
        return {
          ...baseAnswer,
          selectedOptionId: selectedOptionId
        };
      }
    });

    // Check for offline status
    if (!navigator.onLine) {
        console.log('Offline: Saving submission locally.');
        const pendingSubmission = {
            examId,
            userId: user?.id, // Include user ID if available
            submittedAt: new Date().toISOString(),
            payload: { answers, timeSpent }
        };
        
        try {
            const pendingSubmissionsRaw = localStorage.getItem(STORAGE.PENDING_SUBMISSIONS_KEY);
            const pendingSubmissions = pendingSubmissionsRaw ? JSON.parse(pendingSubmissionsRaw) : [];
            pendingSubmissions.push(pendingSubmission);
            localStorage.setItem(STORAGE.PENDING_SUBMISSIONS_KEY, JSON.stringify(pendingSubmissions));

            // Clear current exam answers as it's submitted (offline)
            if (storageKey) {
              localStorage.removeItem(storageKey);
            }

            // Navigate or show message indicating offline submission
            alert('غير متصل بالإنترنت. تم حفظ إجاباتك وسيتم إرسالها عند عودة الاتصال.');
            navigate('/'); // Navigate home or to a results pending page

        } catch (e) {
            console.error("Failed to save pending submission:", e);
            setError('فشل حفظ الإجابات للإرسال لاحقًا.');
            showError('فشل حفظ الإجابات للإرسال لاحقًا.');
            setIsSubmitting(false); // Allow retry?
            stopLoading(loadingId);
        }
        return; // Stop execution as submission is saved locally
    }

    // --- Online Submission Logic --- 
    try {
      console.log('Online: Submitting exam...', { examId, answers, timeSpent });
      const response = await examApi.submitExam(
        examId, 
        answers, 
        timeSpent
      );
      
      console.log('Submit exam response:', response);
      
      if (response.error || !response.data) {
        throw new Error(response.error || 'فشل في تقديم الاختبار');
      }

      // Log complete response data structure for debugging
      console.log('Complete response data structure:', JSON.stringify(response.data, null, 2));

      // Clear saved answers from localStorage on success
      if (storageKey) {
        localStorage.removeItem(storageKey);
        console.log('Cleared saved answers on submit');
      }
      
      // Handle various response formats to extract result ID and data
      const responseData = response.data as any; // Cast to any to handle different response formats
      
      try {
        // Debug log to help diagnose response structure issues
        console.log('Response data structure:', {
          hasData: !!responseData,
          directProperties: Object.keys(responseData || {}),
          hasNestedData: !!(responseData && responseData.data),
          nestedProperties: responseData && responseData.data ? Object.keys(responseData.data) : []
        });
        
        // Check for resultId directly in responseData
        if (responseData.resultId) {
          resultId = String(responseData.resultId);
          console.log('Found resultId in responseData.resultId:', resultId);
        }
        
        // Check for result object
        if (responseData.result) {
          resultData = responseData.result;
          
          // If we don't have a resultId yet, try to get from result.id
          if (!resultId && resultData.id) {
            resultId = String(resultData.id);
            console.log('Found resultId in responseData.result.id:', resultId);
          }
        } 
        // Check for nested structure
        else if (responseData.data && responseData.data.resultId) {
          resultId = String(responseData.data.resultId);
          console.log('Found resultId in responseData.data.resultId:', resultId);
          
          if (responseData.data.result) {
            resultData = responseData.data.result;
          }
        }
        // If no resultId found yet, use direct id if available
        else if (!resultId && responseData.id) {
          resultId = String(responseData.id);
          resultData = responseData;
          console.log('Using responseData.id for resultId:', resultId);
        }
        
        // Try one more deeply nested case
        if (!resultId && responseData.data && responseData.data.data && responseData.data.data.resultId) {
          resultId = String(responseData.data.data.resultId);
          console.log('Found resultId in deeply nested structure:', resultId);
        }
      } catch (parseError) {
        console.error('Error parsing response structure:', parseError);
      }
      
      // Verify that we have a valid resultId
      if (!resultId) {
        console.warn('No result ID found in response, using examId as fallback');
        resultId = String(examId);
        
        // Try to create a minimal valid result object for navigation
        if (!resultData) {
          resultData = {
            id: resultId,
            examId: String(examId),
            examTitle: exam.title || 'Exam',
            score: 0,
            totalQuestions: exam.questions.length,
            timeSpent: timeSpent
          };
        }
      }
      
      // Prepare navigation state with the result data
      const navigationState = resultData || {
        id: resultId,
        examId: String(examId),
        examTitle: exam.title || 'Exam',
        score: 0,
        totalQuestions: exam.questions.length,
        timeSpent: timeSpent
      };
      
      console.log('Navigation data:', { 
        resultId, 
        navigationState,
        url: `/result/${resultId}`
      });
      
      try {
        // Navigate to result page with the result data
        navigate(`/result/${resultId}`, { state: navigationState });
      } catch (navigationError) {
        console.error('Error during navigation:', navigationError);
        // Fallback to results list page if direct navigation fails
        navigate('/results');
      }

    } catch (error: any) {
      console.error('Error submitting exam:', error);
      
      // Provide more detailed error logging and handling
      if (error instanceof ReferenceError) {
        console.error('Reference error in exam submission:', error.message);
      }
      
      // Set a friendly error message for the user
      setError(error.message || 'فشل في تقديم الاختبار. يرجى المحاولة مرة أخرى.');
      showError(error.message || 'فشل في تقديم الإجابات');
      
      // Fallback navigation if we have an examId but submission processing failed
      if (examId) {
        console.log('Attempting fallback navigation to results page...');
        try {
          // If we're here, we might have a successful submission but failed during processing
          // Try to navigate to results page as a fallback
          navigate('/results');
        } catch (navError) {
          console.error('Failed fallback navigation:', navError);
        }
      }
    } finally {
      setIsSubmitting(false);
      stopLoading(loadingId);
    }
  };
  
  // Updated to check if a question is answered based on its type
  const isCurrentQuestionAnswered = useCallback(() => {
    if (!exam) return false
    if (!exam.questions || !Array.isArray(exam.questions) || currentQuestionIndex >= exam.questions.length) return false
    
    const currentQuestion = exam.questions[currentQuestionIndex]
    if (!currentQuestion || !currentQuestion.id) return false
    
    // Check based on question type
    if (currentQuestion.type === 'short-answer') {
      return !!shortAnswers[currentQuestion.id]?.trim();
    } else if (currentQuestion.type === 'matching') {
      // Check if all matching pairs have selections
      const selections = matchingSelections[currentQuestion.id] || {};
      return currentQuestion.matchingPairs ? 
        currentQuestion.matchingPairs.every(pair => !!selections[pair.id]) : 
        false;
    } else if (currentQuestion.type === 'ordering') {
      // Consider ordering answered if the items have been rearranged at least once
      return !!orderingSelections[currentQuestion.id];
    } else {
      // Multiple choice or true/false
      return selectedOptions[currentQuestion.id] !== undefined && selectedOptions[currentQuestion.id] !== '';
    }
  }, [exam, currentQuestionIndex, selectedOptions, shortAnswers, matchingSelections, orderingSelections])
  
  // Updated to calculate completion based on all question types
  const getCompletionPercentage = useCallback(() => {
    if (!exam || !exam.questions) return 0
    
    let answeredCount = 0;
    
    exam.questions.forEach(question => {
      if (question.type === 'short-answer') {
        if (shortAnswers[question.id]?.trim()) answeredCount++;
      } else if (question.type === 'matching') {
        const selections = matchingSelections[question.id] || {};
        if (question.matchingPairs && 
            question.matchingPairs.every(pair => !!selections[pair.id])) {
          answeredCount++;
        }
      } else if (question.type === 'ordering') {
        if (orderingSelections[question.id]?.length > 0) answeredCount++;
      } else {
        // Multiple choice or true/false
        if (selectedOptions[question.id]) answeredCount++;
      }
    });
    
    return (answeredCount / exam.questions.length) * 100
  }, [exam, selectedOptions, shortAnswers, matchingSelections, orderingSelections])
  
  // Safely get the current question
  const currentQuestion = useMemo(() => {
    if (!exam || !exam.questions || currentQuestionIndex >= exam.questions.length) {
      return null
    }
    return exam.questions[currentQuestionIndex]
  }, [exam, currentQuestionIndex])
  
  const showSubmitButton = useMemo(() => {
    if (!exam || !exam.questions) return false
    return currentQuestionIndex === exam.questions.length - 1
  }, [exam, currentQuestionIndex])
  
  // Different page states
  if (isLoadingExam) {
    return (
      <div className="min-h-screen bg-bg-light dark:bg-bg-dark">
        <Navbar />
        <LoadingOverlay fullScreen id="exam-loader" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg-light dark:bg-bg-dark">
        <Navbar />
        <div className="container mx-auto pt-8 px-4">
          <ErrorMessage message={error} />
          <div className="text-center mt-8">
            <Button variant="outlined" onClick={() => navigate('/')}>العودة إلى الرئيسية</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-bg-light dark:bg-bg-dark">
        <Navbar />
        <div className="container mx-auto pt-8 px-4">
          <EmptyState 
            title="لم يتم العثور على الاختبار"
            message="هذا الاختبار غير موجود أو تم حذفه"
            actionLabel="العودة إلى الرئيسية"
            onAction={() => navigate('/')}
          />
        </div>
      </div>
    );
  }

  if (isTimeUp || isSubmitting) {
    return (
      <div className="min-h-screen bg-bg-light dark:bg-bg-dark">
        <Navbar />
        <div className="container mx-auto py-12 px-4">
          <div className="max-w-lg mx-auto text-center">
            <h1 className="text-3xl font-bold text-text-heading dark:text-white mb-4">
              {isTimeUp ? "انتهى الوقت!" : "جاري تسجيل إجاباتك..."}
            </h1>
            <p className="text-text-body dark:text-gray-300 mb-6">
              {isTimeUp 
                ? "انتهى الوقت المخصص للاختبار. سيتم تسجيل إجاباتك تلقائيًا." 
                : "يرجى الانتظار بينما نقوم بحفظ إجاباتك وحساب النتيجة..."
              }
            </p>
            <div className="w-16 h-16 mx-auto">
              <div className="w-full h-full border-4 border-primary-500 dark:border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Render the main exam page
  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pb-32">
        {/* Exam timer indicator */}
        <div className="fixed top-16 right-0 left-0 z-10 bg-bg-dark bg-opacity-90 p-2 shadow-md">
          <div className="container mx-auto px-4 flex justify-between items-center">
            <h1 className="text-lg md:text-xl font-bold text-white truncate">{exam.title}</h1>
            <div className="flex items-center px-4 py-2 bg-bg-light rounded-full shadow">
              <span className={`text-xl font-mono ${timeRemaining < 60 ? 'text-red-500' : 'text-primary'}`}>
                {formatTime(timeRemaining)}
              </span>
              <span className="material-icons ml-2 text-primary">timer</span>
            </div>
          </div>
        </div>
        
        <div className="mt-12 flex flex-col lg:flex-row justify-between items-start lg:space-x-8 lg:space-x-reverse">
          {/* Main column */}
          <div className="w-full lg:w-8/12 mb-8 lg:mb-0">
            <div className="bg-bg-light rounded-lg p-4 md:p-6 shadow-lg mb-8">
              {error && (
                <ErrorMessage 
                  message={error}
                  variant="error"
                  dismissible={true}
                  onDismiss={() => setError('')}
                />
              )}
              <div className="relative mb-6">
                <ProgressBar 
                  currentQuestion={currentQuestionIndex + 1} 
                  totalQuestions={exam.questions.length}
                />
                <div className="mt-2 text-gray-400 text-sm">
                  السؤال {currentQuestionIndex + 1} من {exam.questions.length}
                </div>
              </div>
              
              <div className="mb-8">
                {currentQuestion && (
                  <QuestionCard
                    question={currentQuestion}
                    selectedOption={selectedOptions[currentQuestion.id]}
                    onSelectOption={(optionId) => handleSelectOption(currentQuestion.id, optionId)}
                    showTypewriter={showTypewriter}
                    questionNumber={currentQuestionIndex + 1}
                    totalQuestions={exam.questions.length}
                    isLoading={isQuestionLoading}
                    // Add props for new question types
                    shortAnswerText={shortAnswers[currentQuestion.id] || ''}
                    onShortAnswerChange={(text) => handleShortAnswerChange(currentQuestion.id, text)}
                    matchingSelections={matchingSelections[currentQuestion.id] || {}}
                    onMatchingSelect={(leftId, rightId) => handleMatchingSelect(currentQuestion.id, leftId, rightId)}
                    orderingSelections={orderingSelections[currentQuestion.id] || []}
                    onOrderingChange={(items) => handleOrderingChange(currentQuestion.id, items)}
                  />
                )}
              </div>
              
              <div className="flex flex-wrap justify-between">
                <Button
                  variant="secondary"
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0 || isQuestionLoading}
                  className="mb-2 sm:mb-0 bg-bg-dark hover:bg-gray-700 text-white"
                >
                  <span className="material-icons ml-1">arrow_forward</span>
                  السؤال السابق
                </Button>
                
                {showSubmitButton ? (
                  <Button
                    variant="primary"
                    onClick={handleSubmit}
                    disabled={isSubmitting || Object.keys(selectedOptions).length === 0}
                    className="bg-primary hover:bg-primary-dark text-white"
                  >
                    {isSubmitting ? 'جاري الإرسال...' : 'إنهاء الاختبار'}
                    <span className="material-icons mr-1">done_all</span>
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onClick={handleNextQuestion}
                    disabled={!isCurrentQuestionAnswered() || isQuestionLoading}
                    className="bg-primary hover:bg-primary-dark text-white"
                  >
                    السؤال التالي
                    <span className="material-icons mr-1">arrow_back</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          {/* Sidebar column */}
          <div className="w-full lg:w-4/12">
            <div className="bg-bg-light rounded-lg p-4 md:p-6 shadow-lg sticky top-24">
              <h2 className="text-xl font-bold text-white mb-4">تقدم الاختبار</h2>
              
              <ProgressBar 
                currentQuestion={Object.keys(selectedOptions).length}
                totalQuestions={exam.questions.length}
              />
              
              <div className="mt-2 mb-6 text-sm text-gray-400">
                {Object.keys(selectedOptions).length} من {exam.questions.length} سؤال تمت الإجابة عليه
              </div>
              
              <div className="grid grid-cols-5 gap-2 mb-6">
                {exam.questions.map((q: Question, index: number) => (
                  <button
                    key={q.id || `question-${index}`}
                    onClick={() => {
                      setIsQuestionLoading(true)
                      setCurrentQuestionIndex(index)
                      setShowTypewriter(false)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                      setTimeout(() => setIsQuestionLoading(false), 300)
                    }}
                    className={`
                      w-full h-10 rounded-lg flex items-center justify-center font-medium text-sm
                      transition-all duration-200
                      ${index === currentQuestionIndex ? 'bg-primary text-white ring-2 ring-primary ring-offset-2' : ''}
                      ${selectedOptions[q.id] ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-bg-dark text-gray-300 hover:bg-gray-700'}
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                    disabled={isQuestionLoading}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
              
              {showSubmitButton && (
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  fullWidth
                  disabled={isSubmitting || Object.keys(selectedOptions).length === 0}
                  className="bg-primary hover:bg-primary-dark text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'جاري الإرسال...' : 'إنهاء الاختبار وإرسال الإجابات'}
                  <span className="material-icons mr-1">send</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper function to format time
const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export default ExamPage; 