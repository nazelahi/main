import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import HomeScreen from '../../components/HomeScreen';

// Mock the dependencies
jest.mock('expo-camera', () => ({
  Camera: {
    requestCameraPermissionsAsync: jest.fn(),
  },
}));

jest.mock('expo-media-library', () => ({
  requestPermissionsAsync: jest.fn(),
  createAssetAsync: jest.fn(),
}));

jest.mock('expo-file-system', () => ({
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
}));

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: {
    JPEG: 'jpeg',
  },
}));

jest.mock('expo-linear-gradient', () => 'LinearGradient');
jest.mock('expo-blur', () => 'BlurView');
jest.mock('@expo/vector-icons', () => 'Ionicons');

// Mock child components
jest.mock('../../components/DocumentTypeSelector', () => 'DocumentTypeSelector');
jest.mock('../../components/BatchManager', () => 'BatchManager');
jest.mock('../../components/UnifiedScanner', () => 'UnifiedScanner');
jest.mock('../../components/ExportOptionsModal', () => 'ExportOptionsModal');
jest.mock('../../components/AIInsightsModal', () => 'AIInsightsModal');
jest.mock('../../components/SmartOrganizationModal', () => 'SmartOrganizationModal');

describe('HomeScreen', () => {
  const mockProps = {
    scannedImages: ['file://test1.jpg', 'file://test2.jpg'],
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
    const { getByTestId } = render(<HomeScreen {...mockProps} />);
    
    expect(getByTestId('home-screen')).toBeTruthy();
  });

  it('displays scanned images count', () => {
    const { getByText } = render(<HomeScreen {...mockProps} />);
    
    expect(getByText('2 Documents')).toBeTruthy();
  });

  it('calls onStartScan when scan button is pressed', () => {
    const { getByTestId } = render(<HomeScreen {...mockProps} />);
    
    const scanButton = getByTestId('scan-button');
    fireEvent.press(scanButton);
    
    expect(mockProps.onStartScan).toHaveBeenCalled();
  });

  it('calls onViewDocuments when view documents button is pressed', () => {
    const { getByTestId } = render(<HomeScreen {...mockProps} />);
    
    const viewButton = getByTestId('view-documents-button');
    fireEvent.press(viewButton);
    
    expect(mockProps.onViewDocuments).toHaveBeenCalled();
  });

  it('calls onSmartScan when smart scan button is pressed', () => {
    const { getByTestId } = render(<HomeScreen {...mockProps} />);
    
    const smartScanButton = getByTestId('smart-scan-button');
    fireEvent.press(smartScanButton);
    
    expect(mockProps.onSmartScan).toHaveBeenCalled();
  });

  it('shows document type selector when scan button is pressed', () => {
    const { getByTestId } = render(<HomeScreen {...mockProps} />);
    
    const scanButton = getByTestId('scan-button');
    fireEvent.press(scanButton);
    
    expect(getByTestId('document-type-selector')).toBeTruthy();
  });

  it('handles batch scan mode', () => {
    const { getByTestId } = render(<HomeScreen {...mockProps} />);
    
    const batchButton = getByTestId('batch-scan-button');
    fireEvent.press(batchButton);
    
    expect(getByTestId('batch-manager')).toBeTruthy();
  });

  it('shows AI insights modal when AI button is pressed', () => {
    const { getByTestId } = render(<HomeScreen {...mockProps} />);
    
    const aiButton = getByTestId('ai-insights-button');
    fireEvent.press(aiButton);
    
    expect(getByTestId('ai-insights-modal')).toBeTruthy();
  });

  it('shows smart organization modal when organize button is pressed', () => {
    const { getByTestId } = render(<HomeScreen {...mockProps} />);
    
    const organizeButton = getByTestId('organize-button');
    fireEvent.press(organizeButton);
    
    expect(getByTestId('smart-organization-modal')).toBeTruthy();
  });

  it('handles empty scanned images state', () => {
    const emptyProps = { ...mockProps, scannedImages: [] };
    const { getByText } = render(<HomeScreen {...emptyProps} />);
    
    expect(getByText('0 Documents')).toBeTruthy();
  });

  it('handles long press on document card', () => {
    const { getByTestId } = render(<HomeScreen {...mockProps} />);
    
    const documentCard = getByTestId('document-card-0');
    fireEvent(documentCard, 'longPress');
    
    expect(getByTestId('selection-mode')).toBeTruthy();
  });
});