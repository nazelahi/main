import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import DocumentScanner from '../components/DocumentScanner';

// Mock all dependencies
jest.mock('expo-camera', () => ({
  Camera: {
    requestCameraPermissionsAsync: jest.fn(),
    getCameraPermissionsAsync: jest.fn(),
  },
  CameraType: {
    back: 'back',
    front: 'front',
  },
}));

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: {
    JPEG: 'jpeg',
  },
}));

jest.mock('../utils/smartDetection', () => ({
  detectDocumentCorners: jest.fn(),
  validateDocumentCorners: jest.fn(),
}));

jest.mock('../utils/scanQualityAssessment', () => ({
  assessScanQuality: jest.fn(),
}));

jest.mock('../utils/errorHandler', () => ({
  handleError: jest.fn(),
  withErrorHandling: (fn: any) => fn,
}));

describe('DocumentScanner', () => {
  const mockProps = {
    onDocumentScanned: jest.fn(),
    onClose: jest.fn(),
    mode: 'single' as const,
    isScanning: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByTestId } = render(<DocumentScanner {...mockProps} />);
    
    expect(getByTestId('camera-view')).toBeTruthy();
  });

  it('calls onClose when close button is pressed', () => {
    const { getByTestId } = render(<DocumentScanner {...mockProps} />);
    
    const closeButton = getByTestId('close-button');
    fireEvent.press(closeButton);
    
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('calls onDocumentScanned when capture button is pressed', () => {
    const { getByTestId } = render(<DocumentScanner {...mockProps} />);
    
    const captureButton = getByTestId('capture-button');
    fireEvent.press(captureButton);
    
    expect(mockProps.onDocumentScanned).toHaveBeenCalled();
  });
});