import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ImagePreview from '../components/ImagePreview';

// Mock all dependencies
jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: {
    JPEG: 'jpeg',
    PNG: 'png',
  },
  FlipType: {
    Horizontal: 'horizontal',
    Vertical: 'vertical',
  },
  RotationType: {
    Rotate90: 90,
    Rotate180: 180,
    Rotate270: 270,
  },
}));

jest.mock('expo-media-library', () => ({
  createAssetAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
}));

jest.mock('expo-sharing', () => ({
  shareAsync: jest.fn(),
}));

jest.mock('expo-print', () => ({
  printAsync: jest.fn(),
}));

jest.mock('../utils/ocr', () => ({
  processImageWithOCR: jest.fn(),
  terminateOCREngine: jest.fn(),
}));

jest.mock('../utils/errorHandler', () => ({
  handleError: jest.fn(),
  withErrorHandling: (fn: any) => fn,
}));

describe('ImagePreview', () => {
  const mockProps = {
    imageUri: 'file://test-image.jpg',
    onSave: jest.fn(),
    onRetake: jest.fn(),
    onBack: jest.fn(),
    onAdvancedOCR: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText } = render(<ImagePreview {...mockProps} />);
    
    expect(getByText('Document Preview')).toBeTruthy();
  });

  it('calls onSave when save button is pressed', () => {
    const { getByText } = render(<ImagePreview {...mockProps} />);
    
    const saveButton = getByText('Save');
    fireEvent.press(saveButton);
    
    expect(mockProps.onSave).toHaveBeenCalled();
  });

  it('calls onRetake when retake button is pressed', () => {
    const { getByText } = render(<ImagePreview {...mockProps} />);
    
    const retakeButton = getByText('Retake');
    fireEvent.press(retakeButton);
    
    expect(mockProps.onRetake).toHaveBeenCalled();
  });

  it('calls onBack when back button is pressed', () => {
    const { getByTestId } = render(<ImagePreview {...mockProps} />);
    
    const backButton = getByTestId('back-button');
    fireEvent.press(backButton);
    
    expect(mockProps.onBack).toHaveBeenCalled();
  });
});