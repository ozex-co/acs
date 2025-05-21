import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import Button from '../components/Button'
import { useAuth } from '../context/AuthContext'
import { useError } from '../context/ErrorContext'
import { useLoading } from '../context/LoadingContext'
import ErrorMessage from '../components/ErrorMessage'

const AdminLoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { adminLogin, isAdminLoggedIn } = useAuth()
  const { showError } = useError()
  const { startLoading, stopLoading } = useLoading()
  
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // If admin is already logged in, redirect to dashboard
  useEffect(() => {
    if (isAdminLoggedIn) {
      // Get the intended destination from location state, or default to dashboard
      const destination = location.state?.from?.pathname || '/admin/dashboard'
      navigate(destination, { replace: true })
    }
  }, [isAdminLoggedIn, navigate, location])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    if (!username.trim()) {
      setFormError('Username is required')
      return
    }
    
    if (!password) {
      setFormError('Password is required')
      return
    }
    
    const loadingId = 'admin-login'
    startLoading(loadingId, 'Logging in...')
    setFormError('')
    setIsSubmitting(true)
    
    try {
      const success = await adminLogin(username, password)
      
      if (success) {
        // Redirect will be handled by the useEffect when isAdminLoggedIn becomes true
        // Just log a message for debugging
        console.log('Admin login successful, waiting for redirect')
      } else {
        setFormError('Invalid admin credentials. Please check your username and password.')
      }
    } catch (error: any) {
      console.error('Admin login error:', error)
      setFormError(`Authentication failed: ${error.message || 'Unknown error'}. Please try again.`)
    } finally {
      stopLoading(loadingId)
      setIsSubmitting(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-bg-dark flex flex-col">
      {/* Header with logo */}
      <div className="py-8 text-center">
        <Link to="/" className="inline-block text-3xl font-bold">
          <span className="text-primary">A</span>
          <span className="text-secondary">CS</span>
        </Link>
      </div>
      
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md" data-aos="fade-up">
          <div className="bg-bg-light p-8 rounded-lg shadow-xl border border-gray-800">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-white mb-2">Admin Login</h1>
              <p className="text-gray-400">Enter your credentials to access the admin panel</p>
            </div>
            
            {formError && (
              <ErrorMessage
                message={formError}
                variant="error"
                dismissible={true}
                onDismiss={() => setFormError('')}
              />
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="username" className="block text-gray-300 mb-1">Username</label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full bg-bg-dark border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent"
                  placeholder="Enter your admin username"
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="password" className="block text-gray-300 mb-1">Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-bg-dark border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent"
                  placeholder="••••••"
                />
              </div>
              
              <Button
                type="submit"
                variant="accent"
                fullWidth
                className="py-3"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Logging in...' : 'Login to Admin Panel'}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <Link to="/login" className="text-secondary hover:underline text-sm">
                Back to Student Login
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <div className="py-6 text-center text-gray-600 text-sm">
        ACS Admin Panel &copy; {new Date().getFullYear()}
      </div>
    </div>
  )
}

export default AdminLoginPage 