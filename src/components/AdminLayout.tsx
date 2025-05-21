import React, { useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FiHome, FiPlus, FiList, FiUsers, FiBarChart2, FiLogOut, FiMenu, FiX, FiLayers } from 'react-icons/fi'

interface AdminLayoutProps {
  children: React.ReactNode
  title?: string
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAdminLoggedIn, adminLogout, isLoading, admin } = useAuth()
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  
  // Add debugging for admin authentication in the layout
  useEffect(() => {
    console.log('AdminLayout authentication state:', {
      isAdminLoggedIn,
      isLoading,
      adminData: admin ? {
        id: admin.id,
        username: admin.username,
        roles: admin.roles || [],
        isAdmin: admin.isAdmin
      } : null,
      location: location.pathname
    });
  }, [isAdminLoggedIn, isLoading, admin, location.pathname]);
  
  // Check if admin is logged in and redirect if not
  useEffect(() => {
    if (!isLoading && !isAdminLoggedIn && !location.pathname.includes('/admin/login')) {
      console.log('Admin not logged in, redirecting to admin login page');
      navigate('/admin/login', { replace: true });
    }
  }, [isAdminLoggedIn, navigate, isLoading, location.pathname])
  
  // Return loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-light dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }
  
  // If not authenticated and not on login page, don't render anything
  if (!isAdminLoggedIn && !location.pathname.includes('/admin/login')) {
    console.log('Admin not authenticated, not rendering AdminLayout');
    return null;
  }
  
  // Skip admin layout on login page
  if (location.pathname === '/admin/login') {
    return <>{children}</>;
  }
  
  // Helper to check if a link is active - exact match or path includes for nested routes
  const isActive = (path: string) => {
    if (path === '/admin/dashboard') {
      return location.pathname === path;
    }
    
    return location.pathname === path || 
           (path !== '/admin/dashboard' && location.pathname.startsWith(path));
  }
  
  const handleLogout = async () => {
    await adminLogout();
    navigate('/admin/login', { replace: true });
  }

  // Toggle sidebar for mobile
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }
  
  return (
    <div className="min-h-screen bg-bg-light dark:bg-gray-900 flex flex-col">
      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700">
        <h1 className="text-xl font-bold text-text-heading dark:text-white">{title || "لوحة الإدارة"}</h1>
        <button 
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-400"
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {sidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>
      
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Sidebar - desktop (always shown) and mobile (conditionally shown) */}
        <div 
          className={`
            bg-white dark:bg-gray-800 w-full lg:w-64 border-r border-slate-200 dark:border-gray-700 
            lg:min-h-screen fixed lg:relative top-0 left-0 h-full z-40 lg:z-auto lg:flex
            ${sidebarOpen ? 'block pt-16' : 'hidden lg:block'}
          `}
          aria-hidden={!sidebarOpen && window.innerWidth < 1024}
        >
          <div className="p-4 lg:p-6 h-full overflow-y-auto">
            <h2 className="text-xl font-bold text-text-heading dark:text-white mb-6 hidden lg:block">لوحة الإدارة</h2>
            
            <nav className="space-y-2">
              <Link 
                to="/admin/dashboard" 
                className={`flex items-center p-3 rounded-lg ${
                  isActive('/admin/dashboard') 
                    ? 'bg-primary-50 dark:bg-sky-900/20 text-primary-700 dark:text-sky-400' 
                    : 'text-slate-700 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-700'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <FiHome className="ml-3" /> الرئيسية
              </Link>
              
              <Link 
                to="/admin/sections" 
                className={`flex items-center p-3 rounded-lg ${
                  isActive('/admin/sections') 
                    ? 'bg-primary-50 dark:bg-sky-900/20 text-primary-700 dark:text-sky-400' 
                    : 'text-slate-700 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-700'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <FiLayers className="ml-3" /> الأقسام
              </Link>
              
              <Link 
                to="/admin/exams/create" 
                className={`flex items-center p-3 rounded-lg ${
                  isActive('/admin/exams/create') 
                    ? 'bg-primary-50 dark:bg-sky-900/20 text-primary-700 dark:text-sky-400' 
                    : 'text-slate-700 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-700'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <FiPlus className="ml-3" /> إنشاء اختبار
              </Link>
              
              <Link 
                to="/admin/exams" 
                className={`flex items-center p-3 rounded-lg ${
                  isActive('/admin/exams') 
                    ? 'bg-primary-50 dark:bg-sky-900/20 text-primary-700 dark:text-sky-400' 
                    : 'text-slate-700 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-700'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <FiList className="ml-3" /> جميع الاختبارات
              </Link>
              
              <Link 
                to="/admin/users" 
                className={`flex items-center p-3 rounded-lg ${
                  isActive('/admin/users') 
                    ? 'bg-primary-50 dark:bg-sky-900/20 text-primary-700 dark:text-sky-400' 
                    : 'text-slate-700 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-700'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <FiUsers className="ml-3" /> المستخدمون
              </Link>
              
              <Link 
                to="/admin/stats" 
                className={`flex items-center p-3 rounded-lg ${
                  isActive('/admin/stats') 
                    ? 'bg-primary-50 dark:bg-sky-900/20 text-primary-700 dark:text-sky-400' 
                    : 'text-slate-700 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-700'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <FiBarChart2 className="ml-3" /> الإحصائيات
              </Link>
            </nav>
            
            <div className="mt-8 pt-4 border-t border-slate-200 dark:border-gray-700">
              <button
                onClick={handleLogout}
                className="flex items-center w-full p-3 text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg"
              >
                <FiLogOut className="ml-3" /> تسجيل الخروج
              </button>
            </div>
          </div>
        </div>
        
        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Main content */}
        <div className="flex-1 p-4 lg:p-6 overflow-auto">
          {title && (
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-text-heading dark:text-white">{title}</h1>
            </div>
          )}
          
          {children}
        </div>
      </div>
    </div>
  )
}

export default AdminLayout 