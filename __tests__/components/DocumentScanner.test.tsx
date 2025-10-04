import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import DocumentScanner from '../../components/DocumentScanner';

// Mock the dependencies
jest.mock('expo-camera', () => ({
  CameraView: 'CameraView',
  CameraType: {
    back: 'back',
    front: 'front',
  },
  useCameraPermissions: jest.fn(() => [{ granted: true }, jest.fn()]),
}));

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: {
    JPEG: 'jpeg',
  },
}));

jest.mock('expo-file-system', () => ({
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
}));

jest.mock('expo-linear-gradient', () => 'LinearGradient');
jest.mock('expo-blur', () => 'BlurView');
jest.mock('@expo/vector-icons', () => 'Ionicons');

// Mock utility functions
jest.mock('../../utils/smartDetection', () => ({
  SmartDetectionEngine: {
    getInstance: jest.fn(() => ({
      detectDocument: jest.fn().mockResolvedValue({
        topLeft: { x: 100, y: 100 },
        topRight: { x: 300, y: 100 },
        bottomLeft: { x: 100, y: 400 },
        bottomRight: { x: 300, y: 400 },
      }),
    })),
  },
}));

jest.mock('../../utils/scanQualityAssessment', () => ({
  ScanQualityAssessment: {
    getInstance: jest.fn(() => ({
      assessScanQuality: jest.fn().mockResolvedValue({
        overallScore: 85,
        isReady: true,
        issues: [],
        guidance: 'Good scan quality',
      }),
    })),
  },
}));

describe('DocumentScanner', () => {
  const mockProps = {
    visible: true,
    mode: 'manual',
    onDocumentScanned: jest.fn(),
    onClose: jest.fn(),
    isScanning: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when visible', () => {
    const { getByTestId } = render(<DocumentScanner {...mockProps} />);
    
    expect(getByTestId('document-scanner')).toBeTruthy();
  });

  it('does not render when not visible', () => {
    const { queryByTestId } = render(<DocumentScanner {...mockProps} visible={false} />);
    
    expect(queryByTestId('document-scanner')).toBeNull();
  });

  it('shows camera view when visible', () => {
    const { getByTestId } = render(<DocumentScanner {...mockProps} />);
    
    expect(getByTestId('camera-view')).toBeTruthy();
  });

  it('handles capture button press', async () => {
    const { getByTestId } = render(<DocumentScanner {...mockProps} />);
    
    const captureButton = getByTestId('capture-button');
    fireEvent.press(captureButton);
    
    await waitFor(() => {
      expect(mockProps.onDocumentScanned).toHaveBeenCalled();
    });
  });

  it('handles close button press', () => {
    const { getByTestId } = render(<DocumentScanner {...mockProps} />);
    
    const closeButton = getByTestId('close-button');
    fireEvent.press(closeButton);
    
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('shows scanning indicator when scanning', () => {
    const { getByTestId } = render(<DocumentScanner {...mockProps} isScanning={true} />);
    
    expect(getByTestId('scanning-indicator')).toBeTruthy();
  });

  it('handles auto mode correctly', async () => {
    const { getByTestId } = render(<DocumentScanner {...mockProps} mode="auto" />);
    
    // Auto mode should trigger capture automatically
    await waitFor(() => {
      expect(mockProps.onDocumentScanned).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('shows quality guidance when available', async () => {
    const { getByTestId } = render(<DocumentScanner {...mockProps} />);
    
    // Simulate quality assessment
    await waitFor(() => {
      expect(getByTestId('quality-guidance')).toBeTruthy();
    });
  });

  it('handles document detection', async () => {
    const { getByTestId } = render(<DocumentScanner {...mockProps} />);
    
    // Simulate document detection
    await waitFor(() => {
      expect(getByTestId('document-corners')).toBeTruthy();
    });
  });

  it('shows retry button when scan fails', async () => {
    const { getByTestId } = render(<DocumentScanner {...mockProps} />);
    
    // Simulate scan failure
    const captureButton = getByTestId('capture-button');
    fireEvent.press(captureButton);
    
    await waitFor(() => {
      expect(getByTestId('retry-button')).toBeTruthy();
    });
  });
});