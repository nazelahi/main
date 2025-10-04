import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ImagePreview from '../../components/ImagePreview';

// Mock the dependencies
jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: {
    JPEG: 'jpeg',
  },
}));

jest.mock('expo-media-library', () => ({
  createAssetAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
}));

jest.mock('expo-file-system', () => ({
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
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
    const { getByTestId } = render(<ImagePreview {...mockProps} />);
    
    expect(getByTestId('image-preview')).toBeTruthy();
  });

  it('calls onSave when save button is pressed', () => {
    const { getByTestId } = render(<ImagePreview {...mockProps} />);
    
    const saveButton = getByTestId('save-button');
    fireEvent.press(saveButton);
    
    expect(mockProps.onSave).toHaveBeenCalled();
  });

  it('calls onRetake when retake button is pressed', () => {
    const { getByTestId } = render(<ImagePreview {...mockProps} />);
    
    const retakeButton = getByTestId('retake-button');
    fireEvent.press(retakeButton);
    
    expect(mockProps.onRetake).toHaveBeenCalled();
  });

  it('calls onBack when back button is pressed', () => {
    const { getByTestId } = render(<ImagePreview {...mockProps} />);
    
    const backButton = getByTestId('back-button');
    fireEvent.press(backButton);
    
    expect(mockProps.onBack).toHaveBeenCalled();
  });

  it('calls onAdvancedOCR when advanced OCR button is pressed', () => {
    const { getByTestId } = render(<ImagePreview {...mockProps} />);
    
    const advancedOCRButton = getByTestId('advanced-ocr-button');
    fireEvent.press(advancedOCRButton);
    
    expect(mockProps.onAdvancedOCR).toHaveBeenCalled();
  });
});