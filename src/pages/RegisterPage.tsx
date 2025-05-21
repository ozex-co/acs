import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Button from '../components/Button'
import Navbar from '../components/Navbar'
import CountryCodeSelector from '../components/CountryCodeSelector'
import ErrorMessage from '../components/ErrorMessage'

// Type for form data
interface RegisterFormData {
  fullName: string
  phoneCountryCode: string
  phoneNumber: string
  email: string
  dateOfBirth: string
  password: string
  confirmPassword: string
}

// Type for form errors
interface FormErrors {
  fullName?: string
  phoneNumber?: string
  email?: string
  dateOfBirth?: string
  password?: string
  confirmPassword?: string
  general?: string // For general form errors
}

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState<RegisterFormData>({
    fullName: '',
    phoneCountryCode: '+213', // Default
    phoneNumber: '',
    email: '',
    dateOfBirth: '',
    password: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false); // Local loading state for submission
  
  const navigate = useNavigate()
  const { userRegister, isUserLoggedIn, isLoading: isAuthLoading } = useAuth()

  // Redirect if already logged in, but only after auth check is complete
  useEffect(() => {
    // Don't redirect while auth state is still being determined
    if (isAuthLoading) {
      return;
    }
    
    // Only redirect if actually logged in
    if (isUserLoggedIn) {
      navigate('/', { replace: true });
    }
  }, [isUserLoggedIn, navigate, isAuthLoading])
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const handleCountryCodeChange = (dialCode: string) => {
    setFormData(prev => ({ ...prev, phoneCountryCode: dialCode }))
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    if (!formData.fullName.trim()) newErrors.fullName = 'الاسم الكامل مطلوب';
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'رقم الهاتف مطلوب';
    else if (!/^\d{9,10}$/.test(formData.phoneNumber.trim())) newErrors.phoneNumber = 'يرجى إدخال رقم هاتف صحيح (9-10 أرقام)';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'يرجى إدخال عنوان بريد إلكتروني صحيح';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'تاريخ الميلاد مطلوب';
    if (!formData.password) newErrors.password = 'كلمة المرور مطلوبة';
    else if (formData.password.length < 6) newErrors.password = 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'كلمات المرور غير متطابقة';

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Clear only general error on new submit attempt, keep field errors until validation
    setErrors(prev => ({ ...prev, general: undefined })); 
    
    if (!validateForm()) { 
      // Set a general error if validation fails overall
      setErrors(prev => ({ ...prev, general: 'يرجى تصحيح الأخطاء في النموذج' }));
      return; 
    }
    
    setIsSubmitting(true);
    // No need to clear errors here, validateForm does it
    
    try {
      const fullPhone = `${formData.phoneCountryCode}${formData.phoneNumber}`
      const userData = {
        fullName: formData.fullName,
        phone: fullPhone,
        email: formData.email,
        dateOfBirth: formData.dateOfBirth,
        password: formData.password
      }
      
      const success = await userRegister(userData)
      
      if (success) {
        // Registration successful, navigate to dashboard or home
        navigate('/')
      } else {
        // API returned success: false, likely specific error like duplicate phone
        setErrors({ general: 'فشل التسجيل. قد يكون رقم الهاتف مسجل مسبقًا أو كلمة المرور ضعيفة.' });
      }
    } catch (error) {
      console.error("Registration Submit Error:", error);
      setErrors({ general: 'حدث خطأ غير متوقع. الرجاء المحاولة مرة أخرى.' });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  // Show loading state while global auth check is in progress
  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-xl border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-muted">جاري التحقق من حالة الدخول...</p>
        </div>
      </div>
    );
  }
  
  // Get max date for date input (e.g., today)
  const maxDate = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-lg mx-auto" data-aos="fade-up">
          <h1 className="text-3xl font-bold text-text mb-2 text-center">
            إنشاء حساب جديد في <span className="text-primary">ACS</span>
          </h1>
          <p className="text-muted text-center mb-8">املأ البيانات لإنشاء حسابك</p>
          
          <div className="bg-white p-6 rounded-xl shadow-xl">
            {/* Display general form errors using ErrorMessage component */}
            {errors.general && (
              <ErrorMessage 
                message={errors.general} 
                variant="error" 
                dismissible={true} 
                onDismiss={() => setErrors(prev => ({ ...prev, general: undefined }))}
              />
            )}
            <form onSubmit={handleSubmit}>
              {/* Full Name */}
              <div className="mb-4">
                <label htmlFor="fullName" className="block text-text mb-1">الاسم الكامل</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full bg-white border border-border rounded-xl px-4 py-2 text-text focus:outline-none focus:border-primary"
                  placeholder="أحمد محمد"
                />
                {errors.fullName && <p className="mt-1 text-error text-sm">{errors.fullName}</p>}
              </div>
              
              {/* Phone Number */}
              <div className="mb-4">
                <label htmlFor="phoneNumber" className="block text-text mb-1">رقم الهاتف</label>
                <div className="flex">
                   <div className="w-1/3 ml-2">
                     <CountryCodeSelector 
                       value={formData.phoneCountryCode}
                       onChange={handleCountryCodeChange} 
                     />
                   </div>
                   <input
                     type="tel"
                     id="phoneNumber"
                     name="phoneNumber"
                     value={formData.phoneNumber}
                     onChange={handleChange}
                     className="w-2/3 bg-white border border-border rounded-xl px-4 py-2 text-text focus:outline-none focus:border-primary"
                     placeholder="5XXXXXXXX"
                   />
                </div>
                 {errors.phoneNumber && <p className="mt-1 text-error text-sm">{errors.phoneNumber}</p>}
              </div>
              
              {/* Email */}
              <div className="mb-4">
                <label htmlFor="email" className="block text-text mb-1">البريد الإلكتروني</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-white border border-border rounded-xl px-4 py-2 text-text focus:outline-none focus:border-primary"
                  placeholder="example@email.com"
                />
                {errors.email && <p className="mt-1 text-error text-sm">{errors.email}</p>}
              </div>
              
              {/* Date of Birth */}
              <div className="mb-4">
                <label htmlFor="dateOfBirth" className="block text-text mb-1">تاريخ الميلاد</label>
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  max={maxDate}
                  className="w-full bg-white border border-border rounded-xl px-4 py-2 text-text focus:outline-none focus:border-primary"
                />
                {errors.dateOfBirth && <p className="mt-1 text-error text-sm">{errors.dateOfBirth}</p>}
              </div>
              
              {/* Password */}
              <div className="mb-4">
                <label htmlFor="password" className="block text-text mb-1">كلمة المرور</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-white border border-border rounded-xl px-4 py-2 text-text focus:outline-none focus:border-primary"
                  placeholder="********"
                />
                {errors.password && <p className="mt-1 text-error text-sm">{errors.password}</p>}
              </div>
              
              {/* Confirm Password */}
              <div className="mb-4">
                <label htmlFor="confirmPassword" className="block text-text mb-1">تأكيد كلمة المرور</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full bg-white border border-border rounded-xl px-4 py-2 text-text focus:outline-none focus:border-primary"
                  placeholder="********"
                />
                {errors.confirmPassword && <p className="mt-1 text-error text-sm">{errors.confirmPassword}</p>}
              </div>
              
              {/* Submit Button */}
              <Button 
                type="submit" 
                variant="primary" 
                fullWidth 
                isLoading={isSubmitting}
              >
                إنشاء حساب
              </Button>
              
              {/* Login Link */}
              <div className="mt-4 text-center text-muted">
                لديك حساب بالفعل؟{' '}
                <Link to="/login" className="text-primary hover:text-primary/90">
                  تسجيل الدخول
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage 