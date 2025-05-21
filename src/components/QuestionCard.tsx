import React, { useState, useEffect, useRef } from 'react'
import Typewriter from 'typewriter-effect'

interface Option {
  id: string
  text: string
}

// Add interfaces for new question types
interface MatchingPair {
  id: string
  left: string
  right: string
}

interface OrderingItem {
  id: string
  text: string
  position?: number // Optional position for user's answer
}

interface Question {
  id: string
  text: string
  type?: 'multiple-choice' | 'true-false' | 'short-answer' | 'matching' | 'ordering'
  options: Option[]
  matchingPairs?: MatchingPair[]
  orderingItems?: OrderingItem[]
}

interface QuestionCardProps {
  question: Question
  selectedOption?: string
  onSelectOption: (optionId: string) => void
  showTypewriter?: boolean
  questionNumber?: number
  totalQuestions?: number
  isLoading?: boolean
  // Add props for the new question types
  matchingSelections?: Record<string, string> // leftId -> rightId mapping
  onMatchingSelect?: (leftId: string, rightId: string) => void
  orderingSelections?: OrderingItem[] // User's ordered items
  onOrderingChange?: (items: OrderingItem[]) => void
  shortAnswerText?: string
  onShortAnswerChange?: (text: string) => void
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  selectedOption,
  onSelectOption,
  showTypewriter = true,
  questionNumber,
  totalQuestions,
  isLoading = false,
  // New props with defaults
  matchingSelections = {},
  onMatchingSelect = () => {},
  orderingSelections = [],
  onOrderingChange = () => {},
  shortAnswerText = '',
  onShortAnswerChange = () => {}
}) => {
  const [isTypingComplete, setIsTypingComplete] = useState(!showTypewriter)
  const [renderedOptions, setRenderedOptions] = useState<Option[]>([])
  const [renderedMatchingPairs, setRenderedMatchingPairs] = useState<MatchingPair[]>([])
  const [renderedOrderingItems, setRenderedOrderingItems] = useState<OrderingItem[]>([])
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const prevQuestionRef = useRef<string>('')
  
  // Reset state when question changes
  useEffect(() => {
    if (prevQuestionRef.current !== question.id) {
      setIsTypingComplete(!showTypewriter)
      setRenderedOptions([])
      setRenderedMatchingPairs([])
      setRenderedOrderingItems([])
      prevQuestionRef.current = question.id
    }
  }, [question.id, showTypewriter])
  
  // Animate options appearing after question is typed
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    
    if (isTypingComplete) {
      timer = setTimeout(() => {
        // Handle different question types
        if (question.type === 'matching' && question.matchingPairs) {
          // Render matching pairs
          setRenderedMatchingPairs(question.matchingPairs);
        } else if (question.type === 'ordering' && question.orderingItems) {
          // Render ordering items
          setRenderedOrderingItems(question.orderingItems);
        } else {
          // Handle standard multiple choice questions
          const validOptions = Array.isArray(question.options) ? 
            question.options.map((opt, idx) => {
              // Ensure each option has proper ID format
              if (typeof opt === 'string') {
                return {
                  id: `option_${question.id}_${idx}`,
                  text: opt
                };
              } else if (typeof opt === 'object' && opt !== null) {
                return {
                  id: opt.id || `option_${question.id}_${idx}`,
                  text: opt.text || `Option ${idx+1}`
                };
              } else {
                return {
                  id: `option_${question.id}_${idx}`,
                  text: `Option ${idx+1}`
                };
              }
            }) : [];
          setRenderedOptions(validOptions);
        }
      }, 300)
    } else {
      setRenderedOptions([])
      setRenderedMatchingPairs([])
      setRenderedOrderingItems([])
    }
    
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [isTypingComplete, question.options, question.type, question.matchingPairs, question.orderingItems])
  
  // Handle drag and drop for ordering questions
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    setDraggedItem(id)
    e.dataTransfer.setData('text/plain', id)
    e.currentTarget.style.opacity = '0.5'
  }
  
  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.style.opacity = '1'
    setDraggedItem(null)
  }
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault()
    
    if (!draggedItem) return
    
    // Reorder items
    const items = [...orderingSelections]
    const sourceIndex = items.findIndex(item => item.id === draggedItem)
    const targetIndex = items.findIndex(item => item.id === targetId)
    
    if (sourceIndex === -1 || targetIndex === -1) return
    
    // Remove the item from the source position
    const [removed] = items.splice(sourceIndex, 1)
    // Insert it at the target position
    items.splice(targetIndex, 0, removed)
    
    // Update positions
    const updatedItems = items.map((item, index) => ({
      ...item,
      position: index + 1
    }))
    
    onOrderingChange(updatedItems)
  }
  
  if (isLoading) {
    return (
      <div className="p-6 min-h-[200px] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-4 bg-slate-300 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-slate-300 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="p-6">
      {/* Question number indicator */}
      {questionNumber && totalQuestions && (
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-primary-600 dark:text-primary font-medium">
            السؤال {questionNumber} من {totalQuestions}
          </div>
        </div>
      )}
      
      <div className="mb-8 fade-in">
        <h3 className="text-xl md:text-2xl font-medium text-text-heading dark:text-white mb-2">
          {showTypewriter ? (
            <Typewriter
              onInit={(typewriter) => {
                typewriter
                  .changeDelay(30)
                  .typeString(question.text)
                  .callFunction(() => setIsTypingComplete(true))
                  .start()
              }}
              options={{
                delay: 30,
                cursor: '<span class="cursor"></span>',
                loop: false,
              }}
            />
          ) : (
            question.text
          )}
        </h3>
      </div>
      
      {/* Multiple choice and true/false questions */}
      {(question.type === 'multiple-choice' || question.type === 'true-false' || !question.type) && 
        renderedOptions.map((option, index) => (
          <button
            key={`${question.id}-option-${index}-${option.id || Math.random().toString(36).substring(2, 9)}`}
            onClick={() => onSelectOption(option.id)}
            className={`w-full text-right p-4 rounded-lg transition-all duration-300 border-2 flex items-center mb-3
              ${selectedOption === option.id
                ? 'bg-primary-100 dark:bg-primary bg-opacity-20 border-primary-500 dark:border-primary'
                : 'border-slate-300 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary'
              }`}
            style={{ animationDelay: `${100 + index * 50}ms` }}
            data-aos="fade-up"
            aria-checked={selectedOption === option.id}
            role="radio"
          >
            <div className={`w-6 h-6 rounded-full ml-3 flex items-center justify-center border-2 transition-all
              ${selectedOption === option.id
                ? 'border-primary-500 bg-primary-500 dark:border-primary dark:bg-primary text-white scale-in-center'
                : 'border-slate-400 dark:border-gray-500'
              }`}
            >
              {selectedOption === option.id && (
                <svg className="w-3 h-3 fade-in" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <span className="flex-1">{option.text}</span>
          </button>
        ))
      }
      
      {/* Short answer question */}
      {question.type === 'short-answer' && isTypingComplete && (
        <div className="mt-4">
          <textarea
            value={shortAnswerText}
            onChange={(e) => onShortAnswerChange(e.target.value)}
            className="w-full bg-white dark:bg-bg-dark border border-slate-300 dark:border-gray-700 rounded-lg p-4 text-text-body dark:text-white transition-all focus:border-primary-500 dark:focus:border-primary"
            placeholder="اكتب إجابتك هنا..."
            rows={4}
          />
        </div>
      )}
      
      {/* Matching question */}
      {question.type === 'matching' && renderedMatchingPairs.length > 0 && (
        <div className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Left column (items to match) */}
            <div className="space-y-2">
              <div className="font-medium text-text-heading dark:text-gray-300 mb-2">العمود A</div>
              {renderedMatchingPairs.map((pair, index) => (
                <div 
                  key={`left-${pair.id}`}
                  className="p-3 bg-bg-card dark:bg-bg-dark rounded-lg border border-slate-300 dark:border-gray-700"
                >
                  {pair.left}
                </div>
              ))}
            </div>
            
            {/* Right column (matching options) */}
            <div className="space-y-2">
              <div className="font-medium text-text-heading dark:text-gray-300 mb-2">العمود B</div>
              {renderedMatchingPairs.map((pair, index) => (
                <select
                  key={`right-${pair.id}`}
                  value={matchingSelections[pair.id] || ''}
                  onChange={(e) => onMatchingSelect(pair.id, e.target.value)}
                  className="w-full p-3 bg-white dark:bg-bg-dark rounded-lg border border-slate-300 dark:border-gray-700 text-text-body dark:text-white focus:border-primary-500 dark:focus:border-primary"
                >
                  <option value="">-- اختر الإجابة المطابقة --</option>
                  {renderedMatchingPairs.map(option => (
                    <option 
                      key={`option-${option.id}`} 
                      value={option.id}
                      disabled={Object.values(matchingSelections).includes(option.id) && matchingSelections[pair.id] !== option.id}
                    >
                      {option.right}
                    </option>
                  ))}
                </select>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Ordering question */}
      {question.type === 'ordering' && renderedOrderingItems.length > 0 && (
        <div className="mt-4">
          <div className="font-medium text-text-heading dark:text-gray-300 mb-2">رتّب العناصر التالية بالترتيب الصحيح:</div>
          <div className="space-y-2">
            {(orderingSelections.length > 0 ? orderingSelections : renderedOrderingItems).map((item, index) => (
              <div
                key={`order-${item.id}`}
                draggable
                onDragStart={(e) => handleDragStart(e, item.id)}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, item.id)}
                className="p-3 bg-bg-card dark:bg-bg-dark rounded-lg border border-slate-300 dark:border-gray-700 flex items-center cursor-move"
              >
                <div className="w-6 h-6 mr-3 flex items-center justify-center bg-primary-500 dark:bg-primary text-white rounded-full text-sm">
                  {index + 1}
                </div>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
        
      {renderedOptions.length === 0 && renderedMatchingPairs.length === 0 && 
       renderedOrderingItems.length === 0 && isTypingComplete && 
       !question.type && (
        <div className="text-center py-8 text-text-muted dark:text-gray-500">
          لا توجد خيارات لهذا السؤال
        </div>
      )}
    </div>
  )
}

export default React.memo(QuestionCard) 