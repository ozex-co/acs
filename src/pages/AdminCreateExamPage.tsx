import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import Button from '../components/Button';
import Loader from '../components/Loader';
import { useLoading } from '../context/LoadingContext';
import { useError } from '../context/ErrorContext';
import { FiPlus, FiX, FiCheck, FiTrash2, FiEdit2, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import ErrorMessage from '../components/ErrorMessage';
import { API, STORAGE } from '../utils/constants';
import axios from 'axios';
import DataFetchWrapper from '../components/DataFetchWrapper';

interface QuestionOption {
  id: string;
  text: string;
}

// Add interfaces for new question types
interface MatchingItem {
  id: string;
  left: string;  // Item in column A
  right: string; // Corresponding item in column B
}

interface OrderingItem {
  id: string;
  text: string;
  correctPosition: number; // The correct position in the sequence (1-based)
}

type QuestionType = 'multiple-choice' | 'true-false' | 'short-answer' | 'matching' | 'ordering';

interface Question {
  id: string;
  title: string;
  type: QuestionType;
  options: QuestionOption[];
  correctOptionId: string | null;
  correctAnswerText?: string;
  matchingItems?: MatchingItem[]; // For matching questions
  orderingItems?: OrderingItem[]; // For ordering questions
}

// Simple ID generator function (replacement for uuid)
const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

const AdminCreateExamPage: React.FC = () => {
  const navigate = useNavigate();
  const { startLoading, stopLoading } = useLoading();
  const { showError } = useError();
  
  // Exam details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(30); // in minutes
  const [minAge, setMinAge] = useState(0); // 0 means public
  const [maxAge, setMaxAge] = useState(100);
  const [isPublic, setIsPublic] = useState(false);
  const [sectionId, setSectionId] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState<string>('medium');
  const [sections, setSections] = useState<{id: number, name: string}[]>([]);
  
  // Questions
  const [questions, setQuestions] = useState<Question[]>([
    createEmptyQuestion() // Start with one empty question
  ]);
  
  // Form submit
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Load sections when the component mounts
  useEffect(() => {
    const fetchSections = async () => {
      try {
        // Use direct API call instead of apiUtils
        const response = await axios.get(
          `${API.BASE_URL}/api/admin/sections`,
          {
            headers: {
              'Authorization': getAuthToken(),
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('Sections API response:', response);
        
        if (!response || !response.data) {
          console.error('Error in sections response');
          // Instead of silently continuing, show a warning to the user
          showError('Failed to load sections. You can still create an exam, but section selection will be unavailable.');
          return;
        }
        
        // Extract sections data from response
        const responseData = response.data;
        
        // Check for different response formats based on the API structure
        if (responseData.sections && Array.isArray(responseData.sections)) {
          console.log('Loaded sections:', responseData.sections.length);
          setSections(responseData.sections);
        } else if (responseData.success && responseData.data && responseData.data.sections) {
          // Handle response format with success flag
          console.log('Loaded sections (success format):', responseData.data.sections.length);
          setSections(responseData.data.sections);
        } else if (Array.isArray(responseData)) {
          // Handle alternative response format where sections are directly in the array
          console.log('Loaded sections (alternative format):', responseData.length);
          setSections(responseData);
        } else {
          console.warn('Sections data has unexpected format:', responseData);
          showError('Unable to parse sections data. Section selection may be unavailable.');
        }
      } catch (error) {
        console.error('Exception fetching sections:', error);
        showError('Error loading sections. You can still create an exam, but section selection will be unavailable.');
      }
    };
    
    fetchSections();
  }, []);
  
  // Add a helper function to get the auth token
  function getAuthToken() {
    const userData = localStorage.getItem(STORAGE.ADMIN_DATA);
    let token = '';
    
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        token = parsed.token || '';
      } catch (e) {
        console.error('Failed to parse user data:', e);
      }
    }
    
    return token ? `Bearer ${token}` : '';
  }
  
  // Create a new empty question with unique ID
  function createEmptyQuestion(): Question {
    return {
      id: generateId(),
      title: '',
      type: 'multiple-choice',
      options: [
        { id: generateId(), text: 'الخيار 1' },
        { id: generateId(), text: 'الخيار 2' },
      ],
      correctOptionId: null,
    };
  }
  
  // Add a new empty question
  const addQuestion = () => {
    setQuestions([...questions, createEmptyQuestion()]);
  };
  
  // Remove a question
  const removeQuestion = (questionId: string) => {
    if (questions.length <= 1) {
      showError('You must have at least one question');
      return;
    }
    setQuestions(questions.filter(q => q.id !== questionId));
  };
  
  // Update question title
  const updateQuestionTitle = (questionId: string, title: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, title } : q
    ));
  };
  
  // Update option text
  const updateOptionText = (questionId: string, optionId: string, text: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { 
            ...q, 
            options: q.options.map(o => 
              o.id === optionId ? { ...o, text } : o
            ) 
          } 
        : q
    ));
  };
  
  // Set correct answer
  const setCorrectAnswer = (questionId: string, optionId: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, correctOptionId: optionId } : q
    ));
  };
  
  // Add new option to a question
  const addOption = (questionId: string) => {
    setQuestions(prevQuestions => {
      return prevQuestions.map(question => {
        if (question.id === questionId) {
          return {
            ...question,
            options: [
              ...question.options,
              { id: generateId(), text: `الخيار ${question.options.length + 1}` }
            ]
          };
        }
        return question;
      });
    });
  };
  
  // Remove an option
  const removeOption = (questionId: string, optionId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (!question || question.type !== 'multiple-choice') return;
    
    if (question.options.length <= 2) {
      showError('Minimum 2 options per question');
      return;
    }
    
    // If removing the correct answer, reset correctOptionId
    const newCorrectOptionId = 
      question.correctOptionId === optionId 
        ? null 
        : question.correctOptionId;
    
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { 
            ...q, 
            options: q.options.filter(o => o.id !== optionId),
            correctOptionId: newCorrectOptionId
          } 
        : q
    ));
  };
  
  // Add matching item to a question
  const addMatchingItem = (questionId: string) => {
    setQuestions(prevQuestions => {
      return prevQuestions.map(question => {
        if (question.id === questionId) {
          // Get all existing matching items or initialize empty array
          const currentItems = question.matchingItems || [];
          
          return {
            ...question,
            matchingItems: [
              ...currentItems,
              { 
                id: generateId(), 
                left: '', 
                right: '' 
              }
            ]
          };
        }
        return question;
      });
    });
  };
  
  // Remove a matching item
  const removeMatchingItem = (questionId: string, itemId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (!question || question.type !== 'matching' || !question.matchingItems) return;
    
    if (question.matchingItems.length <= 2) {
      showError('Minimum 2 matching pairs required');
      return;
    }
    
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { 
            ...q, 
            matchingItems: q.matchingItems?.filter(item => item.id !== itemId) || []
          } 
        : q
    ));
  };
  
  // Update matching item content
  const updateMatchingItem = (questionId: string, itemId: string, side: 'left' | 'right', text: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { 
            ...q, 
            matchingItems: q.matchingItems?.map(item => 
              item.id === itemId ? { ...item, [side]: text } : item
            ) || []
          } 
        : q
    ));
  };
  
  // Add ordering item
  const addOrderingItem = (questionId: string) => {
    setQuestions(prevQuestions => {
      return prevQuestions.map(question => {
        if (question.id === questionId) {
          // Get all existing ordering items or initialize empty array
          const currentItems = question.orderingItems || [];
          const newPosition = currentItems.length + 1;
          
          return {
            ...question,
            orderingItems: [
              ...currentItems,
              { 
                id: generateId(), 
                text: '', 
                correctPosition: newPosition 
              }
            ]
          };
        }
        return question;
      });
    });
  };
  
  // Remove an ordering item
  const removeOrderingItem = (questionId: string, itemId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (!question || question.type !== 'ordering' || !question.orderingItems) return;
    
    if (question.orderingItems.length <= 2) {
      showError('Minimum 2 items required for ordering questions');
      return;
    }
    
    // Get the position of the item being removed
    const removedItem = question.orderingItems.find(item => item.id === itemId);
    if (!removedItem) return;
    
    const removedPosition = removedItem.correctPosition;
    
    // Create new ordering items array without the removed item
    // and adjust positions of remaining items
    const newOrderingItems = question.orderingItems
      .filter(item => item.id !== itemId)
      .map(item => {
        if (item.correctPosition > removedPosition) {
          return {
            ...item,
            correctPosition: item.correctPosition - 1
          };
        }
        return item;
      });
    
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { 
            ...q, 
            orderingItems: newOrderingItems
          } 
        : q
    ));
  };
  
  // Update ordering item text
  const updateOrderingItemText = (questionId: string, itemId: string, text: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { 
            ...q, 
            orderingItems: q.orderingItems?.map(item => 
              item.id === itemId ? { ...item, text } : item
            ) || []
          } 
        : q
    ));
  };
  
  // Move ordering item up in the sequence
  const moveOrderingItemUp = (questionId: string, itemId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (!question || question.type !== 'ordering' || !question.orderingItems) return;
    
    const item = question.orderingItems.find(item => item.id === itemId);
    if (!item || item.correctPosition <= 1) return;
    
    const newOrderingItems = question.orderingItems.map(i => {
      if (i.id === itemId) {
        return { ...i, correctPosition: i.correctPosition - 1 };
      }
      if (i.correctPosition === item.correctPosition - 1) {
        return { ...i, correctPosition: i.correctPosition + 1 };
      }
      return i;
    });
    
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { 
            ...q, 
            orderingItems: newOrderingItems
          } 
        : q
    ));
  };
  
  // Move ordering item down in the sequence
  const moveOrderingItemDown = (questionId: string, itemId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (!question || question.type !== 'ordering' || !question.orderingItems) return;
    
    const item = question.orderingItems.find(item => item.id === itemId);
    if (!item || item.correctPosition >= question.orderingItems.length) return;
    
    const newOrderingItems = question.orderingItems.map(i => {
      if (i.id === itemId) {
        return { ...i, correctPosition: i.correctPosition + 1 };
      }
      if (i.correctPosition === item.correctPosition + 1) {
        return { ...i, correctPosition: i.correctPosition - 1 };
      }
      return i;
    });
    
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { 
            ...q, 
            orderingItems: newOrderingItems
          } 
        : q
    ));
  };
  
  // Update question type
  const updateQuestionType = (questionId: string, type: QuestionType) => {
    setQuestions(questions.map(q => {
      if (q.id !== questionId) return q;
      let newOptions = q.options;
      let newCorrectOptionId = q.correctOptionId;
      let newCorrectAnswerText = q.correctAnswerText;
      let newMatchingItems = q.matchingItems;
      let newOrderingItems = q.orderingItems;

      if (type === 'true-false') {
        newOptions = [
            { id: `${q.id}_opt_true`, text: 'True' },
            { id: `${q.id}_opt_false`, text: 'False' }
        ];
        if (!newOptions.some(opt => opt.id === newCorrectOptionId)) {
            newCorrectOptionId = null;
        }
        newCorrectAnswerText = '';
      } else if (type === 'short-answer') {
          newOptions = [];
          newCorrectOptionId = null;
      } else if (type === 'matching') {
          newOptions = [];
          newCorrectOptionId = null;
          if (!newMatchingItems || newMatchingItems.length < 2) {
              newMatchingItems = [
                  { id: `match_${q.id}_1`, left: '', right: '' },
                  { id: `match_${q.id}_2`, left: '', right: '' }
              ];
          }
      } else if (type === 'ordering') {
          newOptions = [];
          newCorrectOptionId = null;
          if (!newOrderingItems || newOrderingItems.length < 2) {
              newOrderingItems = [
                  { id: `order_${q.id}_1`, text: '', correctPosition: 1 },
                  { id: `order_${q.id}_2`, text: '', correctPosition: 2 },
                  { id: `order_${q.id}_3`, text: '', correctPosition: 3 }
              ];
          }
      } else {
          if (newOptions.length < 2) {
              newOptions = [
                  { id: `${q.id}_opt_1`, text: '' },
                  { id: `${q.id}_opt_2`, text: '' }
              ];
          }
          newCorrectAnswerText = '';
      }

      return { 
          ...q, 
          type, 
          options: newOptions, 
          correctOptionId: newCorrectOptionId, 
          correctAnswerText: newCorrectAnswerText,
          matchingItems: newMatchingItems,
          orderingItems: newOrderingItems
      };
    }));
  };
  
  // Update correct short answer text
  const updateCorrectAnswerText = (questionId: string, text: string) => {
      setQuestions(questions.map(q => 
          q.id === questionId ? { ...q, correctAnswerText: text } : q
      ));
  };
  
  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Validate exam details
    if (!title.trim()) {
      errors.title = 'Title is required';
    }
    
    const descriptionText = description.trim();
    if (!descriptionText) {
      errors.description = 'Description is required';
    } else if (descriptionText.length < 10) {
      errors.description = 'Description must be at least 10 characters';
    }
    
    if (duration <= 0) {
      errors.duration = 'Duration must be greater than 0';
    }
    
    // Section is optional, so we don't validate it
    
    if (!difficulty) {
      errors.difficulty = 'Please select a difficulty level';
    }
    
    if (!isPublic) {
      if (minAge < 0) {
        errors.minAge = 'Minimum age cannot be negative';
      }
      
      if (maxAge <= minAge) {
        errors.maxAge = 'Maximum age must be greater than minimum age';
      }
    }
    
    // Validate questions
    let hasQuestionErrors = false;
    
    questions.forEach((question, index) => {
      const qKey = `question_${index}`;
      if (!question.title.trim()) {
        errors[`${qKey}_title`] = 'Question title is required';
        hasQuestionErrors = true;
      } else if (question.title.trim().length < 3) {
        errors[`${qKey}_title`] = 'Question title must be at least 3 characters long';
        hasQuestionErrors = true;
      }
      
      if (question.type === 'multiple-choice' || question.type === 'true-false') {
          if (question.options.length < 2) { errors[`${qKey}_options`] = 'At least 2 options required'; }
          question.options.forEach((option, optIndex) => {
            if (!option.text.trim()) { errors[`${qKey}_option_${optIndex}`] = 'Option text required'; }
          });
          if (!question.correctOptionId) { errors[`${qKey}_correct`] = 'Correct answer selection required'; }
      } else if (question.type === 'short-answer') {
          if (!question.correctAnswerText?.trim()) { errors[`${qKey}_correct_text`] = 'Correct answer text required'; }
      } else if (question.type === 'matching' && question.matchingItems) {
          if (question.matchingItems.length < 2) { 
            errors[`${qKey}_matching`] = 'At least 2 matching pairs required'; 
            hasQuestionErrors = true;
          }
          question.matchingItems.forEach((item, itemIndex) => {
            if (!item.left.trim()) { 
              errors[`${qKey}_matching_${itemIndex}_left`] = 'Left side text required'; 
              hasQuestionErrors = true;
            }
            if (!item.right.trim()) { 
              errors[`${qKey}_matching_${itemIndex}_right`] = 'Right side text required'; 
              hasQuestionErrors = true;
            }
          });
      } else if (question.type === 'ordering' && question.orderingItems) {
          if (question.orderingItems.length < 2) { 
            errors[`${qKey}_ordering`] = 'At least 2 items required for ordering'; 
            hasQuestionErrors = true;
          }
          question.orderingItems.forEach((item, itemIndex) => {
            if (!item.text.trim()) { 
              errors[`${qKey}_ordering_${itemIndex}`] = 'Item text required'; 
              hasQuestionErrors = true;
            }
          });
      }
    });
    
    // Set a general error message if there are any question-related errors
    if (hasQuestionErrors) {
      errors.questions_summary = 'Please review and correct the errors in the questions below.';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Clear only summary error, keep field errors
    setFormErrors(prev => {
        if (!prev.questions_summary) return prev; // No change if key doesn't exist
        const newErrors = { ...prev };
        delete newErrors.questions_summary;
        return newErrors;
    });
    
    if (!validateForm()) {
      // validation sets field errors and potentially adds back questions_summary
      showError('Please fix the validation errors in the form'); 
      return;
    }
    
    // Format the exam data for API
    const examData = {
      title,
      description,
      duration,
      isPublic,
      minAge: isPublic ? 0 : minAge,
      maxAge: isPublic ? 100 : maxAge,
      sectionId,
      difficulty,
      questions: questions.map((q) => {
        const questionId = q.id;
        let formattedOptions = [];
        let correctOptionId = null;
        
        // For multiple-choice or true-false questions
        if (q.type === 'multiple-choice' || q.type === 'true-false') {
          // Find the selected correct option
          const correctOption = q.options.find(o => o.id === q.correctOptionId);
          if (!correctOption) {
            throw new Error(`Question "${q.title}" has no correct option selected`);
          }
          correctOptionId = correctOption.id;
          
          // Format options as objects with id and text properties
          formattedOptions = q.options.map(o => ({
            id: o.id,
            text: o.text
          }));
        } 
        // For short-answer questions
        else if (q.type === 'short-answer') {
          // For short answer questions, we need to create option objects
          const correctAnswer = q.correctAnswerText || '';
          correctOptionId = `${questionId}_correct`;
          
          formattedOptions = [
            { id: correctOptionId, text: correctAnswer },
            { id: `${questionId}_incorrect`, text: "Incorrect" }
          ];
        } 
        // For matching questions
        else if (q.type === 'matching' && q.matchingItems) {
          formattedOptions = q.matchingItems.map(item => ({
            id: item.id,
            text: `${item.left} -> ${item.right}`
          }));
          
          // Check we have at least one option
          if (formattedOptions.length === 0) {
            throw new Error(`Matching question "${q.title}" has no options`);
          }
          
          correctOptionId = formattedOptions[0].id;
        } 
        // For ordering questions
        else if (q.type === 'ordering' && q.orderingItems) {
          const sortedItems = [...q.orderingItems].sort((a, b) => a.correctPosition - b.correctPosition);
          formattedOptions = sortedItems.map(item => ({
            id: item.id,
            text: item.text
          }));
          
          // Check we have at least one option
          if (formattedOptions.length === 0) {
            throw new Error(`Ordering question "${q.title}" has no options`);
          }
          
          correctOptionId = formattedOptions[0].id;
        } 
        // Fallback for any other question type
        else {
          // Create default option objects
          formattedOptions = [
            { id: `${questionId}_opt1`, text: "Option 1" },
            { id: `${questionId}_opt2`, text: "Option 2" }
          ];
          
          correctOptionId = formattedOptions[0].id;
        }
        
        // Return properly formatted question object
        return {
          text: q.title,
          options: formattedOptions,
          correctOption: correctOptionId
        };
      })
    };
    
    // Log the entire exam data object for debugging
    console.log('Submitting exam data:', JSON.stringify(examData, null, 2));
    
    setIsSubmitting(true);
    const loadingId = 'create-exam';
    startLoading(loadingId, 'Creating exam...');
    
    try {
      // Make direct API call using axios instead of apiUtils or examsApi
      const response = await axios.post(
        `${API.BASE_URL}/api/admin/exams`,
        examData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': getAuthToken()
          }
        }
      );
      
      console.log('Create exam response:', response);
      
      if (!response || response.status !== 200 && response.status !== 201) {
        throw new Error(response?.data?.message || 'Failed to create exam');
      }
      
      // Extract data from response
      const responseData = response.data;
      
      // If successful, redirect to exams page
      navigate('/admin/exams', { 
        state: { 
          message: 'Exam created successfully!',
          examId: responseData.exam?.id || responseData.id
        } 
      });
    } catch (error: any) {
      console.error('Error creating exam:', error);
      
      // Extract detailed error message if available
      let errorMessage = 'Failed to create exam. Please try again.';
      let fieldErrors: Record<string, string> = {};
      
      // Add debugging information
      console.log('Full error object:', error);
      
      // Handle axios error response
      if (error.response && error.response.data) {
        console.log('Error response data:', error.response.data);
        
        // Extract field errors if available
        if (error.response.data.fieldErrors) {
          fieldErrors = error.response.data.fieldErrors;
          console.log('Field validation errors:', fieldErrors);
          
          // Update form errors with backend validation errors
          const newFormErrors = { ...formErrors };
          
          // Process each field error
          Object.entries(fieldErrors).forEach(([field, message]) => {
            // Check if it's a question-related error
            if (field.startsWith('questions.') || field.startsWith('questions[')) {
              const matches = field.match(/questions[.\[](\d+)/);
              if (matches && matches[1]) {
                const questionIndex = parseInt(matches[1], 10);
                const questionId = questions[questionIndex]?.id;
                
                if (questionId) {
                  // Add error to the specific question
                  if (field.includes('options') || field.includes('correctOptionIndex')) {
                    // Handle option-specific errors
                    newFormErrors[`question_${questionId}_options`] = String(message);
                  } else {
                    // General question error
                    newFormErrors[`question_${questionId}`] = String(message);
                  }
                }
              }
            } else {
              // General form field errors
              newFormErrors[field] = String(message);
            }
          });
          
          // Set the processed form errors
          setFormErrors(newFormErrors);
          
          // Create a summary error message
          errorMessage = 'Please correct the validation errors in the form.';
        } 
        // If there's a general message in the response
        else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      } 
      // Handle non-response errors
      else if (error.message) {
        errorMessage = error.message;
      }
      
      showError(errorMessage);
    } finally {
      setIsSubmitting(false);
      stopLoading(loadingId);
    }
  };
  
  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Create New Exam</h1>
        <p className="text-gray-400 mt-1">Create a new exam with questions and answers</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Exam Details Section */}
        <div className="bg-bg-light p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-white mb-4">Exam Details</h2>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label htmlFor="title" className="block text-gray-300 mb-1">Exam Title</label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className={`w-full bg-bg-dark border ${formErrors.title ? 'border-red-500' : 'border-gray-700'} rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent`}
                placeholder="Enter exam title"
              />
              {formErrors.title && <div className="text-red-500 text-sm mt-1">{formErrors.title}</div>}
            </div>
            
            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-gray-300 mb-1">Description (min. 10 characters)</label>
              <textarea
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className={`w-full bg-bg-dark border ${formErrors.description ? 'border-red-500' : 'border-gray-700'} rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent min-h-[100px]`}
                placeholder="Enter exam description (minimum 10 characters)"
              />
              {formErrors.description && <div className="text-red-500 text-sm mt-1">{formErrors.description}</div>}
            </div>
            
            <div>
              <label htmlFor="duration" className="block text-gray-300 mb-1">Duration (minutes)</label>
              <input
                type="number"
                id="duration"
                value={duration}
                onChange={e => setDuration(parseInt(e.target.value) || 0)}
                min="1"
                className={`w-full bg-bg-dark border ${formErrors.duration ? 'border-red-500' : 'border-gray-700'} rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent`}
              />
              {formErrors.duration && <div className="text-red-500 text-sm mt-1">{formErrors.duration}</div>}
            </div>
            
            {/* Section selector - now enabled with proper error handling */}
            <div>
              <label htmlFor="section" className="block text-gray-300 mb-1">Section (Optional)</label>
              <select
                id="section"
                value={sectionId || ''}
                onChange={e => setSectionId(e.target.value ? parseInt(e.target.value) : null)}
                className={`w-full bg-bg-dark border ${formErrors.sectionId ? 'border-red-500' : 'border-gray-700'} rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent`}
              >
                <option value="">-- No Section --</option>
                {sections.map(section => (
                  <option key={section.id} value={section.id}>
                    {section.name}
                  </option>
                ))}
              </select>
              {formErrors.sectionId && <div className="text-red-500 text-sm mt-1">{formErrors.sectionId}</div>}
            </div>
            
            <div>
              <label htmlFor="difficulty" className="block text-gray-300 mb-1">Difficulty</label>
              <select
                id="difficulty"
                value={difficulty}
                onChange={e => setDifficulty(e.target.value)}
                className={`w-full bg-bg-dark border ${formErrors.difficulty ? 'border-red-500' : 'border-gray-700'} rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent`}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
              {formErrors.difficulty && <div className="text-red-500 text-sm mt-1">{formErrors.difficulty}</div>}
            </div>
            
            <div>
              <label className="block text-gray-300 mb-3">Accessibility</label>
              <div className="flex items-center gap-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    checked={isPublic}
                    onChange={() => setIsPublic(true)}
                    className="form-radio h-5 w-5 text-accent"
                  />
                  <span className="ml-2 text-white">Public (All ages)</span>
                </label>
                
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    checked={!isPublic}
                    onChange={() => setIsPublic(false)}
                    className="form-radio h-5 w-5 text-accent"
                  />
                  <span className="ml-2 text-white">Age Restricted</span>
                </label>
              </div>
            </div>
            
            {!isPublic && (
              <>
                <div>
                  <label htmlFor="minAge" className="block text-gray-300 mb-1">Min Age</label>
                  <input
                    type="number"
                    id="minAge"
                    value={minAge}
                    onChange={e => setMinAge(parseInt(e.target.value) || 0)}
                    min="0"
                    className={`w-full bg-bg-dark border ${formErrors.minAge ? 'border-red-500' : 'border-gray-700'} rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent`}
                  />
                  {formErrors.minAge && <div className="text-red-500 text-sm mt-1">{formErrors.minAge}</div>}
                </div>
                
                <div>
                  <label htmlFor="maxAge" className="block text-gray-300 mb-1">Max Age</label>
                  <input
                    type="number"
                    id="maxAge"
                    value={maxAge}
                    onChange={e => setMaxAge(parseInt(e.target.value) || 0)}
                    min="1"
                    className={`w-full bg-bg-dark border ${formErrors.maxAge ? 'border-red-500' : 'border-gray-700'} rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent`}
                  />
                  {formErrors.maxAge && <div className="text-red-500 text-sm mt-1">{formErrors.maxAge}</div>}
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Questions Section */}
        <h2 className="text-xl font-semibold text-white mb-4 border-t border-gray-700 pt-4">الأسئلة</h2>
        {formErrors.questions_summary && (
          <ErrorMessage message={formErrors.questions_summary} variant="error" dismissible={false} />
        )}
        
        {questions.map((question, index) => {
            const qKey = `question_${index}`;
            return (
              <div key={question.id} className="bg-bg-dark p-4 rounded-lg mb-4 border border-gray-700">
                {/* Question Header (Number, Remove Button) */}
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-medium text-gray-200">السؤال {index + 1}</h3>
                  {questions.length > 1 && (
                     <Button type="button" variant="danger" size="sm" icon={<FiTrash2 />} onClick={() => removeQuestion(question.id)}>إزالة</Button>
                  )}
                </div>

                {/* Question Title Field */}
                <div className="mb-3">
                  <label htmlFor={`question-${question.id}`} className="block text-gray-300 mb-1">
                    Question Title <span className="text-xs text-gray-400">(at least 3 characters)</span>
                  </label>
                  <input
                    type="text"
                    id={`question-${question.id}`}
                    value={question.title}
                    onChange={e => updateQuestionTitle(question.id, e.target.value)}
                    className={`w-full bg-bg-dark border ${formErrors[`question_${index}_title`] ? 'border-red-500' : 'border-gray-600'} rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent`}
                    placeholder="Enter question title (minimum 3 characters)"
                    minLength={3}
                  />
                  {formErrors[`question_${index}_title`] && <p className="mt-1 text-red-500 text-sm">{formErrors[`question_${index}_title`]}</p>}
                </div>

                {/* Question Type Selector */}
                <div className="mb-3">
                   <label htmlFor={`${qKey}_type`} className="block text-gray-400 mb-1 text-sm">نوع السؤال</label>
                   <select 
                      id={`${qKey}_type`} 
                      value={question.type} 
                      onChange={(e) => updateQuestionType(question.id, e.target.value as QuestionType)}
                      className="w-full bg-bg-dark border border-gray-600 rounded px-2 py-1 text-white focus:outline-none focus:border-primary"
                    >
                      <option value="multiple-choice">اختيار من متعدد</option>
                      <option value="true-false">صح / خطأ</option>
                      <option value="short-answer">إجابة قصيرة</option>
                   </select>
                </div>

                {/* Conditional Rendering based on Type */} 
                {(question.type === 'multiple-choice' || question.type === 'true-false') && (
                  <div className="mb-3">
                     <label className="block text-gray-400 mb-1 text-sm">الخيارات (حدد الإجابة الصحيحة)</label>
                      {question.options.map((option, optIndex) => (
                        <div key={option.id} className="flex items-center mb-2">
                          <input 
                              type="radio" 
                              name={`${qKey}_correct`} 
                              checked={question.correctOptionId === option.id}
                              onChange={() => setCorrectAnswer(question.id, option.id)}
                              className="ml-2 form-radio h-4 w-4 text-primary focus:ring-primary border-gray-600 bg-bg-dark"
                          />
                          <input 
                              type="text" 
                              value={option.text} 
                              onChange={e => updateOptionText(question.id, option.id, e.target.value)} 
                              className={`flex-grow bg-bg-dark border rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-primary mr-2 ${question.type === 'true-false' ? 'border-gray-700 cursor-not-allowed' : 'border-gray-600'}`}
                              placeholder={`خيار ${optIndex + 1}`}
                              readOnly={question.type === 'true-false'} // Make T/F options read-only
                          />
                          {/* Remove Option Button (Only for MC and if > 2 options) */}
                          {question.type === 'multiple-choice' && question.options.length > 2 && (
                             <Button type="button" variant="danger" size="sm" icon={<FiX />} onClick={() => removeOption(question.id, option.id)} />
                          )}
                          {/* Minimal error indicator for option text */}
                          {formErrors[`${qKey}_option_${optIndex}`] && <p className="ml-2 text-red-500 text-xs">!</p>} 
                        </div>
                      ))}
                      {/* Option validation errors */}
                      {question.options.some((opt, optIndex) => formErrors[`${qKey}_option_${optIndex}`]) && 
                        <p className="mt-1 text-red-500 text-sm">جميع نصوص الخيارات مطلوبة.</p> }
                      {formErrors[`${qKey}_correct`] && <p className="mt-1 text-red-500 text-sm">{formErrors[`${qKey}_correct`]}</p>}
                      {formErrors[`${qKey}_options`] && <p className="mt-1 text-red-500 text-sm">{formErrors[`${qKey}_options`]}</p>}
                </div>
              )}

                {(question.type === 'short-answer') && (
                  <div className="mb-3">
                    <label htmlFor={`${qKey}_correct_text`} className="block text-gray-300 mb-1">
                      Correct Answer Text
                    </label>
                    <input
                      type="text"
                      id={`${qKey}_correct_text`}
                      value={question.correctAnswerText || ''}
                      onChange={e => updateCorrectAnswerText(question.id, e.target.value)}
                      className={`w-full bg-bg-dark border ${formErrors[`${qKey}_correct_text`] ? 'border-red-500' : 'border-gray-600'} rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent`}
                      placeholder="Enter correct answer text"
                    />
                    {formErrors[`${qKey}_correct_text`] && <p className="mt-1 text-red-500 text-sm">{formErrors[`${qKey}_correct_text`]}</p>}
                  </div>
                )}

                {(question.type === 'matching' || question.type === 'ordering') && (
                  <div className="mb-3">
                    <label className="block text-gray-300 mb-1">Matching Items</label>
                    {question.matchingItems && question.matchingItems.map((item, itemIndex) => (
                      <div key={item.id} className="flex items-center mb-2">
                        <label className="block text-gray-300 mr-2">Left:</label>
                        <input
                          type="text"
                          value={item.left}
                          onChange={(e) => updateMatchingItem(question.id, item.id, 'left', e.target.value)}
                          className={`w-full bg-bg-dark border ${formErrors[`question_${index}_matching_${itemIndex}_left`] ? 'border-red-500' : 'border-gray-600'} rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent`}
                          placeholder="Enter left side text"
                        />
                        {formErrors[`question_${index}_matching_${itemIndex}_left`] && <p className="mt-1 text-red-500 text-sm">{formErrors[`question_${index}_matching_${itemIndex}_left`]}</p>}
                      </div>
                    ))}
                    {question.matchingItems && question.matchingItems.map((item, itemIndex) => (
                      <div key={item.id} className="flex items-center mb-2">
                        <label className="block text-gray-300 mr-2">Right:</label>
                        <input
                          type="text"
                          value={item.right}
                          onChange={(e) => updateMatchingItem(question.id, item.id, 'right', e.target.value)}
                          className={`w-full bg-bg-dark border ${formErrors[`question_${index}_matching_${itemIndex}_right`] ? 'border-red-500' : 'border-gray-600'} rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent`}
                          placeholder="Enter right side text"
                        />
                        {formErrors[`question_${index}_matching_${itemIndex}_right`] && <p className="mt-1 text-red-500 text-sm">{formErrors[`question_${index}_matching_${itemIndex}_right`]}</p>}
                      </div>
                    ))}
                  </div>
                )}

                {(question.type === 'ordering') && (
                  <div className="mb-3">
                    <label className="block text-gray-300 mb-1">Ordering Items</label>
                    {question.orderingItems && question.orderingItems.map((item, itemIndex) => (
                      <div key={item.id} className="flex items-center mb-2">
                        <label className="block text-gray-300 mr-2">Item:</label>
                        <input
                          type="text"
                          value={item.text}
                          onChange={(e) => updateOrderingItemText(question.id, item.id, e.target.value)}
                          className={`w-full bg-bg-dark border ${formErrors[`question_${index}_ordering_${itemIndex}`] ? 'border-red-500' : 'border-gray-600'} rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent`}
                          placeholder="Enter item text"
                        />
                        {formErrors[`question_${index}_ordering_${itemIndex}`] && <p className="mt-1 text-red-500 text-sm">{formErrors[`question_${index}_ordering_${itemIndex}`]}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

        {/* Add Question Button */}
        <Button type="button" variant="secondary" icon={<FiPlus />} onClick={addQuestion} className="mt-4 mb-6">إضافة سؤال</Button>

        {/* Form Actions */}
        <div className="flex justify-end gap-4 mt-8 border-t border-gray-700 pt-6">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/admin/exams')}
          >
            Cancel
          </Button>
          
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader /> : 'Create Exam'}
          </Button>
        </div>
      </form>
    </AdminLayout>
  );
};

export default AdminCreateExamPage;