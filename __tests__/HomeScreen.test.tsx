import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import HomeScreen from '../components/HomeScreen';

// Mock all dependencies
jest.mock('expo-camera', () => ({
  Camera: {
    requestCameraPermissionsAsync: jest.fn(),
    getCameraPermissionsAsync: jest.fn(),
  },
}));

jest.mock('expo-media-library', () => ({
  requestPermissionsAsync: jest.fn(),
  getPermissionsAsync: jest.fn(),
}));

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: {
    JPEG: 'jpeg',
  },
}));

jest.mock('../utils/documentStorage', () => ({
  DocumentStorage: {
    getAllDocuments: jest.fn(),
    saveDocument: jest.fn(),
    deleteDocument: jest.fn(),
  },
}));

jest.mock('../utils/errorHandler', () => ({
  handleError: jest.fn(),
  withErrorHandling: (fn: any) => fn,
}));

describe('HomeScreen', () => {
  const mockProps = {
    scannedImages: ['image1.jpg', 'image2.jpg'],
    onStartScan: jest.fn(),
    onViewDocuments: jest.fn(),
    onImagePress: jest.fn(),
    onBatchComplete: jest.fn(),
    onSmartScan: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText } = render(<HomeScreen {...mockProps} />);
    
    expect(getByText('Document Scanner')).toBeTruthy();
  });

  it('calls onStartScan when scan button is pressed', () => {
    const { getByText } = render(<HomeScreen {...mockProps} />);
    
    const scanButton = getByText('Scan Documents');
    fireEvent.press(scanButton);
    
    expect(mockProps.onStartScan).toHaveBeenCalled();
  });

  it('calls onViewDocuments when view documents button is pressed', () => {
    const { getByText } = render(<HomeScreen {...mockProps} />);
    
    const viewButton = getByText('View Documents');
    fireEvent.press(viewButton);
    
    expect(mockProps.onViewDocuments).toHaveBeenCalled();
  });

  it('shows empty state when no images', () => {
    const { getByText } = render(<HomeScreen {...mockProps} scannedImages={[]} />);
    
    expect(getByText('No documents yet')).toBeTruthy();
  });
});