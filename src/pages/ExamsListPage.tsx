import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import { examApi } from '../utils/api';
import { ExamSummary } from '../types/api';
import { useLoading } from '../context/LoadingContext';
import { useError } from '../context/ErrorContext';

// Extended type to handle possible inconsistencies in the API
interface ExtendedExamSummary extends ExamSummary {
  questionCount?: number; // Some endpoints might use this instead of questionsCount
  questions?: any[]; // Some endpoints might include questions directly
}

const ExamsListPage: React.FC = () => {
  const [exams, setExams] = useState<ExtendedExamSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { startLoading, stopLoading } = useLoading();
  const { showError } = useError();

  useEffect(() => {
    const fetchExams = async () => {
      try {
        setIsLoading(true);
        setError(null);
        startLoading('fetch-exams', 'جاري تحميل الاختبارات...');
        
        const response = await examApi.getExams();
        console.log('Exams response:', response);
        
        // Check for error
        if (response.error) {
          showError(response.error);
          setError(response.error);
          return;
        }
        
        // Handle empty response or null data
        if (response.data && response.data.exams) {
          console.log('Setting exams:', response.data.exams);
          
          // Check if we have questions count mismatch
          response.data.exams.forEach((exam: ExtendedExamSummary) => {
            if ((exam.questionsCount > 0 || exam.questionCount > 0) && 
                (!exam.questions || exam.questions.length === 0)) {
              console.warn(`Exam ${exam.id} (${exam.title}) has questionsCount ${exam.questionsCount || exam.questionCount} but no questions array`);
            }
          });
          
          setExams(response.data.exams as ExtendedExamSummary[]);
        } else {
          // If there's no data, set empty array
          console.log('No exams data found in response');
          setExams([]);
          setError('لا توجد اختبارات متاحة في الوقت الحالي');
        }
      } catch (error) {
        console.error('Failed to fetch exams:', error);
        const errorMessage = error instanceof Error ? error.message : 'فشل في تحميل الاختبارات';
        showError(errorMessage);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
        stopLoading('fetch-exams');
      }
    };

    fetchExams();
  }, [startLoading, stopLoading, showError]);

  // Handler for clicking on an exam
  const handleExamClick = (examId: string) => {
    navigate(`/exam/${examId}`);
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-dark">
        <Navbar />
        <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center">
          <Loader size="lg" />
          <p className="mt-4 text-gray-400">جاري تحميل الاختبارات...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="min-h-screen bg-bg-dark">
        <Navbar />
        <EmptyState 
          title="خطأ في تحميل الاختبارات" 
          message={error}
          icon="error"
          actionLabel="إعادة المحاولة"
          onAction={() => window.location.reload()}
        />
      </div>
    );
  }

  // Render empty state if no exams
  if (!exams.length) {
    return (
      <div className="min-h-screen bg-bg-dark">
        <Navbar />
        <EmptyState 
          title="لا توجد اختبارات متاحة" 
          message="لا توجد اختبارات متاحة لك في الوقت الحالي. يرجى المحاولة لاحقاً."
          icon="school"
          actionLabel="تحديث الصفحة"
          onAction={() => window.location.reload()}
        />
      </div>
    );
  }

  // Render exams list
  return (
    <div className="min-h-screen bg-bg-dark">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">الاختبارات المتاحة</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => (
            <div 
              key={exam.id}
              className="bg-bg-light rounded-lg p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer"
              onClick={() => handleExamClick(exam.id)}
            >
              <h2 className="text-xl font-bold text-white mb-2">{exam.title}</h2>
              <p className="text-gray-400 mb-4 text-sm h-12 overflow-hidden">{exam.description}</p>
              
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center">
                  <span className="material-icons text-primary mr-1 text-sm">quiz</span>
                  <span className="text-gray-300">{exam.questionCount || exam.questionsCount || 0} سؤال</span>
                </div>
                
                <div className="flex items-center">
                  <span className="material-icons text-primary mr-1 text-sm">timer</span>
                  <span className="text-gray-300">{exam.duration || 'غير محدد'} دقيقة</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExamsListPage; 