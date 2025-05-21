import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Button from '../components/Button'
import { FaUser, FaEnvelope, FaPhone, FaCalendarAlt, FaClock, FaCheckCircle } from 'react-icons/fa'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'

interface ExamResult {
  id: string
  examId: string
  examTitle: string
  score: number
  percentage: number
  timeSpent: number
  totalQuestions: number
  createdAt: string
}

interface UserProfile {
  id: string
  fullName: string
  email: string
  phone: string
  dateOfBirth: string
  age: number
  emailVerified: boolean
  createdAt: string
  lastLoginAt: string
  isAdmin: boolean
  completedExams: number[]
}

const ProfilePage: React.FC = () => {
  const { user, isLoading: isAuthLoading } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [examResults, setExamResults] = useState<ExamResult[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const response = await fetch('/api/user/profile')
        const data = await response.json()
        if (data.success) {
          setProfile(data.data.user)
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
      }
    }

    const fetchExamResults = async () => {
      try {
        const response = await fetch('/api/results')
        const data = await response.json()
        if (data.success) {
          setExamResults(data.data.results)
        }
      } catch (error) {
        console.error('Error fetching exam results:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfileData()
    fetchExamResults()
  }, [])

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

  if (!profile) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-error">حدث خطأ في تحميل البيانات</div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <div className="bg-white rounded-xl shadow-xl p-6 mb-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <FaUser className="text-4xl text-primary" />
                </div>
              <div>
                <h1 className="text-2xl font-bold text-text">{profile.fullName}</h1>
                <p className="text-muted">العضو منذ {format(new Date(profile.createdAt), 'dd MMMM yyyy', { locale: ar })}</p>
              </div>
                  </div>
                  
            {/* Profile Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <FaEnvelope className="text-primary" />
                  <div>
                    <p className="text-muted text-sm">البريد الإلكتروني</p>
                    <p className="text-text">{profile.email}</p>
                    {profile.emailVerified && (
                      <span className="inline-flex items-center gap-1 text-success text-sm mt-1">
                        <FaCheckCircle /> تم التحقق
                      </span>
                    )}
                  </div>
                  </div>
                  
                <div className="flex items-center gap-3">
                  <FaPhone className="text-primary" />
                  <div>
                    <p className="text-muted text-sm">رقم الهاتف</p>
                    <p className="text-text">{profile.phone}</p>
                  </div>
                  </div>
                  
                <div className="flex items-center gap-3">
                  <FaCalendarAlt className="text-primary" />
                  <div>
                    <p className="text-muted text-sm">تاريخ الميلاد</p>
                    <p className="text-text">{format(new Date(profile.dateOfBirth), 'dd MMMM yyyy', { locale: ar })}</p>
                    <p className="text-muted text-sm mt-1">العمر: {profile.age} سنة</p>
                  </div>
                  </div>
                  
                <div className="flex items-center gap-3">
                  <FaClock className="text-primary" />
                  <div>
                    <p className="text-muted text-sm">آخر تسجيل دخول</p>
                    <p className="text-text">{format(new Date(profile.lastLoginAt), 'dd MMMM yyyy HH:mm', { locale: ar })}</p>
                  </div>
                      </div>
                    </div>
                    
              {/* Statistics */}
              <div className="bg-primary/5 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-text mb-4">إحصائيات</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <p className="text-muted text-sm">الاختبارات المكتملة</p>
                    <p className="text-2xl font-bold text-primary">{profile.completedExams.length}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <p className="text-muted text-sm">متوسط الدرجات</p>
                    <p className="text-2xl font-bold text-primary">
                      {examResults.length > 0
                        ? Math.round(examResults.reduce((acc, curr) => acc + curr.percentage, 0) / examResults.length)
                        : 0}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Exam Results */}
          <div className="bg-white rounded-xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-text mb-6">نتائج الاختبارات</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-right py-3 px-4 text-muted font-medium">الاختبار</th>
                    <th className="text-right py-3 px-4 text-muted font-medium">الدرجة</th>
                    <th className="text-right py-3 px-4 text-muted font-medium">النسبة المئوية</th>
                    <th className="text-right py-3 px-4 text-muted font-medium">الوقت المستغرق</th>
                    <th className="text-right py-3 px-4 text-muted font-medium">التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {examResults.map((result) => (
                    <tr key={result.id} className="border-b border-border hover:bg-primary/5">
                      <td className="py-3 px-4 text-text">{result.examTitle}</td>
                      <td className="py-3 px-4 text-text">{result.score}/{result.totalQuestions}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-sm ${
                          result.percentage >= 70 ? 'bg-success/10 text-success' :
                          result.percentage >= 50 ? 'bg-warning/10 text-warning' :
                          'bg-error/10 text-error'
                        }`}>
                          {result.percentage}%
                          </span>
                      </td>
                      <td className="py-3 px-4 text-text">{result.timeSpent} دقيقة</td>
                      <td className="py-3 px-4 text-text">
                        {format(new Date(result.createdAt), 'dd MMM yyyy', { locale: ar })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage 