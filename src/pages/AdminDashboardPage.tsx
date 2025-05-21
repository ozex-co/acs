import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import { FaUsers, FaFileAlt, FaChartLine, FaUserClock, FaChartBar } from 'react-icons/fa'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import { api, debugApiResponse } from '../utils/api'
import { STORAGE } from '../utils/constants'

interface StatsData {
  counts: {
    users: number
    exams: number
    submissions: number
  }
  performance: {
    averageScore: number
    completionRate: number
  }
  userActivity: {
    daily: {
      data: number[]
      labels: string[]
    }
    monthly: {
      data: number[]
      labels: string[]
    }
  }
  ageDistribution: {
    data: number[]
    labels: string[]
  }
  topExams: Array<{
    name: string
    submissions: number
    averageScore: number
  }>
}

const AdminDashboardPage: React.FC = () => {
  const { isLoading: isAuthLoading } = useAuth()
  const [stats, setStats] = useState<StatsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Use our consistent API client to make the request
      const response = await api.instance.get('/admin/stats');
      debugApiResponse('/admin/stats', response);
      
      // Extract data from response
      let statsData;
      if (response.data && response.data.data) {
        // Standard API response format
        statsData = response.data.data;
      } else if (response.data) {
        // Direct data in response
        statsData = response.data;
      } else {
        throw new Error('Invalid response structure');
      }
      
      console.log('Stats data:', statsData);
      
      // Validate the stats data structure
      if (!statsData || 
          !statsData.counts || 
          !statsData.performance || 
          !statsData.userActivity || 
          !statsData.ageDistribution || 
          !statsData.topExams) {
        console.error('Invalid stats data structure:', statsData);
        setError('بيانات غير صالحة من الخادم');
        return;
      }
      
      // Set the stats data
      setStats(statsData);
      setError(null);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError('حدث خطأ في تحميل البيانات');
    } finally {
      setIsLoading(false)
    }
  }

  // Load data on component mount
  useEffect(() => {
    fetchStats()
  }, [])

  // Handle retry button click
  const handleRetry = () => {
    fetchStats();
  }

  if (isAuthLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-xl border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-muted">جاري تحميل البيانات...</p>
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-error">{error || 'حدث خطأ في تحميل البيانات'}</div>
          <div className="flex justify-center mt-4">
            <button 
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80"
              onClick={handleRetry}
              disabled={isLoading}
            >
              {isLoading ? 'جاري المحاولة...' : 'إعادة المحاولة'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-text mb-8">لوحة التحكم</h1>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <FaUsers className="text-2xl text-primary" />
              </div>
              <div>
                <p className="text-muted text-sm">إجمالي المستخدمين</p>
                <p className="text-2xl font-bold text-text">{stats.counts.users}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                <FaFileAlt className="text-2xl text-secondary" />
              </div>
              <div>
                <p className="text-muted text-sm">الاختبارات</p>
                <p className="text-2xl font-bold text-text">{stats.counts.exams}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <FaChartLine className="text-2xl text-accent" />
              </div>
              <div>
                <p className="text-muted text-sm">التسجيلات</p>
                <p className="text-2xl font-bold text-text">{stats.counts.submissions}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-xl p-6">
            <h2 className="text-lg font-semibold text-text mb-4">معدل الإكمال</h2>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-success/10 flex items-center justify-center">
                <FaUserClock className="text-3xl text-success" />
              </div>
              <div>
                <p className="text-3xl font-bold text-success">{stats.performance.completionRate}%</p>
                <p className="text-muted text-sm">نسبة إكمال الاختبارات</p>
          </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-xl p-6">
            <h2 className="text-lg font-semibold text-text mb-4">متوسط الدرجات</h2>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                <FaChartBar className="text-3xl text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">{stats.performance.averageScore}%</p>
                <p className="text-muted text-sm">متوسط درجات المستخدمين</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Top Exams */}
        <div className="bg-white rounded-xl shadow-xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-text mb-4">أفضل الاختبارات</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                <tr className="border-b border-border">
                  <th className="text-right py-3 px-4 text-muted font-medium">الاختبار</th>
                  <th className="text-right py-3 px-4 text-muted font-medium">عدد التسجيلات</th>
                  <th className="text-right py-3 px-4 text-muted font-medium">متوسط الدرجات</th>
                  </tr>
                </thead>
                <tbody>
                {stats.topExams.map((exam, index) => (
                  <tr key={index} className="border-b border-border hover:bg-primary/5">
                    <td className="py-3 px-4 text-text">{exam.name}</td>
                    <td className="py-3 px-4 text-text">{exam.submissions}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-sm ${
                        exam.averageScore >= 70 ? 'bg-success/10 text-success' :
                        exam.averageScore >= 50 ? 'bg-warning/10 text-warning' :
                        'bg-error/10 text-error'
                      }`}>
                        {exam.averageScore}%
                      </span>
                    </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        {/* Age Distribution */}
        <div className="bg-white rounded-xl shadow-xl p-6">
          <h2 className="text-lg font-semibold text-text mb-4">توزيع الأعمار</h2>
          <div className="grid grid-cols-5 gap-4">
            {stats.ageDistribution.labels.map((label, index) => (
              <div key={index} className="text-center">
                <div className="bg-primary/5 rounded-xl p-4">
                  <p className="text-2xl font-bold text-primary">{stats.ageDistribution.data[index]}</p>
                  <p className="text-muted text-sm mt-1">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboardPage 