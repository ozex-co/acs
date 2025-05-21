# API Integration Guide

This document outlines the integration between the frontend and backend API in the Qozex application. It describes the API contract, common pitfalls, and how integration issues are handled.

## Response Format

### Standard API Response

The backend uses a standardized response format:

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

For errors:

```json
{
  "success": false,
  "message": "Error message",
  "code": "ERROR_CODE",
  "details": { ... }
}
```

### Frontend API Client

The frontend uses client handlers to standardize error handling and API interactions. Each API handler returns:

```typescript
{
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

## Integration Challenges & Solutions

### 1. Response Format Variations

**Challenge**: Different backend routes return data in slightly different formats:

```json
// Format 1
{ "success": true, "data": { "exam": { "id": 1, ... } } }

// Format 2
{ "success": true, "data": { "id": 1, ... } }

// Format 3
{ "exam": { "id": 1, ... } }
```

**Solution**: The `extractSpecificData` utility function handles all formats:

```typescript
// Example usage:
const exam = extractSpecificData(response.data, 'exam');
```

### 2. Token Location Variations

**Challenge**: Authentication token can be returned in various locations:

```json
// Format 1
{ "token": "jwt-token" }

// Format 2
{ "data": { "token": "jwt-token" } }

// Format 3
{ "user": { "token": "jwt-token" } }
```

**Solution**: The `extractUserToken` utility function handles all formats:

```typescript
// Example usage:
const token = extractUserToken(response.data);
```

### 3. ID Type Inconsistencies 

**Challenge**: IDs are sometimes numbers and sometimes strings.

**Solution**: Always convert IDs to strings in the frontend:

```typescript
id: String(data.id)
```

### 4. Field Name Variations

**Challenge**: Different naming conventions:
- `questionCount` vs `questions_count`
- `fullName` vs `full_name`

**Solution**: Defensive access:

```typescript
questionsCount: data.questionsCount || data.questions_count || 0,
fullName: data.fullName || data.fullname || data.full_name || '',
```

## API Routes

| Frontend Constant | Backend Endpoint | HTTP Method | Description |
|-------------------|------------------|------------|-------------|
| `LOGIN` | `/auth/login` | POST | User login |
| `ADMIN_LOGIN` | `/auth/q0z3x-management/login` | POST | Admin login |
| `REFRESH_TOKEN` | `/auth/refresh` | POST | Refresh user token |
| `GET_EXAMS` | `/exams` | GET | Get all exams |
| `GET_EXAM` | `/exams/:id` | GET | Get exam by ID |
| `SUBMIT_EXAM` | `/exams/:id/submit` | POST | Submit exam answers |
| `GET_RESULTS` | `/results` | GET | Get user's results |
| `GET_RESULT` | `/results/:id` | GET | Get result details |

## Authentication Flow

1. User logs in with phone/password
2. Backend returns JWT token & user data
3. Token is stored in localStorage
4. Token is included in Authorization header for all requests
5. Token refresh is handled automatically

## Error Handling

API client handles common error scenarios:
- Network errors
- Authentication errors (401)
- Permission errors (403)
- CSRF token errors
- Server errors (500)

## Best Practices

1. **Use API client utilities**:
   ```typescript
   import { extractSpecificData } from '../utils/api';
   const exam = extractSpecificData(response.data, 'exam');
   ```

2. **Handle multiple formats**:
   ```typescript
   const resultId = response.data?.resultId || response.data?.result?.id;
   ```

3. **Safe property access**:
   ```typescript
   const name = userData?.fullName || '';
   ```

4. **Consistent error handling**:
   ```typescript
   try {
     // API call
   } catch (error: any) {
     return {
       success: false,
       error: error?.message || 'Fallback error message'
     };
   }
   ``` 