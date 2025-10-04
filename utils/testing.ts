// Testing utilities for Document Scanner App

import { AppError, ErrorHandler } from './errorHandler';
import { getAppConfig } from '../config/appConfig';

export interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
  details?: any;
}

export interface TestSuite {
  name: string;
  tests: TestResult[];
  totalDuration: number;
  passed: number;
  failed: number;
}

export class TestRunner {
  private static instance: TestRunner;
  private testSuites: TestSuite[] = [];

  static getInstance(): TestRunner {
    if (!TestRunner.instance) {
      TestRunner.instance = new TestRunner();
    }
    return TestRunner.instance;
  }

  async runTest(name: string, testFn: () => Promise<void> | void): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      await testFn();
      const duration = Date.now() - startTime;
      
      return {
        name,
        passed: true,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        name,
        passed: false,
        error: error instanceof Error ? error.message : String(error),
        duration,
      };
    }
  }

  async runTestSuite(suiteName: string, tests: Array<{ name: string; test: () => Promise<void> | void }>): Promise<TestSuite> {
    const startTime = Date.now();
    const testResults: TestResult[] = [];

    for (const { name, test } of tests) {
      const result = await this.runTest(name, test);
      testResults.push(result);
    }

    const totalDuration = Date.now() - startTime;
    const passed = testResults.filter(r => r.passed).length;
    const failed = testResults.filter(r => !r.passed).length;

    const suite: TestSuite = {
      name: suiteName,
      tests: testResults,
      totalDuration,
      passed,
      failed,
    };

    this.testSuites.push(suite);
    return suite;
  }

  getTestSuites(): TestSuite[] {
    return [...this.testSuites];
  }

  clearResults(): void {
    this.testSuites = [];
  }

  generateReport(): string {
    let report = 'Test Report\n';
    report += `${'='.repeat(50)  }\n\n`;

    for (const suite of this.testSuites) {
      report += `Test Suite: ${suite.name}\n`;
      report += `Duration: ${suite.totalDuration}ms\n`;
      report += `Passed: ${suite.passed}, Failed: ${suite.failed}\n`;
      report += `${'-'.repeat(30)  }\n`;

      for (const test of suite.tests) {
        const status = test.passed ? '✓' : '✗';
        report += `${status} ${test.name} (${test.duration}ms)\n`;
        
        if (!test.passed && test.error) {
          report += `  Error: ${test.error}\n`;
        }
      }
      
      report += '\n';
    }

    return report;
  }
}

// Specific test functions
export const testOCRFunctionality = async (): Promise<void> => {
  const { getOCREngine } = await import('./ocr');
  
  const ocrEngine = await getOCREngine();
  
  if (!ocrEngine.isInitialized()) {
    throw new Error('OCR engine not initialized');
  }

  const languages = ocrEngine.getSupportedLanguages();
  if (!Array.isArray(languages) || languages.length === 0) {
    throw new Error('No supported languages found');
  }
};

export const testImageProcessing = async (): Promise<void> => {
  const { DocumentProcessor } = await import('./imageProcessing');
  
  // Test with a mock image URI
  const mockImageUri = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';
  
  try {
    await DocumentProcessor.enhanceDocument(mockImageUri);
  } catch (error) {
    // This is expected to fail with a mock image, but the function should not crash
    if (error instanceof Error && error.message.includes('Failed to enhance document')) {
      return; // Expected error
    }
    throw error;
  }
};

export const testErrorHandling = async (): Promise<void> => {
  const errorHandler = ErrorHandler.getInstance();
  
  // Test error logging
  const testError = new Error('Test error');
  errorHandler.logError(testError, 'test');
  
  const errors = errorHandler.getErrors();
  if (errors.length === 0) {
    throw new Error('Error logging failed');
  }
  
  const lastError = errorHandler.getLastError();
  if (!lastError || lastError.message !== 'Test error') {
    throw new Error('Error retrieval failed');
  }
};

export const testConfiguration = async (): Promise<void> => {
  const config = getAppConfig();
  
  if (!config.ocr || !config.imageProcessing || !config.camera) {
    throw new Error('Configuration is incomplete');
  }
  
  if (config.ocr.maxRetries < 0) {
    throw new Error('Invalid OCR configuration');
  }
  
  if (config.imageProcessing.quality < 0 || config.imageProcessing.quality > 1) {
    throw new Error('Invalid image processing configuration');
  }
};

export const testPermissions = async (): Promise<void> => {
  const { validatePermissions } = await import('./errorHandler');
  
  const hasPermissions = await validatePermissions();
  
  // In test environment, we might not have permissions, but the function should not crash
  if (typeof hasPermissions !== 'boolean') {
    throw new Error('Permission validation returned invalid result');
  }
};

export const testFileSystem = async (): Promise<void> => {
  const FileSystem = await import('expo-file-system');
  
  // Test basic file system operations
  const testDir = `${(FileSystem as any).documentDirectory  }test/`;
  
  try {
    const dirInfo = await FileSystem.getInfoAsync(testDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(testDir, { intermediates: true });
    }
    
    // Clean up
    await FileSystem.deleteAsync(testDir, { idempotent: true });
  } catch (error) {
    throw new Error(`File system test failed: ${error}`);
  }
};

// Performance tests
export const testPerformance = async (): Promise<void> => {
  const { PerformanceMonitor } = await import('./errorHandler');
  
  const monitor = PerformanceMonitor.getInstance();
  
  // Test timer functionality
  const endTimer = monitor.startTimer('test_operation');
  
  // Simulate some work
  await new Promise(resolve => setTimeout(resolve, 100));
  
  endTimer();
  
  const avgTime = monitor.getAverageTime('test_operation');
  if (avgTime < 50 || avgTime > 200) {
    throw new Error(`Unexpected performance measurement: ${avgTime}ms`);
  }
};

// Integration tests
export const runIntegrationTests = async (): Promise<TestSuite> => {
  const testRunner = TestRunner.getInstance();
  
  const tests = [
    { name: 'OCR Functionality', test: testOCRFunctionality },
    { name: 'Image Processing', test: testImageProcessing },
    { name: 'Error Handling', test: testErrorHandling },
    { name: 'Configuration', test: testConfiguration },
    { name: 'Permissions', test: testPermissions },
    { name: 'File System', test: testFileSystem },
    { name: 'Performance', test: testPerformance },
  ];
  
  return await testRunner.runTestSuite('Integration Tests', tests);
};

// Unit tests for specific components
export const runUnitTests = async (): Promise<TestSuite> => {
  const testRunner = TestRunner.getInstance();
  
  const tests = [
    { 
      name: 'Config Validation', 
      test: async () => {
        const { validateConfig } = await import('../config/appConfig');
        const config = getAppConfig();
        if (!validateConfig(config)) {
          throw new Error('Configuration validation failed');
        }
      }
    },
    { 
      name: 'Error Creation', 
      test: async () => {
        const { createError } = await import('./errorHandler');
        const error = createError('TEST_ERROR', 'Test message');
        if (error.code !== 'TEST_ERROR' || error.message !== 'Test message') {
          throw new Error('Error creation failed');
        }
      }
    },
  ];
  
  return await testRunner.runTestSuite('Unit Tests', tests);
};

// Run all tests
export const runAllTests = async (): Promise<TestSuite[]> => {
  const testRunner = TestRunner.getInstance();
  testRunner.clearResults();
  
  const integrationTests = await runIntegrationTests();
  const unitTests = await runUnitTests();
  
  return [integrationTests, unitTests];
};

export default TestRunner;