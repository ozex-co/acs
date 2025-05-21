import React, { Component, ErrorInfo, ReactNode } from 'react';
import logger from '../utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// Hardcode development flag
const isDev = true; // Set to false for production

/**
 * ErrorBoundary component to catch JavaScript errors anywhere in the component tree
 * Logs errors and displays a fallback UI
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to an error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    logger.error(`ErrorBoundary caught an error: ${error.message}`);
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="error-boundary">
          <div className="error-container">
            <h2 className="error-title">حدث خطأ غير متوقع</h2>
            <p className="error-message">
              نعتذر عن الخطأ. يرجى تحديث الصفحة أو العودة للخلف والمحاولة مرة أخرى.
            </p>
            <div className="error-actions">
              <button
                className="error-button refresh"
                onClick={() => window.location.reload()}
              >
                تحديث الصفحة
              </button>
              <button
                className="error-button back"
                onClick={() => {
                  this.resetError();
                  window.history.back();
                }}
              >
                العودة للخلف
              </button>
            </div>
            {isDev && this.state.error && (
              <details className="error-details">
                <summary>تفاصيل الخطأ</summary>
                <pre>{this.state.error.toString()}</pre>
                <pre>{this.state.error.stack}</pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 