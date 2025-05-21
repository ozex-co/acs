import React from 'react'
import { Link } from 'react-router-dom'
import { FaHome, FaExclamationTriangle } from 'react-icons/fa'

const NotFoundPage: React.FC = () => {
  return (
    <div className="not-found-container">
      <div className="max-w-md w-full text-center">
        <div className="text-9xl font-extrabold text-sky-500 mb-4 opacity-30">
          404
        </div>
        
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="flex flex-col items-center">
            <FaExclamationTriangle className="text-6xl text-sky-500 mb-6" />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-4">
              الصفحة غير موجودة
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-sm">
              عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها أو حذفها.
            </p>
            
            <Link to="/" className="inline-flex items-center px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-full transition-colors shadow-lg">
              <FaHome className="ml-2" />
              العودة للصفحة الرئيسية
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotFoundPage 