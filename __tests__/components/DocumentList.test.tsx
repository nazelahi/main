import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import DocumentList from '../../components/DocumentList';

// Mock the dependencies
jest.mock('expo-media-library', () => ({
  createAssetAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
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
jest.mock('../../components/ImagePreview', () => 'ImagePreview');
jest.mock('../../components/ExportOptionsModal', () => 'ExportOptionsModal');

describe('DocumentList', () => {
  const mockProps = {
    documents: [
      { id: '1', uri: 'file://test1.jpg', name: 'Document 1', date: '2024-01-01' },
      { id: '2', uri: 'file://test2.jpg', name: 'Document 2', date: '2024-01-02' },
    ],
    onDocumentPress: jest.fn(),
    onDocumentDelete: jest.fn(),
    onDocumentEdit: jest.fn(),
    onExportDocuments: jest.fn(),
    onSelectDocument: jest.fn(),
    onDeselectDocument: jest.fn(),
    selectedDocuments: [],
    isSelectionMode: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByTestId } = render(<DocumentList {...mockProps} />);
    
    expect(getByTestId('document-list')).toBeTruthy();
  });

  it('displays document count', () => {
    const { getByText } = render(<DocumentList {...mockProps} />);
    
    expect(getByText('2 Documents')).toBeTruthy();
  });

  it('renders document items', () => {
    const { getByTestId } = render(<DocumentList {...mockProps} />);
    
    expect(getByTestId('document-item-1')).toBeTruthy();
    expect(getByTestId('document-item-2')).toBeTruthy();
  });

  it('calls onDocumentPress when document is pressed', () => {
    const { getByTestId } = render(<DocumentList {...mockProps} />);
    
    const documentItem = getByTestId('document-item-1');
    fireEvent.press(documentItem);
    
    expect(mockProps.onDocumentPress).toHaveBeenCalledWith('1');
  });

  it('calls onDocumentDelete when delete button is pressed', () => {
    const { getByTestId } = render(<DocumentList {...mockProps} />);
    
    const deleteButton = getByTestId('delete-button-1');
    fireEvent.press(deleteButton);
    
    expect(mockProps.onDocumentDelete).toHaveBeenCalledWith('1');
  });

  it('calls onDocumentEdit when edit button is pressed', () => {
    const { getByTestId } = render(<DocumentList {...mockProps} />);
    
    const editButton = getByTestId('edit-button-1');
    fireEvent.press(editButton);
    
    expect(mockProps.onDocumentEdit).toHaveBeenCalledWith('1');
  });

  it('enters selection mode on long press', () => {
    const { getByTestId } = render(<DocumentList {...mockProps} />);
    
    const documentItem = getByTestId('document-item-1');
    fireEvent(documentItem, 'longPress');
    
    expect(getByTestId('selection-mode')).toBeTruthy();
  });

  it('selects multiple images in selection mode', () => {
    const { getByTestId, getAllByTestId, getByText } = render(<DocumentList {...mockProps} />);
    
    // Enter selection mode
    const imageItem = getByTestId('document-item-1');
    fireEvent(imageItem, 'longPress');
    
    // Select multiple images
    const selectButtons = getAllByTestId(/select-button-/);
    fireEvent.press(selectButtons[0]);
    fireEvent.press(selectButtons[1]);
    
    expect(getByText('2 selected')).toBeTruthy();
  });

  it('deletes selected images', async () => {
    const { getByTestId, getAllByTestId, getByText } = render(<DocumentList {...mockProps} />);
    
    // Enter selection mode and select images
    const imageItem = getByTestId('document-item-1');
    fireEvent(imageItem, 'longPress');
    
    const selectButtons = getAllByTestId(/select-button-/);
    fireEvent.press(selectButtons[0]);
    fireEvent.press(selectButtons[1]);
    
    // Delete selected images
    const deleteSelectedButton = getByTestId('delete-selected-button');
    fireEvent.press(deleteSelectedButton);
    
    await waitFor(() => {
      expect(mockProps.onDocumentDelete).toHaveBeenCalledTimes(2);
    });
  });

  it('exports selected documents', () => {
    const { getByTestId } = render(<DocumentList {...mockProps} />);
    
    const exportButton = getByTestId('export-button');
    fireEvent.press(exportButton);
    
    expect(mockProps.onExportDocuments).toHaveBeenCalled();
  });

  it('handles empty documents state', () => {
    const emptyProps = { ...mockProps, documents: [] };
    const { getByText } = render(<DocumentList {...emptyProps} />);
    
    expect(getByText('No documents yet')).toBeTruthy();
  });

  it('shows export options modal when export is pressed', () => {
    const { getByTestId } = render(<DocumentList {...mockProps} />);
    
    const exportButton = getByTestId('export-button');
    fireEvent.press(exportButton);
    
    expect(getByTestId('export-options-modal')).toBeTruthy();
  });

  it('handles document selection in selection mode', () => {
    const { getByTestId } = render(<DocumentList {...mockProps} isSelectionMode={true} />);
    
    const selectButton = getByTestId('select-button-1');
    fireEvent.press(selectButton);
    
    expect(mockProps.onSelectDocument).toHaveBeenCalledWith('1');
  });

  it('handles document deselection in selection mode', () => {
    const { getByTestId } = render(<DocumentList {...mockProps} isSelectionMode={true} selectedDocuments={['1']} />);
    
    const deselectButton = getByTestId('deselect-button-1');
    fireEvent.press(deselectButton);
    
    expect(mockProps.onDeselectDocument).toHaveBeenCalledWith('1');
  });
});
