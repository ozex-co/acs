import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import ThemeToggle from './ThemeToggle'
import Button from './Button'
import { FaUser, FaSignOutAlt, FaTachometerAlt, FaHome } from 'react-icons/fa'

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { themeType } = useTheme()
  const { isUserLoggedIn, isAdminLoggedIn, userLogout, adminLogout, user, admin } = useAuth()
  
  const isAuthenticated = isUserLoggedIn || isAdminLoggedIn
  const isAdmin = isAdminLoggedIn

  // Add a debug log to help identify any issues with admin status
  useEffect(() => {
    console.log('Navbar authentication state:', { 
      isUserLoggedIn, 
      isAdminLoggedIn, 
      hasUser: !!user, 
      hasAdmin: !!admin,
      adminData: admin ? { id: admin.id, username: admin.username, isAdmin: admin.isAdmin, roles: admin.roles } : null
    });
  }, [isUserLoggedIn, isAdminLoggedIn, user, admin]);
  
  const handleLogout = () => {
    if (isAdmin) {
      adminLogout()
    } else {
      userLogout()
    }
    
    // Navigate to home after logout
    navigate('/')
    
    // Close mobile menu if open
    setIsMobileMenuOpen(false)
  }
  
  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }
  
  const isActive = (path: string) => {
    return location.pathname === path
  }
  
  return (
    <nav className="bg-white border-b border-border shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="text-xl md:text-2xl font-bold">
            <span className="text-primary">ACS</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6 rtl:space-x-reverse">
            <ThemeToggle />
            
            {isAuthenticated ? (
              <>
                <Link 
                  to="/" 
                  className={`${isActive('/') ? 'text-primary' : 'text-text'} hover:text-primary/90 transition-colors flex items-center gap-1`}
                >
                  <FaHome className="text-sm ml-1" /> الاختبارات
                </Link>
                
                <Link 
                  to="/profile" 
                  className={`${isActive('/profile') ? 'text-primary' : 'text-text'} hover:text-primary/90 transition-colors flex items-center gap-1`}
                >
                  <FaUser className="text-sm ml-1" /> الملف الشخصي
                </Link>
                
                {isAdmin && (
                  <Link 
                    to="/admin/dashboard" 
                    className={`${isActive('/admin/dashboard') ? 'text-secondary' : 'text-text'} hover:text-secondary/90 transition-colors flex items-center gap-1`}
                  >
                    <FaTachometerAlt className="text-sm ml-1" /> لوحة التحكم
                  </Link>
                )}
                
                <div className="flex items-center space-x-4 rtl:space-x-reverse">
                  <div className="text-muted text-sm">
                    {user?.fullName && <span>مرحباً، {user.fullName.split(' ')[0]}</span>}
                    {admin?.username && <span>مرحباً، {admin.username}</span>}
                  </div>
                  <Button 
                    variant="danger"
                    size="sm"
                    onClick={handleLogout}
                    className="flex items-center gap-1"
                  >
                    <FaSignOutAlt className="text-sm ml-1" /> تسجيل الخروج
                  </Button>
                </div>
              </>
            ) : location.pathname !== '/login' && location.pathname !== '/register' ? (
              <>
                <Link 
                  to="/login" 
                  className="text-text hover:text-primary/90 transition-colors"
                >
                  تسجيل الدخول
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    إنشاء حساب
                  </Button>
                </Link>
              </>
            ) : null}
          </div>
          
          {/* Mobile menu button */}
          <button 
            onClick={toggleMobileMenu}
            className="md:hidden text-text focus:outline-none"
            aria-label="القائمة"
          >
            <svg 
              className="w-6 h-6" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
        
        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-3 py-3 border-t border-border">
            <div className="flex flex-col space-y-3">
              <div className="flex justify-start mb-2">
                <ThemeToggle />
              </div>
              
              {isAuthenticated ? (
                <>
                  {user?.fullName && (
                    <div className="text-muted text-sm mb-4 px-2">
                      مرحباً، {user.fullName.split(' ')[0]}
                    </div>
                  )}
                  {admin?.username && (
                    <div className="text-muted text-sm mb-4 px-2">
                      مرحباً، {admin.username}
                    </div>
                  )}
                  
                  <Link 
                    to="/" 
                    className={`${isActive('/') ? 'text-primary' : 'text-text'} hover:text-primary/90 transition-colors flex items-center gap-2 px-2 py-1`}
                  >
                    <FaHome className="ml-1" /> الاختبارات
                  </Link>
                  
                  <Link 
                    to="/profile" 
                    className={`${isActive('/profile') ? 'text-primary' : 'text-text'} hover:text-primary/90 transition-colors flex items-center gap-2 px-2 py-1`}
                  >
                    <FaUser className="ml-1" /> الملف الشخصي
                  </Link>
                  
                  {isAdmin && (
                    <Link 
                      to="/admin/dashboard" 
                      className={`${isActive('/admin/dashboard') ? 'text-secondary' : 'text-text'} hover:text-secondary/90 transition-colors flex items-center gap-2 px-2 py-1`}
                    >
                      <FaTachometerAlt className="ml-1" /> لوحة التحكم
                    </Link>
                  )}
                  
                  <Button 
                    variant="danger"
                    size="sm"
                    onClick={handleLogout}
                    fullWidth
                    className="mt-4 flex items-center justify-center gap-2"
                  >
                    <FaSignOutAlt className="ml-1" /> تسجيل الخروج
                  </Button>
                </>
              ) : location.pathname !== '/login' && location.pathname !== '/register' ? (
                <>
                  <Link 
                    to="/login" 
                    className={`${isActive('/login') ? 'text-primary' : 'text-text'} hover:text-primary/90 transition-colors px-2 py-1`}
                  >
                    تسجيل الدخول
                  </Link>
                  <Link to="/register" className="mt-2">
                    <Button variant="primary" size="sm" fullWidth>
                      إنشاء حساب
                    </Button>
                  </Link>
                </>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar 