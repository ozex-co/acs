import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
// Import UnoCSS first to ensure styles are properly applied
import '@unocss/reset/tailwind.css'
import 'uno.css'
// Import custom styles after UnoCSS
import './index.css'
import 'aos/dist/aos.css'
import AOS from 'aos'
import ErrorBoundary from './components/ErrorBoundary'
import { setupGlobalErrorHandlers } from './utils/errorHandler'
import { ApiProvider } from './api'

// Initialize global error handlers
setupGlobalErrorHandlers();

// Initialize AOS animations
AOS.init({
  duration: 800,
  once: false,
  easing: 'ease-out-cubic',
})

// Force light theme throughout the application
document.documentElement.classList.add('theme-light')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ApiProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </ApiProvider>
  </React.StrictMode>,
)
