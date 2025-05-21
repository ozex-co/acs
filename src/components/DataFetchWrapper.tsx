import React, { ReactNode } from 'react';
import SkeletonLoader from './SkeletonLoader';
import { useLoading } from '../context/LoadingContext';
import LoadingOverlay from './LoadingOverlay';

interface DataFetchWrapperProps {
  isLoading: boolean;
  error?: string | null;
  isEmpty?: boolean;
  emptyMessage?: string;
  loadingId?: string;
  children: ReactNode;
  skeletonType?: 'list' | 'card' | 'table' | 'profile' | 'exam' | 'detail';
  skeletonRows?: number;
  retry?: () => void;
  height?: string;
  minHeight?: string;
  className?: string;
}

const DataFetchWrapper: React.FC<DataFetchWrapperProps> = ({
  isLoading,
  error,
  isEmpty = false,
  emptyMessage = 'لا توجد بيانات متاحة',
  loadingId,
  children,
  skeletonType = 'card',
  skeletonRows = 3,
  retry,
  height = 'h-full',
  minHeight = 'min-h-[200px]',
  className = ''
}) => {
  const localLoadingId = loadingId || 'data-fetch';
  
  // Handle loading state
  if (isLoading) {
    if (loadingId) {
      // If loadingId is provided, use LoadingOverlay for a cleaner UX
      return (
        <LoadingOverlay id={localLoadingId} height={height} minHeight={minHeight}>
          <div className={`${className} ${minHeight} flex items-center justify-center`}>
            <SkeletonLoader type={skeletonType} rows={skeletonRows} />
          </div>
        </LoadingOverlay>
      );
    }
    
    // Simple skeleton loading
    return (
      <div className={`${className} ${minHeight} py-4`}>
        <SkeletonLoader type={skeletonType} rows={skeletonRows} />
      </div>
    );
  }
  
  // Handle error state
  if (error) {
    return (
      <div className={`${className} ${minHeight} flex flex-col items-center justify-center p-6 rounded-lg bg-bg-light border border-red-500/20`}>
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-white mb-2">حدث خطأ</h3>
          <p className="text-gray-400 mb-4">{error}</p>
          
          {retry && (
            <button 
              onClick={retry}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              إعادة المحاولة
            </button>
          )}
        </div>
      </div>
    );
  }
  
  // Handle empty state
  if (isEmpty) {
    return (
      <div className={`${className} ${minHeight} flex flex-col items-center justify-center p-6 rounded-lg bg-bg-light`}>
        <div className="text-center">
          <div className="text-gray-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-white mb-2">المحتوى فارغ</h3>
          <p className="text-gray-400">{emptyMessage}</p>
        </div>
      </div>
    );
  }
  
  // If there's no loading, error or empty state, render the children
  return <>{children}</>;
};

export default DataFetchWrapper; 