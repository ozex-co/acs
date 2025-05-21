import { useState, useEffect, useRef } from 'react'

interface ResultIndicatorProps {
  score: number
  totalQuestions: number
  timeSpent: number // in seconds
  animated?: boolean
  showConfetti?: boolean
  variant?: 'primary' | 'secondary' | 'accent'
}

const ResultIndicator: React.FC<ResultIndicatorProps> = ({
  score,
  totalQuestions,
  timeSpent,
  animated = true,
  showConfetti = true,
  variant = 'primary'
}) => {
  // Validate and normalize input values to avoid NaN issues
  const validatedScore = isNaN(score) || score < 0 ? 0 : score
  const validatedTotal = isNaN(totalQuestions) || totalQuestions <= 0 ? 1 : totalQuestions
  const validatedTime = isNaN(timeSpent) || timeSpent < 0 ? 0 : timeSpent
  
  const [displayScore, setDisplayScore] = useState(animated ? 0 : validatedScore)
  const [displayTime, setDisplayTime] = useState('00:00')
  const [isAnimationComplete, setIsAnimationComplete] = useState(false)
  const confettiContainerRef = useRef<HTMLDivElement>(null)
  
  // Calculate percentage, ensuring it's valid and clamped
  const percentage = Math.max(0, Math.min(100, Math.round((validatedScore / validatedTotal) * 100)))
  const displayPercentage = Math.max(0, Math.min(100, Math.round((displayScore / validatedTotal) * 100)))
  
  // Format time from seconds to mm:ss
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }
  
  // Create a simple confetti effect for high scores
  const createConfetti = () => {
    if (!confettiContainerRef.current || !showConfetti || percentage < 70) return
    
    const container = confettiContainerRef.current
    const containerWidth = container.offsetWidth
    const containerHeight = container.offsetHeight
    
    // Create confetti particles
    const colors = ['#60a5fa', '#90cdf4', '#22ff88', '#ffffff', '#f59e0b']
    const confettiCount = 150
    
    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement('div')
      const size = Math.random() * 10 + 5
      
      confetti.style.position = 'absolute'
      confetti.style.width = `${size}px`
      confetti.style.height = `${size}px`
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)]
      confetti.style.borderRadius = '50%'
      confetti.style.opacity = (Math.random() * 0.7 + 0.3).toString()
      confetti.style.left = `${Math.random() * containerWidth}px`
      confetti.style.top = `${Math.random() * containerHeight}px`
      confetti.style.transform = 'scale(0)'
      confetti.style.zIndex = '-1'
      
      const animation = confetti.animate(
        [
          { transform: 'scale(0)', top: `${containerHeight / 2}px`, left: `${containerWidth / 2}px` },
          { transform: 'scale(1)', top: `${Math.random() * containerHeight}px`, left: `${Math.random() * containerWidth}px` }
        ],
        {
          duration: 1000 + Math.random() * 1000,
          easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          fill: 'forwards'
        }
      )
      
      container.appendChild(confetti)
      
      animation.onfinish = () => {
        confetti.animate(
          [
            { opacity: confetti.style.opacity },
            { opacity: '0' }
          ],
          {
            delay: 1000,
            duration: 1000,
            fill: 'forwards'
          }
        ).onfinish = () => confetti.remove()
      }
    }
  }
  
  // Animate score counting up
  useEffect(() => {
    if (!animated) {
      setDisplayScore(validatedScore)
      setDisplayTime(formatTime(validatedTime))
      setIsAnimationComplete(true)
      return
    }
    
    // Format time for display
    setDisplayTime(formatTime(validatedTime))
    
    // Animate score from 0 to actual score
    if (validatedScore > 0) {
      const duration = 1500 // ms
      const interval = 30 // ms
      const steps = duration / interval
      const increment = validatedScore / steps
      let current = 0
      
      const timer = setInterval(() => {
        current += increment
        if (current >= validatedScore) {
          setDisplayScore(validatedScore)
          clearInterval(timer)
          setIsAnimationComplete(true)
        } else {
          setDisplayScore(Math.floor(current))
        }
      }, interval)
      
      return () => clearInterval(timer)
    } else {
      setIsAnimationComplete(true)
    }
  }, [validatedScore, validatedTime, animated])
  
  // Trigger confetti effect when animation completes
  useEffect(() => {
    if (isAnimationComplete) {
      setTimeout(createConfetti, 300)
    }
  }, [isAnimationComplete])
  
  // Determine color based on score percentage
  const getScoreColor = () => {
    if (percentage >= 90) return 'text-green-500'
    if (percentage >= 80) return 'text-blue-500'
    if (percentage >= 70) return 'text-blue-400'
    if (percentage >= 60) return 'text-yellow-500'
    if (percentage >= 40) return 'text-orange-500'
    return 'text-red-500'
  }
  
  // Get matching fill color
  const getScoreFillColor = () => {
    if (percentage >= 90) return 'stroke-green-500'
    if (percentage >= 80) return 'stroke-blue-500'
    if (percentage >= 70) return 'stroke-blue-400'
    if (percentage >= 60) return 'stroke-yellow-500'
    if (percentage >= 40) return 'stroke-orange-500'
    return 'stroke-red-500'
  }
  
  // Calculate the circle's stroke-dashoffset
  const radius = 85
  const circumference = radius * 2 * Math.PI
  const strokeDashoffset = circumference - (displayPercentage / 100) * circumference
  
  // Get result message based on score
  const getResultMessage = () => {
    if (percentage >= 90) return 'ممتاز! أداء رائع!'
    if (percentage >= 80) return 'جيد جداً! تحسن كبير!'
    if (percentage >= 70) return 'جيد! استمر في التحسن'
    if (percentage >= 60) return 'مقبول. تحتاج إلى مزيد من التدريب'
    return 'تحتاج إلى مراجعة وتدريب أكثر'
  }
  
  return (
    <div className="flex flex-col items-center" ref={confettiContainerRef}>
      {/* Result message with fade-in animation */}
      <div 
        className={`mb-6 text-center transition-opacity duration-1000 ${isAnimationComplete ? 'opacity-100' : 'opacity-0'}`}
      >
        <p className="text-xl md:text-2xl font-medium" data-aos="fade-up">
          {getResultMessage()}
        </p>
      </div>
      
      {/* Circular progress */}
      <div className="relative w-64 h-64">
        <svg className="w-full h-full rotate-[-90deg]" viewBox="0 0 200 200">
          {/* Background circle */}
          <circle 
            className="text-gray-800" 
            strokeWidth="10" 
            stroke="currentColor" 
            fill="transparent" 
            r={radius} 
            cx="100" 
            cy="100" 
          />
          
          {/* Progress circle */}
          <circle 
            className={getScoreFillColor()}
            strokeWidth="10" 
            strokeDasharray={circumference} 
            strokeDashoffset={strokeDashoffset} 
            strokeLinecap="round" 
            stroke="currentColor" 
            fill="transparent" 
            r={radius} 
            cx="100" 
            cy="100" 
            style={{ 
              transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        </svg>
        
        {/* Score text in center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="flex items-baseline">
            <p className={`text-5xl md:text-6xl font-bold ${getScoreColor()}`}>
              {displayScore}
            </p>
            <p className="text-2xl md:text-3xl text-gray-400 ml-1">/{validatedTotal}</p>
          </div>
          <p className={`text-xl md:text-2xl mt-2 ${getScoreColor()}`}>
            {displayPercentage}%
          </p>
        </div>
      </div>
      
      {/* Time spent */}
      <div className="mt-8 text-center bg-bg-light px-6 py-4 rounded-lg shadow-md transform transition-all duration-500 hover:scale-105">
        <p className="text-lg text-gray-400">الوقت المستغرق</p>
        <p className="text-2xl font-mono text-primary mt-1">{displayTime}</p>
      </div>
    </div>
  )
}

export default ResultIndicator 