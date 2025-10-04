// Production configuration for Document Scanner App

export interface AppConfig {
  // OCR Configuration
  ocr: {
    engine: 'tesseract' | 'mock' | 'google';
    fallbackToMock: boolean;
    maxRetries: number;
    timeout: number;
    supportedLanguages: string[];
  };

  // Image Processing
  imageProcessing: {
    maxWidth: number;
    maxHeight: number;
    quality: number;
    compression: number;
    supportedFormats: string[];
  };

  // Camera Configuration
  camera: {
    quality: number;
    maxZoom: number;
    autoFocus: boolean;
    flashModes: string[];
  };

  // Storage Configuration
  storage: {
    maxDocuments: number;
    maxFileSize: number; // in bytes
    cleanupInterval: number; // in milliseconds
  };

  // Performance
  performance: {
    enableMetrics: boolean;
    maxMetrics: number;
    enableCaching: boolean;
    cacheSize: number; // in MB
  };

  // UI Configuration
  ui: {
    animations: boolean;
    hapticFeedback: boolean;
    theme: 'light' | 'dark' | 'auto';
  };

  // Security
  security: {
    enableLogging: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    enableCrashReporting: boolean;
  };
}

const defaultConfig: AppConfig = {
  ocr: {
    engine: 'tesseract',
    fallbackToMock: true,
    maxRetries: 3,
    timeout: 30000, // 30 seconds
    supportedLanguages: ['eng', 'spa', 'fra', 'deu', 'ita', 'por', 'rus'],
  },

  imageProcessing: {
    maxWidth: 1200,
    maxHeight: 1600,
    quality: 0.8,
    compression: 0.8,
    supportedFormats: ['jpeg', 'png', 'webp'],
  },

  camera: {
    quality: 0.8,
    maxZoom: 2.0,
    autoFocus: true,
    flashModes: ['off', 'on', 'auto'],
  },

  storage: {
    maxDocuments: 1000,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    cleanupInterval: 24 * 60 * 60 * 1000, // 24 hours
  },

  performance: {
    enableMetrics: true,
    maxMetrics: 100,
    enableCaching: true,
    cacheSize: 50, // 50MB
  },

  ui: {
    animations: true,
    hapticFeedback: true,
    theme: 'auto',
  },

  security: {
    enableLogging: true,
    logLevel: 'warn',
    enableCrashReporting: false,
  },
};

// Production configuration
const productionConfig: AppConfig = {
  ...defaultConfig,
  ocr: {
    ...defaultConfig.ocr,
    timeout: 60000, // 1 minute for production
  },
  performance: {
    ...defaultConfig.performance,
    enableMetrics: true,
  },
  security: {
    ...defaultConfig.security,
    enableLogging: true,
    logLevel: 'error',
  },
};

// Development configuration
const developmentConfig: AppConfig = {
  ...defaultConfig,
  ocr: {
    ...defaultConfig.ocr,
    timeout: 10000, // 10 seconds for development
  },
  performance: {
    ...defaultConfig.performance,
    enableMetrics: true,
  },
  security: {
    ...defaultConfig.security,
    enableLogging: true,
    logLevel: 'debug',
  },
};

// Get configuration based on environment
export const getAppConfig = (): AppConfig => {
  if (__DEV__) {
    return developmentConfig;
  }
  return productionConfig;
};

// Configuration validation
export const validateConfig = (config: AppConfig): boolean => {
  try {
    // Validate OCR configuration
    if (!config.ocr.engine || !['tesseract', 'mock', 'google'].includes(config.ocr.engine)) {
      throw new Error('Invalid OCR engine');
    }

    if (config.ocr.maxRetries < 0 || config.ocr.maxRetries > 10) {
      throw new Error('Invalid OCR max retries');
    }

    if (config.ocr.timeout < 1000 || config.ocr.timeout > 300000) {
      throw new Error('Invalid OCR timeout');
    }

    // Validate image processing configuration
    if (config.imageProcessing.maxWidth < 100 || config.imageProcessing.maxWidth > 4000) {
      throw new Error('Invalid max width');
    }

    if (config.imageProcessing.maxHeight < 100 || config.imageProcessing.maxHeight > 4000) {
      throw new Error('Invalid max height');
    }

    if (config.imageProcessing.quality < 0.1 || config.imageProcessing.quality > 1.0) {
      throw new Error('Invalid image quality');
    }

    // Validate storage configuration
    if (config.storage.maxDocuments < 1 || config.storage.maxDocuments > 10000) {
      throw new Error('Invalid max documents');
    }

    if (config.storage.maxFileSize < 1024 * 1024 || config.storage.maxFileSize > 100 * 1024 * 1024) {
      throw new Error('Invalid max file size');
    }

    return true;
  } catch (error) {
    console.error('Configuration validation failed:', error);
    return false;
  }
};

// Feature flags
export interface FeatureFlags {
  enableOCR: boolean;
  enableImageEnhancement: boolean;
  enableAutoCapture: boolean;
  enableMultiPage: boolean;
  enableSharing: boolean;
  enableCloudSync: boolean;
  enableAnalytics: boolean;
}

export const getFeatureFlags = (): FeatureFlags => {
  const config = getAppConfig();
  
  return {
    enableOCR: config.ocr.engine !== 'mock',
    enableImageEnhancement: true,
    enableAutoCapture: true,
    enableMultiPage: true,
    enableSharing: true,
    enableCloudSync: false, // Disabled for now
    enableAnalytics: config.security.enableLogging,
  };
};

// Environment detection
export const isDevelopment = (): boolean => __DEV__;
export const isProduction = (): boolean => !__DEV__;

// App constants
export const APP_CONSTANTS = {
  VERSION: '1.0.0',
  BUILD_NUMBER: '1',
  MINIMUM_IOS_VERSION: '11.0',
  MINIMUM_ANDROID_VERSION: '21',
  SUPPORTED_PLATFORMS: ['ios', 'android', 'web'],
} as const;

export default getAppConfig;