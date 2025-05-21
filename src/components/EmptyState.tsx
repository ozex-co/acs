import React from 'react';
import Button from './Button';

interface EmptyStateProps {
  title: string;
  message: string;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  icon = 'inbox',
  actionLabel,
  onAction
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="bg-bg-card dark:bg-bg-dark p-8 rounded-lg shadow-md w-full max-w-md border border-slate-200 dark:border-gray-700">
        <span className="material-icons text-5xl text-slate-400 dark:text-gray-400 mb-4">{icon}</span>
        <h3 className="text-xl font-bold text-text-heading dark:text-white mb-2">{title}</h3>
        <p className="text-text-muted dark:text-gray-400 mb-6">{message}</p>
        
        {actionLabel && onAction && (
          <Button variant="primary" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
};

export default EmptyState; 