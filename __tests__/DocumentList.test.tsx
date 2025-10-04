import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import DocumentList from '../components/DocumentList';

// Mock all dependencies
jest.mock('expo-media-library', () => ({
  createAssetAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
}));

jest.mock('expo-sharing', () => ({
  shareAsync: jest.fn(),
}));

jest.mock('../utils/documentStorage', () => ({
  DocumentStorage: {
    deleteDocument: jest.fn(),
    getAllDocuments: jest.fn(),
  },
}));

jest.mock('../utils/errorHandler', () => ({
  handleError: jest.fn(),
  withErrorHandling: (fn: any) => fn,
}));

describe('DocumentList', () => {
  const mockProps = {
    images: ['image1.jpg', 'image2.jpg', 'image3.jpg'],
    onBack: jest.fn(),
    onImagePress: jest.fn(),
    onDocumentsDeleted: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText } = render(<DocumentList {...mockProps} />);
    
    expect(getByText('Document Library')).toBeTruthy();
  });

  it('calls onBack when back button is pressed', () => {
    const { getByTestId } = render(<DocumentList {...mockProps} />);
    
    const backButton = getByTestId('back-button');
    fireEvent.press(backButton);
    
    expect(mockProps.onBack).toHaveBeenCalled();
  });

  it('shows empty state when no images', () => {
    const { getByText } = render(<DocumentList {...mockProps} images={[]} />);
    
    expect(getByText('No documents found')).toBeTruthy();
  });
});