import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import ResultIndicator from '../components/ResultIndicator'
import Button from '../components/Button'
import Loader from '../components/Loader'
import { useAuth } from '../context/AuthContext'
import { resultsApi } from '../utils/api'
import { useLoading } from '../context/LoadingContext'
import { useError } from '../context/ErrorContext'
import { normalizeResultData, formatTime, getGradeInfo } from '../utils/result-helpers'

interface ResultState {
  id: string
  score: number
  totalQuestions: number
  percentage: number
  timeSpent: number // in seconds
  examTitle: string
  examId: string
  date: string
  answers: AnswerDetail[]
  mistakes?: number
}

interface AnswerDetail {
  questionId: string
  questionText: string
  selectedOptionText: string
  correctOptionText: string
  isCorrect: boolean
}

const ResultPage = () => {
  const { resultId } = useParams<{ resultId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { isUserLoggedIn } = useAuth()
  const { startLoading, stopLoading } = useLoading()
  const { showError } = useError()
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [result, setResult] = useState<ResultState | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  
  // Check authentication and redirect if needed
  useEffect(() => {
    if (!isUserLoggedIn) {
      // Redirect to login if not authenticated
      navigate('/login', { replace: true })
    }
  }, [isUserLoggedIn, navigate])
  
  // Fetch result data with retry mechanism
  useEffect(() => {
    if (!isUserLoggedIn || !resultId) return
    
    const resultIdStr = resultId.toString()
    
    if (location.state && location.state.id) {
      // Data from navigation state - normalize it
      try {
        const normalized = normalizeResultData(location.state, resultIdStr) as ResultState
        setResult(normalized)
        setIsLoading(false)
      } catch (err) {
        console.error('Error normalizing state data:', err)
        // If normalization fails, fall back to API fetch
        fetchResultFromApi()
      }
    } else {
      // Need to fetch the data with retry
      fetchResultFromApi()
    }
    
    function fetchResultFromApi(retryCount = 0) {
      if (!resultId) return // Add type guard
      
      setIsLoading(true)
      setError('')
      
      startLoading('fetch-result', 'جاري تحميل النتيجة...')
      
      resultsApi.getResultById(resultId) // Use original resultId since API accepts string | number
        .then(response => {
          stopLoading('fetch-result')
          
          if (response.error || !response.data) {
            throw new Error(response.error || 'لم يتم العثور على النتيجة')
          }
          
          // Get data from response
          const responseData = response.data
          
          // Normalize the result data
          const normalized = normalizeResultData(responseData, resultIdStr) as ResultState
          
          // If score is 0 but totalQuestions > 0, it might not be fully processed
          if (normalized.score === 0 && normalized.totalQuestions > 0 && retryCount < 3) {
            console.log('Result may still be processing, retrying in 1 second...')
            setTimeout(() => fetchResultFromApi(retryCount + 1), 1000)
            return
          }
          
          // Set the result
          setResult(normalized)
          setIsLoading(false)
        })
        .catch(error => {
          stopLoading('fetch-result')
          console.error('Error fetching result:', error)
          
          // Retry a few times if the result might still be processing
          if (retryCount < 3) {
            console.log(`Retrying fetch (${retryCount + 1}/3)...`)
            setTimeout(() => fetchResultFromApi(retryCount + 1), 1000)
            return
          }
          
          setError(error?.message || 'Failed to load result data. Please try again later.')
          showError('فشل في تحميل النتيجة')
          setIsLoading(false)
        })
    }
  }, [location.state, resultId, isUserLoggedIn, navigate, showError, startLoading, stopLoading])
  
  const handleShareResult = async () => {
    if (!result) return
    
    try {
      startLoading('share', 'جاري مشاركة النتيجة...')
      
      const response = await resultsApi.shareResult(result.id)
      
      if (response.error || !response.data) {
        throw new Error(response.error || 'فشل في مشاركة النتيجة')
      }
      
      // Copy the share URL to clipboard
      if (response.data.shareUrl) {
        navigator.clipboard.writeText(response.data.shareUrl)
        showError('تم نسخ رابط المشاركة!')
      } else {
        showError('تم مشاركة النتيجة بنجاح')
      }
    } catch (error: any) {
      console.error('Error sharing result:', error)
      showError(error.message || 'فشل في مشاركة النتيجة')
    } finally {
      stopLoading('share')
    }
  }
  
  const handleReturnHome = () => {
    navigate('/')
  }
  
  if (!isUserLoggedIn) {
    return null // Let the auth redirect handle this case
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-dark">
        <Navbar />
        <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center">
          <Loader size="lg" />
          <p className="mt-4 text-gray-400">جاري تحميل النتيجة...</p>
        </div>
      </div>
    )
  }
  
  if (error || !result) {
    return (
      <div className="min-h-screen bg-bg-dark">
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <div className="bg-bg-light p-6 rounded-lg text-center">
            <h2 className="text-xl text-red-500 font-bold mb-4">
              {error || 'لم يتم العثور على النتيجة'}
            </h2>
            <Button variant="primary" onClick={() => navigate('/')}>
              العودة للصفحة الرئيسية
            </Button>
          </div>
        </div>
      </div>
    )
  }
  
  // Get grade and color based on percentage
  const { grade, colorClass } = getGradeInfo(result.percentage)
  
  return (
    <div className="min-h-screen bg-bg-dark pb-16">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">
          نتيجة اختبار {result.examTitle}
        </h1>
        
        <div className="max-w-4xl mx-auto">
          {/* Result Card */}
          <div className="bg-bg-light rounded-lg overflow-hidden shadow-xl mb-8" data-aos="fade-up">
            {/* Score Section */}
            <div className="p-8 text-center">
              <div className="inline-block rounded-full bg-bg-dark p-8 mb-6">
                <span className={`text-6xl font-bold ${colorClass}`}>
                  {result.percentage}%
                </span>
              </div>
              
              <h2 className="text-3xl font-bold text-white mb-4">
                تقييمك: <span className={colorClass}>{grade}</span>
              </h2>
              
              <p className="text-gray-400 text-xl mb-8">
                لقد حصلت على {result.score} من {result.totalQuestions} نقطة
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto mb-8">
                <div className="bg-bg-dark rounded-lg p-4">
                  <span className="material-icons text-primary text-2xl mb-2">timer</span>
                  <p className="text-sm text-gray-400 mb-1">الوقت المستغرق</p>
                  <p className="text-white text-lg">{formatTime(result.timeSpent)}</p>
                </div>
                
                <div className="bg-bg-dark rounded-lg p-4">
                  <span className="material-icons text-primary text-2xl mb-2">calendar_today</span>
                  <p className="text-sm text-gray-400 mb-1">تاريخ الاختبار</p>
                  <p className="text-white text-lg">{result.date}</p>
                </div>
                
                <div className="bg-bg-dark rounded-lg p-4">
                  <span className="material-icons text-primary text-2xl mb-2">error_outline</span>
                  <p className="text-sm text-gray-400 mb-1">الأخطاء</p>
                  <p className="text-white text-lg">{result.mistakes ?? 0}</p>
                </div>
              </div>
              
              <div className="flex flex-wrap justify-center gap-4">
                <Button 
                  variant="secondary"
                  onClick={handleReturnHome}
                  className="px-6 py-3"
                >
                  العودة للرئيسية
                </Button>
                
                {result.answers && result.answers.length > 0 && (
                  <Button 
                    variant="primary"
                    onClick={() => setShowDetails(!showDetails)}
                    className="px-6 py-3"
                  >
                    {showDetails ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
                  </Button>
                )}
                
                <Button 
                  variant="outlined"
                  onClick={handleShareResult}
                  className="px-6 py-3"
                >
                  مشاركة النتيجة
                </Button>
              </div>
            </div>
            
            {/* Answer Details Section */}
            {showDetails && result.answers && result.answers.length > 0 && (
              <div className="border-t border-gray-700 p-6">
                <h3 className="text-xl font-bold text-white mb-6">تفاصيل الإجابات</h3>
                
                <div className="space-y-6">
                  {result.answers.map((answer, index) => (
                    <div 
                      key={answer.questionId}
                      className={`bg-bg-dark rounded-lg p-4 ${
                        answer.isCorrect ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <span className="material-icons text-2xl">
                          {answer.isCorrect ? 'check_circle' : 'cancel'}
                        </span>
                        
                        <div className="flex-1">
                          <p className="text-white text-lg mb-2">
                            {index + 1}. {answer.questionText}
                          </p>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                            <div>
                              <p className="text-sm text-gray-400 mb-1">إجابتك:</p>
                              <p className="text-white">{answer.selectedOptionText || 'لم تجب'}</p>
                            </div>
                            
                            <div>
                              <p className="text-sm text-gray-400 mb-1">الإجابة الصحيحة:</p>
                              <p className="text-white">{answer.correctOptionText}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Result visualization */}
          <div className="mb-8">
            <ResultIndicator 
              score={result.score}
              totalQuestions={result.totalQuestions}
              timeSpent={result.timeSpent}
              animated={true}
              showConfetti={result.percentage >= 70}
            />
          </div>
          
          {/* Motivational message */}
          <div className="text-center text-gray-400 mt-8">
            {result.percentage >= 90 ? (
              <p className="text-green-500">ممتاز! أداء رائع، أنت متفوق!</p>
            ) : result.percentage >= 80 ? (
              <p className="text-blue-500">أحسنت! نتيجة مميزة، استمر في التقدم.</p>
            ) : result.percentage >= 70 ? (
              <p className="text-blue-400">جيد جدًا! أنت على الطريق الصحيح.</p>
            ) : result.percentage >= 60 ? (
              <p className="text-yellow-500">جيد! يمكنك المحاولة مرة أخرى للحصول على نتيجة أفضل.</p>
            ) : (
              <p className="text-red-500">لا تقلق، استمر في التعلم وحاول مرة أخرى.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResultPage 