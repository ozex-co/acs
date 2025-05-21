/**
 * Integration test for API client
 * Tests various backend response formats to ensure they're correctly handled
 */

import { extractApiData, extractUserToken, extractSpecificData } from './api';

describe('API Client Integration Test', () => {
  // Test extractUserToken function
  describe('extractUserToken', () => {
    test('should extract token from various response formats', () => {
      // Direct token string
      expect(extractUserToken('token-string')).toBe('token-string');
      
      // Root level token
      expect(extractUserToken({ token: 'token-1' })).toBe('token-1');
      
      // Token in user object
      expect(extractUserToken({ user: { token: 'token-2' } })).toBe('token-2');
      
      // Token in data object
      expect(extractUserToken({ data: { token: 'token-3' } })).toBe('token-3');
      
      // Token in data.user object
      expect(extractUserToken({ data: { user: { token: 'token-4' } } })).toBe('token-4');
      
      // Alternative token property names
      expect(extractUserToken({ access_token: 'token-5' })).toBe('token-5');
      expect(extractUserToken({ accessToken: 'token-6' })).toBe('token-6');
      
      // Should return undefined for missing token
      expect(extractUserToken(null)).toBeUndefined();
      expect(extractUserToken({})).toBeUndefined();
      expect(extractUserToken({ user: {} })).toBeUndefined();
    });
  });
  
  // Test extractSpecificData function
  describe('extractSpecificData', () => {
    test('should extract exam data from various response formats', () => {
      const testExam = { id: '1', title: 'Test Exam', questionsCount: 10 };
      
      // Extract from data.exam
      expect(extractSpecificData({ data: { exam: testExam } }, 'exam')).toEqual(testExam);
      
      // Extract from root level
      expect(extractSpecificData({ exam: testExam }, 'exam')).toEqual(testExam);
      
      // Extract directly when matches exam pattern
      expect(extractSpecificData(testExam, 'exam')).toEqual(testExam);
      
      // Should return null for missing or invalid data
      expect(extractSpecificData(null, 'exam')).toBeNull();
      expect(extractSpecificData({}, 'exam')).toBeNull();
      expect(extractSpecificData({ data: {} }, 'exam')).toBeNull();
    });
    
    test('should extract result data from various response formats', () => {
      const testResult = { id: '1', score: 8, totalQuestions: 10 };
      
      // Extract from data.result
      expect(extractSpecificData({ data: { result: testResult } }, 'result')).toEqual(testResult);
      
      // Extract from root level
      expect(extractSpecificData({ result: testResult }, 'result')).toEqual(testResult);
      
      // Extract directly when matches result pattern
      expect(extractSpecificData(testResult, 'result')).toEqual(testResult);
      
      // Should return null for missing or invalid data
      expect(extractSpecificData(null, 'result')).toBeNull();
      expect(extractSpecificData({}, 'result')).toBeNull();
      expect(extractSpecificData({ data: {} }, 'result')).toBeNull();
    });
    
    test('should extract array data (exams, results) from various formats', () => {
      const testExams = [{ id: '1' }, { id: '2' }];
      const testResults = [{ id: '1' }, { id: '2' }];
      
      // Extract from data.exams
      expect(extractSpecificData({ data: { exams: testExams } }, 'exams')).toEqual(testExams);
      
      // Extract from root level
      expect(extractSpecificData({ exams: testExams }, 'exams')).toEqual(testExams);
      
      // Extract directly when is array
      expect(extractSpecificData(testExams, 'exams')).toEqual(testExams);
      
      // Similar tests for results
      expect(extractSpecificData({ data: { results: testResults } }, 'results')).toEqual(testResults);
      expect(extractSpecificData({ results: testResults }, 'results')).toEqual(testResults);
      expect(extractSpecificData(testResults, 'results')).toEqual(testResults);
    });
  });
}); 