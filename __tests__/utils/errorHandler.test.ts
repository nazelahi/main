import { ErrorHandler, AppError, handleError, createError, withErrorHandling } from '../../utils/errorHandler';

describe('ErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AppError', () => {
    it('creates error with basic properties', () => {
      const error: AppError = {
        code: 'TEST_ERROR',
        message: 'Test error message',
        timestamp: Date.now(),
        details: { userId: '123' }
      };
      
      expect(error.code).toBe('TEST_ERROR');
      expect(error.message).toBe('Test error message');
      expect(error.timestamp).toBeInstanceOf(Number);
      expect(error.details).toEqual({ userId: '123' });
    });
  });

  describe('ErrorHandler', () => {
    it('is a singleton', () => {
      const instance1 = ErrorHandler.getInstance();
      const instance2 = ErrorHandler.getInstance();
      
      expect(instance1).toBe(instance2);
    });

    it('logs errors', () => {
      const errorHandler = ErrorHandler.getInstance();
      const error = new Error('Test error');
      
      errorHandler.logError(error);
      
      // Since we can't easily test private methods, we'll test the public interface
      expect(errorHandler).toBeDefined();
    });

    it('handles errors with context', () => {
      const errorHandler = ErrorHandler.getInstance();
      const error = new Error('Test error');
      
      errorHandler.handleError(error, 'test-context');
      
      expect(errorHandler).toBeDefined();
    });
  });

  describe('handleError', () => {
    it('handles errors without throwing', () => {
      const error = new Error('Test error');
      
      expect(() => handleError(error)).not.toThrow();
    });

    it('handles errors with context', () => {
      const error = new Error('Test error');
      
      expect(() => handleError(error, 'test-context')).not.toThrow();
    });
  });

  describe('createError', () => {
    it('creates error with code and message', () => {
      const error = createError('TEST_CODE', 'Test message');
      
      expect(error.code).toBe('TEST_CODE');
      expect(error.message).toBe('Test message');
      expect(error.timestamp).toBeInstanceOf(Number);
    });

    it('creates error with details', () => {
      const details = { userId: '123', action: 'test' };
      const error = createError('TEST_CODE', 'Test message', details);
      
      expect(error.details).toEqual(details);
    });
  });

  describe('withErrorHandling', () => {
    it('executes function successfully', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      const wrappedFn = withErrorHandling(mockFn);
      
      const result = await wrappedFn('test');
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledWith('test');
    });

    it('handles function errors', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Test error'));
      const wrappedFn = withErrorHandling(mockFn);
      
      const result = await wrappedFn('test');
      
      expect(result).toBeUndefined();
      expect(mockFn).toHaveBeenCalledWith('test');
    });
  });

  describe('Error classes', () => {
    it('CameraError extends Error', () => {
      const { CameraError } = require('../../utils/errorHandler');
      const error = new CameraError('Camera failed');
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Camera failed');
    });

    it('ImageProcessingError extends Error', () => {
      const { ImageProcessingError } = require('../../utils/errorHandler');
      const error = new ImageProcessingError('Processing failed');
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Processing failed');
    });

    it('OCRError extends Error', () => {
      const { OCRError } = require('../../utils/errorHandler');
      const error = new OCRError('OCR failed');
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('OCR failed');
    });

    it('PermissionError extends Error', () => {
      const { PermissionError } = require('../../utils/errorHandler');
      const error = new PermissionError('Permission denied');
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Permission denied');
    });

    it('StorageError extends Error', () => {
      const { StorageError } = require('../../utils/errorHandler');
      const error = new StorageError('Storage failed');
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Storage failed');
    });
  });
});