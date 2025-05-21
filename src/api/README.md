# API Integration Layer

This directory contains the complete API integration layer for the Qozex application. It provides a comprehensive, type-safe way to interact with the backend API.

## Structure

- `api-structure.generated.ts` - A comprehensive mapping of all backend endpoints
- `apiClient.ts` - Core axios-based client that handles requests, auth, and error handling
- `ApiProvider.tsx` - React context provider for API state and authentication
- `types.ts` - TypeScript types and Zod schemas for API requests/responses
- `services/` - Service modules for each API domain (auth, user, exams, etc.)
- `hooks/` - React Query hooks for using API services in components
- `utils/` - Utility functions for error handling, etc.

## Usage Examples

### Authentication

```tsx
import { useApi } from '../api';

const LoginPage = () => {
  const { login, isLoading, error } = useApi();
  
  const handleSubmit = async (data) => {
    try {
      await login(data.phone, data.password);
      // Redirect on success
    } catch (err) {
      // Error handling
    }
  };
  
  return (
    // Login form
  );
};
```

### Fetching Data

```tsx
import { useExams } from '../api';

const ExamsPage = () => {
  const { exams, isLoading, error } = useExams();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      {exams.map(exam => (
        <div key={exam.id}>{exam.title}</div>
      ))}
    </div>
  );
};
```

### Submitting Data

```tsx
import { useExamSubmission } from '../api';

const ExamPage = ({ examId }) => {
  const { submitExam, isSubmitting, result } = useExamSubmission(examId);
  
  const handleSubmit = (answers) => {
    submitExam({
      answers,
      timeSpent: 300 // seconds
    });
  };
  
  return (
    // Exam form
  );
};
```

## Features

- **Type Safety**: Full TypeScript typings for all requests and responses
- **Data Validation**: Zod schemas validate both incoming and outgoing data
- **Error Handling**: Consistent error handling across all API calls
- **Authentication**: Built-in token management, refresh, and auth state
- **Caching**: React Query for efficient data fetching and caching
- **Organization**: Domain-based service structure for maintainability

## Extending

To add a new endpoint:

1. Add it to `api-structure.generated.ts`
2. Add request/response types and schemas to `types.ts` if needed
3. Implement the service function in the appropriate service file
4. Create a React Query hook for component usage if needed 