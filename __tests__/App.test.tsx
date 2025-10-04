import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import App from '../App';

// Mock all the dependencies
jest.mock('expo-camera', () => ({
  Camera: {
    requestCameraPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
    getCameraPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  },
  CameraType: {
    back: 'back',
    front: 'front',
  },
}));

jest.mock('expo-media-library', () => ({
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  createAssetAsync: jest.fn(() => Promise.resolve({ id: 'test-asset' })),
}));

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(() => Promise.resolve({ uri: 'processed-image.jpg' })),
  SaveFormat: {
    JPEG: 'jpeg',
  },
}));

jest.mock('expo-file-system', () => ({
  documentDirectory: 'file://test-dir/',
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
}));

jest.mock('expo-linear-gradient', () => 'LinearGradient');

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../components/HomeScreen', () => 'HomeScreen');
jest.mock('../components/ImagePreview', () => 'ImagePreview');
jest.mock('../components/DocumentList', () => 'DocumentList');
jest.mock('../components/AdvancedOCRPreview', () => 'AdvancedOCRPreview');
jest.mock('../components/SmartScanner', () => 'SmartScanner');

jest.mock('../utils/documentStorage', () => ({
  DocumentStorage: {
    getAllDocuments: jest.fn(() => Promise.resolve([])),
    saveDocument: jest.fn(() => Promise.resolve({ id: 'test-doc' })),
  },
}));

jest.mock('../utils/errorHandler', () => ({
  handleError: jest.fn(),
  withErrorHandling: (fn: any) => fn,
}));

jest.mock('../utils/ocr', () => ({
  terminateOCREngine: jest.fn(() => Promise.resolve()),
}));

jest.mock('../config/appConfig', () => ({
  getAppConfig: jest.fn(() => ({
    imageProcessing: { maxWidth: 1200, maxHeight: 1600, compression: 0.8 },
    storage: { maxDocuments: 1000 },
  })),
  getFeatureFlags: jest.fn(() => ({
    enableOCR: true,
    enableImageEnhancement: true,
  })),
}));

jest.mock('../config/designSystem', () => ({
  DesignSystem: {
    colors: {
      background: '#000000',
      gradients: {
        primary: { colors: ['#000000', '#333333'] },
        accent: { colors: ['#333333', '#666666'] },
        secondary: { colors: ['#666666', '#999999'] },
      },
      textInverse: '#ffffff',
    },
    spacing: {
      xl: 24,
      '4xl': 32,
      md: 16,
      '3xl': 28,
      lg: 20,
      sm: 8,
    },
    typography: {
      sizes: {
        base: 16,
        '2xl': 24,
      },
      lineHeights: {
        relaxed: 1.5,
      },
    },
    borderRadius: {
      '2xl': 16,
    },
  },
  createGradientStyle: jest.fn((colors) => ({ colors })),
  createTextStyle: jest.fn((_size, _weight) => ({ fontSize: 16, fontWeight: 'normal' })),
}));

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', async () => {
    const { getByText } = render(<App />);
    
    await waitFor(() => {
      expect(getByText('Initializing Document Scanner...')).toBeTruthy();
    });
  });

  it('shows loading state initially', () => {
    const { getByText } = render(<App />);
    expect(getByText('Initializing Document Scanner...')).toBeTruthy();
  });

  it('handles permission denied gracefully', async () => {
    // const { Camera } = require('expo-camera');
    Camera.requestCameraPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });
    
    const { getByText } = render(<App />);
    
    await waitFor(() => {
      expect(getByText('Camera Access Required')).toBeTruthy();
    });
  });

  it('initializes app successfully', async () => {
    const { getByText } = render(<App />);
    
    await waitFor(() => {
      expect(getByText('Document Scanner')).toBeTruthy();
    });
  });
});