import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import { userApi } from '../utils/api';
import { UserExamResult } from '../types/api';
import { useLoading } from '../context/LoadingContext';
import { useError } from '../context/ErrorContext';

const ResultsPage: React.FC = () => {
  const [results, setResults] = useState<UserExamResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { startLoading, stopLoading } = useLoading();
  const { showError } = useError();

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setIsLoading(true);
        setError(null);
        startLoading('fetch-results', 'جاري تحميل النتائج...');
        
        const response = await userApi.getResults();
        
        // Handle errors
        if (response.error) {
          setError(response.error);
          showError(response.error);
          return;
        }
        
        // Handle empty or null response
        if (response.data && response.data.results) {
          // Sort results by date - most recent first
          const sortedResults = [...response.data.results].sort((a, b) => {
            const dateA = new Date(a.completedAt || a.createdAt);
            const dateB = new Date(b.completedAt || b.createdAt);
            return dateB.getTime() - dateA.getTime();
          });
          
          setResults(sortedResults);
        } else {
          setResults([]);
        }
      } catch (error) {
        console.error('Failed to fetch results:', error);
        setError('فشل في تحميل النتائج');
        showError('فشل في تحميل النتائج');
      } finally {
        setIsLoading(false);
        stopLoading('fetch-results');
      }
    };

    fetchResults();
  }, [startLoading, stopLoading, showError]);

  // Handle viewing a specific result
  const handleViewResult = (resultId: string) => {
    navigate(`/result/${resultId}`);
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-dark">
        <Navbar />
        <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center">
          <Loader size="lg" />
          <p className="mt-4 text-gray-400">جاري تحميل النتائج...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="min-h-screen bg-bg-dark">
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <div className="bg-bg-light rounded-lg p-6 shadow-lg text-center">
            <h2 className="text-xl text-red-500 font-bold mb-4">{error}</h2>
            <button 
              onClick={() => window.location.reload()}
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/80 transition-colors"
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render empty state if no results
  if (!results.length) {
    return (
      <div className="min-h-screen bg-bg-dark">
        <Navbar />
        <EmptyState 
          title="لا توجد نتائج" 
          message="لم تقم بإكمال أي اختبارات حتى الآن. قم بإجراء بعض الاختبارات للحصول على النتائج."
          icon="fact_check"
          actionLabel="استعرض الاختبارات المتاحة"
          onAction={() => navigate('/')}
        />
      </div>
    );
  }

  // Render results list
  return (
    <div className="min-h-screen bg-bg-dark">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">نتائج الاختبارات</h1>
        
        <div className="grid grid-cols-1 gap-4">
          {results.map((result) => {
            // Ensure percentage is a valid number between 0-100
            const percentage = isNaN(result.percentage) ? 
              Math.round((result.score / Math.max(1, result.totalQuestions)) * 100) :
              Math.max(0, Math.min(100, result.percentage));
              
            return (
              <div 
                key={result.id}
                className="bg-bg-light rounded-lg p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer"
                onClick={() => handleViewResult(result.id)}
              >
                <h2 className="text-xl font-bold text-white mb-2">{result.examTitle || 'اختبار'}</h2>
                
                <div className="flex justify-between items-center mt-4">
                  <div className="flex items-center">
                    <span className="material-icons text-primary mr-1">calendar_today</span>
                    <span className="text-gray-300 text-sm">
                      {new Date(result.completedAt || result.createdAt).toLocaleDateString('ar-SA')}
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <div className={`px-4 py-1 rounded-full text-sm font-medium ${getScoreColorClass(percentage)}`}>
                      {result.score} / {result.totalQuestions} ({percentage}%)
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Helper function to get color class based on score percentage
const getScoreColorClass = (percentage: number): string => {
  if (percentage >= 90) return 'bg-green-500 text-white';
  if (percentage >= 80) return 'bg-blue-500 text-white';
  if (percentage >= 70) return 'bg-blue-400 text-white';
  if (percentage >= 60) return 'bg-yellow-500 text-white';
  if (percentage >= 40) return 'bg-orange-500 text-white';
  return 'bg-red-500 text-white';
};

export default ResultsPage; 