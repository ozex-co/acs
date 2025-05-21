import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import Button from '../components/Button';
import Loader from '../components/Loader';
import { useLoading } from '../context/LoadingContext';
import { useError } from '../context/ErrorContext';
import { FiPlus, FiX, FiCheck, FiTrash2 } from 'react-icons/fi';
import { adminApi } from '../utils/api';

interface QuestionOption {
  id: string;
  text: string;
}

interface Question {
  id: string;
  title: string;
  options: QuestionOption[];
  correctOptionId: string | null;
}

interface ExamData {
  id: string;
  title: string;
  description: string;
  duration: number;
  minAge: number;
  maxAge: number;
  isPublic: boolean;
  questions: {
    id: string;
    title: string;
    options: string[];
    correctOptionIndex: number;
  }[];
}

const AdminEditExamPage: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { startLoading, stopLoading } = useLoading();
  const { showError } = useError();
  
  // Exam details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(30); // in minutes
  const [minAge, setMinAge] = useState(0);
  const [maxAge, setMaxAge] = useState(100);
  const [isPublic, setIsPublic] = useState(false);
  
  // Questions
  const [questions, setQuestions] = useState<Question[]>([]);
  
  // Form state
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  
  // Fetch exam data
  useEffect(() => {
    const fetchExam = async () => {
      const loadingId = 'fetch-exam';
      startLoading(loadingId, 'Loading exam...');
      
      try {
        if (!examId) {
          throw new Error('Exam ID is missing');
        }

        // Call the API to get the exam data using adminApi
        const response = await adminApi.getExamById(examId);
        
        if (response.error || !response.data) {
          throw new Error(response.error || 'Failed to load exam data');
        }
        
        const examData: ExamData = response.data.exam;
        
        // Set exam details
        setTitle(examData.title);
        setDescription(examData.description);
        setDuration(examData.duration);
        setIsPublic(examData.isPublic);
        setMinAge(examData.minAge);
        setMaxAge(examData.maxAge);
        
        // Convert questions to the format we need
        const formattedQuestions = examData.questions.map(q => {
          const options = q.options.map((optText, index) => ({
            id: `opt_${q.id}_${index}`,
            text: optText
          }));
          
          return {
            id: q.id,
            title: q.title,
            options,
            correctOptionId: q.correctOptionIndex >= 0 && q.correctOptionIndex < options.length 
              ? options[q.correctOptionIndex].id 
              : null
          };
        });
        
        setQuestions(formattedQuestions);
      } catch (error: any) {
        console.error('Error fetching exam:', error);
        setError(error.message || 'Failed to load exam data. Please try again.');
        showError(error.message || 'Failed to load exam data');
      } finally {
        setIsLoading(false);
        stopLoading(loadingId);
      }
    };
    
    fetchExam();
  }, [examId, navigate, showError, startLoading, stopLoading]);
  
  // Create a new empty question with unique ID
  function createEmptyQuestion(): Question {
    return {
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: '',
      options: [
        { id: `opt_${Date.now()}_1`, text: '' },
        { id: `opt_${Date.now()}_2`, text: '' },
        { id: `opt_${Date.now()}_3`, text: '' },
        { id: `opt_${Date.now()}_4`, text: '' }
      ],
      correctOptionId: null
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
    const question = questions.find(q => q.id === questionId);
    if (!question) return;
    
    if (question.options.length >= 8) {
      showError('Maximum 8 options per question');
      return;
    }
    
    const newOption = { 
      id: `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, 
      text: '' 
    };
    
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { ...q, options: [...q.options, newOption] } 
        : q
    ));
  };
  
  // Remove an option
  const removeOption = (questionId: string, optionId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;
    
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
  
  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Validate exam details
    if (!title.trim()) {
      errors.title = 'Title is required';
    }
    
    if (!description.trim()) {
      errors.description = 'Description is required';
    }
    
    if (duration <= 0) {
      errors.duration = 'Duration must be greater than 0';
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
      if (!question.title.trim()) {
        errors[`question_${index}_title`] = 'Question title is required';
        hasQuestionErrors = true;
      }
      
      let hasEmptyOption = false;
      question.options.forEach((option, optIndex) => {
        if (!option.text.trim()) {
          errors[`question_${index}_option_${optIndex}`] = 'Option text is required';
          hasEmptyOption = true;
        }
      });
      
      if (!question.correctOptionId) {
        errors[`question_${index}_correct`] = 'Please select a correct answer';
        hasQuestionErrors = true;
      }
    });
    
    if (hasQuestionErrors) {
      errors.questions = 'Please fix errors in questions';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showError('Please fix the errors in the form');
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
      questions: questions.map(q => ({
        id: q.id.startsWith('q_') ? undefined : q.id, // Only send existing IDs
        title: q.title,
        options: q.options.map(o => o.text),
        correctOptionIndex: q.options.findIndex(o => o.id === q.correctOptionId)
      }))
    };
    
    setIsSubmitting(true);
    const loadingId = 'update-exam';
    startLoading(loadingId, 'Updating exam...');
    
    try {
      if (!examId) {
        throw new Error('Exam ID is missing');
      }
      
      // Call the API using adminApi
      const response = await adminApi.updateExam(examId, examData);
      
      if (response.error || !response.data) {
        throw new Error(response.error || 'Failed to update exam');
      }
      
      // If successful, redirect to exams page
      navigate('/admin/exams', { 
        state: { 
          message: 'Exam updated successfully!',
          examId
        } 
      });
    } catch (error: any) {
      console.error('Error updating exam:', error);
      showError(error.message || 'Failed to update exam. Please try again.');
    } finally {
      setIsSubmitting(false);
      stopLoading(loadingId);
    }
  };
  
  if (isLoading) {
    return (
      <AdminLayout title="Edit Exam">
        <div className="text-center py-12">
          <Loader size="lg" />
          <p className="mt-4 text-gray-400">Loading exam...</p>
        </div>
      </AdminLayout>
    );
  }
  
  if (error) {
    return (
      <AdminLayout title="Edit Exam">
        <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-500 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>{error}</p>
          <Button 
            variant="primary"
            className="mt-4"
            onClick={() => navigate('/admin/exams')}
          >
            Back to Exams
          </Button>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout title="Edit Exam">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Edit Exam</h1>
        <p className="text-gray-400 mt-1">Update exam details and questions</p>
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
              <label htmlFor="description" className="block text-gray-300 mb-1">Description</label>
              <textarea
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className={`w-full bg-bg-dark border ${formErrors.description ? 'border-red-500' : 'border-gray-700'} rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent min-h-[100px]`}
                placeholder="Enter exam description"
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
        <div className="bg-bg-light p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Questions</h2>
            <Button
              type="button"
              variant="primary"
              onClick={addQuestion}
              className="flex items-center gap-2"
            >
              <FiPlus /> Add Question
            </Button>
          </div>
          
          {formErrors.questions && (
            <div className="mb-4 p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg text-red-500">
              {formErrors.questions}
            </div>
          )}
          
          <div className="space-y-6">
            {questions.map((question, qIndex) => (
              <div 
                key={question.id} 
                className="bg-bg-dark p-5 rounded-lg border border-gray-700"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-white">Question #{qIndex + 1}</h3>
                  
                  <button
                    type="button"
                    onClick={() => removeQuestion(question.id)}
                    className="text-red-500 hover:text-red-400 p-1 rounded-full hover:bg-red-500 hover:bg-opacity-10"
                    title="Remove question"
                  >
                    <FiTrash2 size={18} />
                  </button>
                </div>
                
                <div className="mb-4">
                  <label htmlFor={`question-${question.id}`} className="block text-gray-300 mb-1">
                    Question Title
                  </label>
                  <input
                    type="text"
                    id={`question-${question.id}`}
                    value={question.title}
                    onChange={e => updateQuestionTitle(question.id, e.target.value)}
                    className={`w-full bg-bg-dark border ${formErrors[`question_${qIndex}_title`] ? 'border-red-500' : 'border-gray-600'} rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent`}
                    placeholder="Enter question title"
                  />
                  {formErrors[`question_${qIndex}_title`] && 
                    <div className="text-red-500 text-sm mt-1">{formErrors[`question_${qIndex}_title`]}</div>
                  }
                </div>
                
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-gray-300">Answer Options</label>
                    <button
                      type="button"
                      onClick={() => addOption(question.id)}
                      className="text-xs flex items-center gap-1 text-primary hover:text-primary-light"
                    >
                      <FiPlus size={14} /> Add Option
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {question.options.map((option, optIndex) => (
                      <div key={option.id} className="flex items-center gap-3">
                        <div className="flex-grow">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={option.text}
                              onChange={e => updateOptionText(question.id, option.id, e.target.value)}
                              className={`w-full bg-bg-dark border ${formErrors[`question_${qIndex}_option_${optIndex}`] ? 'border-red-500' : 'border-gray-600'} rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent`}
                              placeholder={`Option ${optIndex + 1}`}
                            />
                            
                            <button
                              type="button"
                              onClick={() => removeOption(question.id, option.id)}
                              className="text-gray-500 hover:text-red-400 p-1"
                              title="Remove option"
                            >
                              <FiX size={18} />
                            </button>
                          </div>
                          
                          {formErrors[`question_${qIndex}_option_${optIndex}`] && 
                            <div className="text-red-500 text-sm mt-1">{formErrors[`question_${qIndex}_option_${optIndex}`]}</div>
                          }
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => setCorrectAnswer(question.id, option.id)}
                          className={`w-10 h-10 rounded-full flex items-center justify-center border ${
                            question.correctOptionId === option.id
                              ? 'bg-green-500 bg-opacity-20 border-green-500 text-green-500'
                              : 'bg-transparent border-gray-600 text-gray-400'
                          }`}
                          title={question.correctOptionId === option.id ? "Correct answer" : "Set as correct answer"}
                        >
                          <FiCheck size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  {formErrors[`question_${qIndex}_correct`] && (
                    <div className="text-red-500 text-sm mt-2">{formErrors[`question_${qIndex}_correct`]}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {questions.length < 1 && (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">No questions found. Add your first question.</p>
              <Button type="button" variant="primary" onClick={addQuestion}>
                <FiPlus className="mr-2" /> Add Question
              </Button>
            </div>
          )}
        </div>
        
        {/* Submit Button */}
        <div className="flex justify-end gap-4">
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
            Update Exam
          </Button>
        </div>
      </form>
    </AdminLayout>
  );
};

export default AdminEditExamPage; 