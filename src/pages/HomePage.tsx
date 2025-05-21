import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Button from '../components/Button'
import Loader from '../components/Loader'
import ExamFilter, { FilterOptions } from '../components/ExamFilter'
import { useLoading } from '../context/LoadingContext'
import { useError } from '../context/ErrorContext'
import DataFetchWrapper from '../components/DataFetchWrapper'
import { useAuth } from '../context/AuthContext'
import { examApi, resultsApi, api } from '../utils/api'
import { ExamSummary } from '../types/api'

// Use API type + add completed status
interface HomePageExam extends ExamSummary {
  // Inherits id, title, description, questionCount, duration, createdAt, etc. from ExamSummary
  completed?: boolean;
  // Adding additional fields that might come from the API but aren't in ExamSummary
  createdAt: string;
  questionsCount: number;
  minAge?: number;
  maxAge?: number;
  section?: {
    id: string;
    name: string;
  };
  // For backward compatibility
  questionCount?: number;
}

interface Section {
  id: string | number
  name: string
  description?: string
}

type SortBy = 'title' | 'date'
type SortOrder = 'asc' | 'desc'

// Calculate age from date of birth
function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

const HomePage = () => {
  const [exams, setExams] = useState<HomePageExam[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const { startLoading, stopLoading } = useLoading()
  const { showError } = useError()
  const { user, isUserLoggedIn } = useAuth()
  
  // State for filtering and sorting
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ 
    searchTerm: '', 
    sectionId: '', 
    difficulty: '' 
  })
  const [sortBy, setSortBy] = useState<SortBy>('date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  
  // Fetch sections
  useEffect(() => {
    const fetchSections = async () => {
      try {
        const sectionsData = await api.get<{sections: Section[]}>('/sections');
        setSections(sectionsData.sections);
      } catch (error) {
        console.error('Error fetching sections:', error);
      }
    };
    
    fetchSections();
  }, []);
  
  // Handle filter changes
  const handleFilterChange = (filters: FilterOptions) => {
    setFilterOptions(filters);
  };
  
  // Handle sort changes (can be passed to ExamFilter or handled by separate UI)
  const handleSortChange = (newSortBy: SortBy, newSortOrder: SortOrder) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  };
  
  // Fetch exams from API
  useEffect(() => {
    const fetchExams = async () => {
      if (!isUserLoggedIn) return;
      
      const loadingId = 'fetch-exams';
      setIsLoading(true);
      setError('');
      startLoading(loadingId, 'جاري تحميل الاختبارات...');
      
      try {
        const response = await examApi.getExams();
        
        if (response.error || !response.data) {
          throw new Error(response.error || 'فشل في تحميل الاختبارات');
        }
        
        // Since the API returns a flattened structure with exams directly
        const examsData: ExamSummary[] = response.data.exams || [];
        
        // Fetch results to check completion status
        const userResults = await resultsApi.getResults();
        const completedExamIds = new Set<string>();
        
        // Since the API returns a flattened structure with results directly
        if (userResults.data?.results) {
          userResults.data.results.forEach((result: any) => {
            completedExamIds.add(result.examId);
          });
        }
        
        // Combine API data with completion status and ensure needed fields exist
        const examsWithCompletionStatus: HomePageExam[] = examsData.map((examSummary) => ({
          ...examSummary,
          completed: completedExamIds.has(examSummary.id),
          // Add createdAt if not present in ExamSummary but needed for sorting
          // This assumes the API *does* return createdAt, even if not in ExamSummary type yet
          createdAt: (examSummary as any).createdAt || new Date(0).toISOString(), // Add fallback
          questionsCount: (examSummary as any).questionsCount || 0,
          minAge: (examSummary as any).minAge,
          maxAge: (examSummary as any).maxAge,
          section: (examSummary as any).section,
          questionCount: (examSummary as any).questionCount
        }));
        
        setExams(examsWithCompletionStatus);
      } catch (error: any) {
        console.error('Error fetching exams:', error);
        setError(error.message || 'فشل في تحميل الاختبارات. يرجى المحاولة مرة أخرى لاحقًا.');
        showError(error.message || 'فشل في تحميل الاختبارات');
      } finally {
        setIsLoading(false);
        stopLoading(loadingId);
      }
    };
    
    fetchExams();
  }, [isUserLoggedIn, user, startLoading, stopLoading, showError]);

  // Process exams (filter and sort)
  const processedExams = useMemo(() => {
    if (!exams || exams.length === 0) return [];
    
    let processed = [...exams]; // Start with a copy of the original list
    
    // Get user's age for filtering
    const userAge = user?.dateOfBirth ? calculateAge(user.dateOfBirth) : null;
    
    // Apply Filters
    processed = processed.filter(exam => {
      // Text search filter
      if (filterOptions.searchTerm && 
          !exam.title.toLowerCase().includes(filterOptions.searchTerm.toLowerCase()) &&
          !exam.description.toLowerCase().includes(filterOptions.searchTerm.toLowerCase())) {
        return false;
      }
      
      // Section filter
      if (filterOptions.sectionId && exam.sectionId !== filterOptions.sectionId) {
        return false;
      }
      
      // Difficulty filter
      if (filterOptions.difficulty && exam.difficulty !== filterOptions.difficulty) {
        return false;
      }
      
      // Age eligibility filter - only show exams the user is eligible for
      if (userAge !== null && !exam.isPublic) {
        if (exam.minAge !== undefined && exam.maxAge !== undefined) {
          if (userAge < exam.minAge || userAge > exam.maxAge) {
            return false;
          }
        }
      }
      
      return true;
    });

    // Apply Sorting
    processed.sort((a, b) => {
      let compareA: string | number;
      let compareB: string | number;

      if (sortBy === 'title') {
        compareA = a.title.toLowerCase();
        compareB = b.title.toLowerCase();
      } else { // Default to date (createdAt)
        compareA = new Date(a.createdAt).getTime();
        compareB = new Date(b.createdAt).getTime();
      }

      if (compareA < compareB) {
        return sortOrder === 'asc' ? -1 : 1;
      }
      if (compareA > compareB) {
        return sortOrder === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return processed;
  }, [exams, filterOptions, sortBy, sortOrder, user?.dateOfBirth]);
  
  return (
    <div className="min-h-screen bg-bg-light dark:bg-gray-900">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-text-heading dark:text-white mb-2" data-aos="fade-up">
            الاختبارات <span className="text-primary-500">المتاحة</span>
          </h1>
          <p className="text-text-body dark:text-gray-400 mb-8" data-aos="fade-up" data-aos-delay="100">
            اختر اختبارًا يناسب عمرك واهتماماتك
          </p>
          
          {!isLoading && !error && exams.length > 0 && (
            <ExamFilter 
              onFilterChange={handleFilterChange}
              sections={sections}
            />
          )}
          
          <DataFetchWrapper
            isLoading={isLoading}
            error={error}
            isEmpty={processedExams.length === 0}
            emptyMessage="لا توجد اختبارات متاحة لك حاليًا. قد يكون هذا بسبب محددات العمر في الاختبارات المتاحة."
            loadingId="fetch-exams"
            skeletonType="list"
            skeletonRows={4}
          >
            <div className="space-y-6">
              {processedExams.map((exam, index) => (
                <div 
                  key={exam.id}
                  className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-slate-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-400 transition-colors"
                  data-aos="fade-up"
                  data-aos-delay={index * 100}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="mb-4 md:mb-0">
                      <div className="flex items-center">
                        <h2 className="text-xl md:text-2xl font-semibold text-text-heading dark:text-white mb-2">
                          {exam.title}
                        </h2>
                        {exam.completed && (
                          <span className="mr-2 text-emerald-500 dark:text-emerald-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                        )}
                      </div>
                      <p className="text-text-body dark:text-gray-400 mb-3">{exam.description}</p>
                      
                      <div className="flex flex-wrap gap-3 text-sm">
                        <span className="bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-200 px-3 py-1 rounded-full">
                          {exam.questionsCount || exam.questionCount} سؤال
                        </span>
                        <span className="bg-slate-100 text-slate-700 dark:bg-gray-700 dark:text-gray-200 px-3 py-1 rounded-full">
                          {exam.duration} دقيقة
                        </span>
                        {(exam.minAge && exam.maxAge) && (
                          <span className="bg-secondary-50 text-secondary-700 dark:bg-blue-900 dark:text-blue-200 px-3 py-1 rounded-full">
                            الأعمار {exam.minAge}-{exam.maxAge}
                          </span>
                        )}
                        {exam.section && (
                          <span className="bg-emerald-50 text-emerald-700 dark:bg-green-900 dark:text-green-200 px-3 py-1 rounded-full">
                            {exam.section.name}
                          </span>
                        )}
                        {exam.isPublic && (
                          <span className="bg-yellow-50 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200 px-3 py-1 rounded-full">
                            متاح للجميع
                          </span>
                        )}
                        {exam.difficulty && (
                          <span className={`px-3 py-1 rounded-full ${
                            exam.difficulty === 'easy' 
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-green-900 dark:text-green-200' 
                              : exam.difficulty === 'medium'
                                ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200'
                                : 'bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {exam.difficulty === 'easy' 
                              ? 'سهل' 
                              : exam.difficulty === 'medium' 
                                ? 'متوسط' 
                                : 'صعب'}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <Link to={`/exam/${exam.id}`}>
                        <Button variant="primary" className="min-w-[100px] px-6">
                          {exam.completed ? 'إعادة' : 'ابدأ'}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </DataFetchWrapper>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 