import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLoading } from '../context/LoadingContext'
import Button from '../components/Button'
import Navbar from '../components/Navbar'
import CountryCodeSelector from '../components/CountryCodeSelector'

interface LocationState {
  message?: string
  from?: { pathname: string }
}

// Define loading ID at component level
const LOGIN_LOADING_ID = 'login-user';

// Phone number validation by country
const phoneValidationRules: {
  [key: string]: {
    minLength: number;
    maxLength: number;
    validationRegex: RegExp;
    example: string;
  }
} = {
  '+213': { // Algeria
    minLength: 9,
    maxLength: 9,
    validationRegex: /^[0-9]{9}$/,
    example: '912345678'
  },
  '+20': { // Egypt
    minLength: 10,
    maxLength: 10,
    validationRegex: /^[0-9]{10}$/,
    example: '1012345678'
  },
  // Add more countries as needed
  'default': {
    minLength: 9,
    maxLength: 10,
    validationRegex: /^[0-9]{9,10}$/,
    example: '912345678'
  }
};

const LoginPage: React.FC = () => {
  const [phoneCountryCode, setPhoneCountryCode] = useState('+213')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [validationError, setValidationError] = useState('')
  
  const navigate = useNavigate()
  const location = useLocation()
  const { userLogin, isUserLoggedIn, isLoading: isAuthLoading } = useAuth()
  const { startLoading, stopLoading, isLoading } = useLoading()

  // Redirect if already logged in, but only after auth check is complete
  useEffect(() => {
    // Don't redirect while auth state is still being determined
    if (isAuthLoading) {
      return;
    }
    
    // Only redirect if actually logged in
    if (isUserLoggedIn) {
      // Redirect to the page they were trying to access, or home
      const state = location.state as LocationState | null;
      const from = state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isUserLoggedIn, navigate, location, isAuthLoading])

  const handleCountryCodeChange = (dialCode: string) => {
    setPhoneCountryCode(dialCode);
    // Clear validation error when country code changes
    setValidationError('');
  };

  // Get validation rules for current country code
  const getValidationRules = () => {
    return phoneValidationRules[phoneCountryCode] || phoneValidationRules.default;
  };

  const validatePhoneNumber = (phoneNumber: string): boolean => {
    const rules = getValidationRules();
    
    if (!phoneNumber) {
      setValidationError('رقم الهاتف مطلوب');
      return false;
    }
    
    if (phoneNumber.length < rules.minLength || phoneNumber.length > rules.maxLength) {
      setValidationError(`رقم الهاتف يجب أن يكون ${rules.minLength} أرقام. مثال: ${rules.example}`);
      return false;
    }
    
    if (!rules.validationRegex.test(phoneNumber)) {
      setValidationError('رقم الهاتف يجب أن يحتوي على أرقام فقط');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate phone number
    if (!validatePhoneNumber(phoneNumber)) {
      return;
    }
    
    // Basic validation for password
    if (!password) {
      setValidationError('كلمة المرور مطلوبة')
      return
    }
    
    // Clear validation error
    setValidationError('')
    
    startLoading(LOGIN_LOADING_ID, 'جاري تسجيل الدخول...')
    
    try {
      // Combine country code and phone number without any formatting
      const fullPhone = `${phoneCountryCode}${phoneNumber}`
      
      // Log the combination for debugging (don't log password)
      console.log('Attempting login with phone:', fullPhone)
      
      // Attempt login
      const success = await userLogin(fullPhone, password)
      
      if (success) {
        // Get the intended destination
        const state = location.state as LocationState | null;
        const from = state?.from?.pathname || '/';
        
        // Navigate to the intended destination or home page if login was successful
        navigate(from, { replace: true });
      } else {
        // Show error message if login failed
        setValidationError('رقم الهاتف أو كلمة المرور غير صحيحة، يرجى المحاولة مرة أخرى')
      }
    } catch (error) {
      console.error('Login error:', error)
      setValidationError('حدث خطأ أثناء تسجيل الدخول، يرجى المحاولة مرة أخرى')
    } finally {
      stopLoading(LOGIN_LOADING_ID)
    }
  }

  // Show loading state while global auth check is in progress
  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-dark">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-gray-400">جاري التحقق من حالة الدخول...</p>
        </div>
      </div>
    );
  }

  // Get validation rules for the current country code
  const rules = getValidationRules();
  
  // Determine if the login process is specifically loading
  const isLoginLoading = isLoading(LOGIN_LOADING_ID);

  return (
    <div className="min-h-screen bg-bg-dark">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto" data-aos="fade-up">
          <h1 className="text-3xl font-bold text-text mb-2 text-center">
            مرحبًا بك في <span className="text-primary">ACS</span>
          </h1>
          <p className="text-gray-400 text-center mb-8">تسجيل الدخول إلى حسابك</p>
          
          <div className="bg-bg-light p-6 rounded-lg shadow-xl">
            {validationError && (
              <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-500 p-3 rounded-lg mb-4">
                {validationError}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="phoneNumber" className="block text-gray-300 mb-1">رقم الهاتف</label>
                <div className="flex">
                  <div className="w-1/3 ml-2">
                    <CountryCodeSelector 
                      value={phoneCountryCode}
                      onChange={handleCountryCodeChange}
                    />
                  </div>
                  <div className="w-2/3 relative">
                    <input
                      type="tel"
                      id="phoneNumber"
                      value={phoneNumber}
                      onChange={e => {
                        // Only allow digits
                        const value = e.target.value.replace(/\D/g, '');
                        setPhoneNumber(value);
                        // Clear validation error when user types
                        if (validationError) setValidationError('');
                      }}
                      className="w-full bg-bg-dark border border-gray-700 rounded-lg px-4 py-2 text-text focus:outline-none focus:border-primary"
                      placeholder={rules.example}
                      maxLength={rules.maxLength}
                    />
                    <div className="text-xs text-gray-500 mt-1 pl-1">
                      {rules.minLength === rules.maxLength 
                        ? `يجب أن يكون ${rules.minLength} أرقام` 
                        : `${rules.minLength}-${rules.maxLength} أرقام`}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="password" className="text-gray-300">كلمة المرور</label>
                  <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                    نسيت كلمة المرور؟
                  </Link>
                </div>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    // Clear validation error when user types
                    if (validationError) setValidationError('');
                  }}
                  className="w-full bg-bg-dark border border-gray-700 rounded-lg px-4 py-2 text-text focus:outline-none focus:border-primary"
                  placeholder="أدخل كلمة المرور"
                />
              </div>
              
              <Button
                type="submit"
                variant="primary"
                fullWidth
                className="py-3 text-text"
                disabled={isLoginLoading}
              >
                {isLoginLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
              </Button>
            </form>
            
            <div className="mt-4 text-center text-gray-400">
              ليس لديك حساب؟{' '}
              <Link to="/register" className="text-primary hover:underline">
                إنشاء حساب
              </Link>
            </div>
            
            <div className="mt-4 text-center">
              <Link 
                to="/admin/login" 
                className="text-sm text-gray-500 hover:text-gray-400"
              >
                تسجيل دخول المشرف
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage 
