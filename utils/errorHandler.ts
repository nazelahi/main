// Error handling and logging utilities for production

export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: number;
  stack?: string;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errors: AppError[] = [];
  private maxErrors = 100;

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  logError(error: Error | AppError, context?: string): void {
    const appError: AppError = {
      code: 'code' in error ? error.code || 'UNKNOWN_ERROR' : 'UNKNOWN_ERROR',
      message: error.message,
      details: 'details' in error ? error.details : undefined,
      timestamp: Date.now(),
      stack: error.stack,
    };

    if (context) {
      appError.details = { ...appError.details, context };
    }

    this.errors.push(appError);

    // Keep only the last maxErrors errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Log to console in development
    if (__DEV__) {
      console.error('App Error:', appError);
    }
  }

  getErrors(): AppError[] {
    return [...this.errors];
  }

  clearErrors(): void {
    this.errors = [];
  }

  getLastError(): AppError | null {
    return this.errors.length > 0 ? this.errors[this.errors.length - 1] : null;
  }
}

// Specific error types for the app
export class CameraError extends Error {
  code = 'CAMERA_ERROR';
  details?: any;

  constructor(message: string, details?: any) {
    super(message);
    this.name = 'CameraError';
    this.details = details;
  }
}

export class ImageProcessingError extends Error {
  code = 'IMAGE_PROCESSING_ERROR';
  details?: any;

  constructor(message: string, details?: any) {
    super(message);
    this.name = 'ImageProcessingError';
    this.details = details;
  }
}

export class OCRError extends Error {
  code = 'OCR_ERROR';
  details?: any;

  constructor(message: string, details?: any) {
    super(message);
    this.name = 'OCRError';
    this.details = details;
  }
}

export class PermissionError extends Error {
  code = 'PERMISSION_ERROR';
  details?: any;

  constructor(message: string, details?: any) {
    super(message);
    this.name = 'PermissionError';
    this.details = details;
  }
}

export class StorageError extends Error {
  code = 'STORAGE_ERROR';
  details?: any;

  constructor(message: string, details?: any) {
    super(message);
    this.name = 'StorageError';
    this.details = details;
  }
}

// Error boundary for React components
export class AppErrorBoundary extends Error {
  code = 'REACT_ERROR_BOUNDARY';
  details?: any;

  constructor(message: string, details?: any) {
    super(message);
    this.name = 'AppErrorBoundary';
    this.details = details;
  }
}

// Utility functions for error handling
export const handleError = (error: Error, context?: string): void => {
  const errorHandler = ErrorHandler.getInstance();
  errorHandler.logError(error, context);
};

export const createError = (code: string, message: string, details?: any): AppError => ({
  code,
  message,
  details,
  timestamp: Date.now(),
});

// Async error wrapper
export const withErrorHandling = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: string
) => {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error as Error, context);
      throw error;
    }
  };
};

// Retry mechanism with exponential backoff
export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        break;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
};

// Validation utilities
export const validateImageUri = (uri: string): boolean => {
  if (!uri || typeof uri !== 'string') {
    return false;
  }

  const validExtensions = ['.jpg', '.jpeg', '.png', '.bmp', '.gif'];
  const hasValidExtension = validExtensions.some(ext => 
    uri.toLowerCase().includes(ext)
  );

  return hasValidExtension || uri.startsWith('data:image/') || uri.startsWith('file://');
};

export const validatePermissions = async (): Promise<boolean> => {
  try {
    const { Camera } = await import('expo-camera');
    const MediaLibrary = await import('expo-media-library');
    
    const cameraStatus = await Camera.getCameraPermissionsAsync();
    const mediaStatus = await MediaLibrary.getPermissionsAsync();
    
    return cameraStatus.status === 'granted' && mediaStatus.status === 'granted';
  } catch (error) {
    handleError(error as Error, 'validatePermissions');
    return false;
  }
};

// Performance monitoring
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startTimer(operation: string): () => void {
    const startTime = Date.now();
    
    return () => {
      const duration = Date.now() - startTime;
      this.recordMetric(operation, duration);
    };
  }

  recordMetric(operation: string, value: number): void {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    
    const values = this.metrics.get(operation)!;
    values.push(value);
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.splice(0, values.length - 100);
    }
  }

  getAverageTime(operation: string): number {
    const values = this.metrics.get(operation);
    if (!values || values.length === 0) {
      return 0;
    }
    
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  getMetrics(): Map<string, number[]> {
    return new Map(this.metrics);
  }

  clearMetrics(): void {
    this.metrics.clear();
  }
}

export default ErrorHandler;