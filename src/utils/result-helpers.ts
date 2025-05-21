/**
 * Helper functions for working with exam results
 */

/**
 * Normalizes result data from different API response formats
 * @param data Raw result data from API
 * @param resultId Optional resultId to use if not in data
 * @returns Normalized result object
 */
export const normalizeResultData = (data: any, resultId?: string): any => {
  if (!data) return null;
  
  console.log('Normalizing result data:', data);
  
  // Ensure numeric values are proper numbers
  const score = Number(data.score) || 0;
  const totalQuestions = Number(data.totalQuestions) || 1; // Use 1 as fallback to avoid division by zero
  const timeSpent = Number(data.timeSpent) || 0;
  const mistakes = Number(data.mistakes) || 0;
  
  // Calculate percentage if not provided or is invalid
  let percentage = Number(data.percentage);
  if (isNaN(percentage) || percentage < 0) {
    percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  }
  
  // Clamp percentage to valid range (0-100)
  percentage = Math.max(0, Math.min(100, percentage));
  
  // Format date from completedAt or createdAt
  const dateString = data.completedAt || data.createdAt || new Date().toISOString();
  const date = new Date(dateString);
  const formattedDate = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
  
  // Normalize answers array
  let normalizedAnswers = [];
  if (Array.isArray(data.answers)) {
    normalizedAnswers = data.answers.map((answer: any) => ({
      questionId: String(answer.questionId || ''),
      questionText: answer.questionText || '',
      selectedOptionText: answer.selectedOptionText || '',
      correctOptionText: answer.correctOptionText || '',
      isCorrect: Boolean(answer.isCorrect)
    }));
  }
  
  // Return normalized result object
  return {
    id: String(data.id || resultId || ''),
    score,
    totalQuestions,
    percentage,
    timeSpent,
    mistakes,
    examTitle: data.examTitle || '',
    examId: String(data.examId || ''),
    date: formattedDate,
    answers: normalizedAnswers
  };
};

/**
 * Formats time in seconds to a readable format
 * @param seconds Time in seconds
 * @returns Formatted time string
 */
export const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) {
    seconds = 0;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  if (minutes < 1) {
    return `${seconds} ثانية`;
  } else if (minutes === 1) {
    return `دقيقة${remainingSeconds > 0 ? ` و ${remainingSeconds} ثانية` : ''}`;
  } else if (minutes < 60) {
    return `${minutes} دقائق${remainingSeconds > 0 ? ` و ${remainingSeconds} ثانية` : ''}`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours} ساعة${remainingMinutes > 0 ? ` و ${remainingMinutes} دقيقة` : ''}`;
  }
};

/**
 * Gets the grade based on percentage score
 * @param percentage Percentage score (0-100)
 * @returns Grade and color class
 */
export const getGradeInfo = (percentage: number) => {
  // Ensure percentage is a valid number
  if (isNaN(percentage) || percentage < 0) {
    percentage = 0;
  }
  
  // Clamp percentage to valid range (0-100)
  percentage = Math.max(0, Math.min(100, percentage));
  
  const grade = percentage >= 90 ? 'ممتاز' : 
                percentage >= 80 ? 'جيد جدًا' : 
                percentage >= 70 ? 'جيد' : 
                percentage >= 60 ? 'مقبول' :
                'ضعيف';
                
  const colorClass = percentage >= 90 ? 'text-green-500' : 
                     percentage >= 80 ? 'text-blue-500' : 
                     percentage >= 70 ? 'text-blue-400' :
                     percentage >= 60 ? 'text-yellow-500' :
                     'text-red-500';
                     
  return { grade, colorClass };
}; 