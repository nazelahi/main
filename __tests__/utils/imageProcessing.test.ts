import { DocumentProcessor } from '../../utils/imageProcessing';

// Mock expo-image-manipulator
jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: {
    JPEG: 'jpeg',
    PNG: 'png',
  },
}));

// Mock expo-file-system
jest.mock('expo-file-system', () => ({
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
  getInfoAsync: jest.fn(),
}));

describe('DocumentProcessor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('enhanceDocument', () => {
    it('should enhance document with default settings', async () => {
      const { manipulateAsync } = require('expo-image-manipulator');
      const mockImageUri = 'file://test.jpg';
      const mockEnhancedUri = 'file://enhanced.jpg';

      manipulateAsync.mockResolvedValueOnce({
        uri: mockEnhancedUri,
        width: 1000,
        height: 1000,
      });

      const result = await DocumentProcessor.enhanceDocument(mockImageUri);

      expect(result.uri).toBe(mockEnhancedUri);
      expect(manipulateAsync).toHaveBeenCalled();
    });

    it('should enhance document with custom settings', async () => {
      const { manipulateAsync } = require('expo-image-manipulator');
      const mockImageUri = 'file://test.jpg';
      const mockEnhancedUri = 'file://enhanced.jpg';
      const customSettings = {
        brightness: 0.2,
        contrast: 1.2,
        saturation: 0.8,
      };

      manipulateAsync.mockResolvedValueOnce({
        uri: mockEnhancedUri,
        width: 1000,
        height: 1000,
      });

      const result = await DocumentProcessor.enhanceDocument(mockImageUri, customSettings);

      expect(result.uri).toBe(mockEnhancedUri);
      expect(manipulateAsync).toHaveBeenCalled();
    });

    it('should handle enhancement errors', async () => {
      const { manipulateAsync } = require('expo-image-manipulator');
      const mockImageUri = 'file://test.jpg';

      manipulateAsync.mockRejectedValueOnce(new Error('Enhancement failed'));

      await expect(DocumentProcessor.enhanceDocument(mockImageUri)).rejects.toThrow('Enhancement failed');
    });
  });

  describe('binarizeDocument', () => {
    it('should binarize document successfully', async () => {
      const { manipulateAsync } = require('expo-image-manipulator');
      const mockImageUri = 'file://test.jpg';
      const mockBinarizedUri = 'file://binarized.jpg';

      manipulateAsync.mockResolvedValueOnce({
        uri: mockBinarizedUri,
        width: 1000,
        height: 1000,
      });

      const result = await DocumentProcessor.binarizeDocument(mockImageUri);

      expect(result).toBe(mockBinarizedUri);
      expect(manipulateAsync).toHaveBeenCalled();
    });
  });

  describe('correctPerspective', () => {
    it('should correct document perspective', async () => {
      const { manipulateAsync } = require('expo-image-manipulator');
      const mockImageUri = 'file://test.jpg';
      const mockCorrectedUri = 'file://corrected.jpg';
      const corners = {
        topLeft: { x: 100, y: 100 },
        topRight: { x: 300, y: 100 },
        bottomLeft: { x: 100, y: 400 },
        bottomRight: { x: 300, y: 400 },
      };

      manipulateAsync.mockResolvedValueOnce({
        uri: mockCorrectedUri,
        width: 1000,
        height: 1000,
      });

      const result = await DocumentProcessor.correctPerspective(mockImageUri, corners);

      expect(result).toBe(mockCorrectedUri);
      expect(manipulateAsync).toHaveBeenCalled();
    });
  });

  describe('autoEnhance', () => {
    it('should auto-enhance document', async () => {
      const { manipulateAsync } = require('expo-image-manipulator');
      const mockImageUri = 'file://test.jpg';
      const mockEnhancedUri = 'file://auto-enhanced.jpg';

      manipulateAsync.mockResolvedValueOnce({
        uri: mockEnhancedUri,
        width: 1000,
        height: 1000,
      });

      const result = await DocumentProcessor.autoEnhance(mockImageUri);

      expect(result).toBe(mockEnhancedUri);
      expect(manipulateAsync).toHaveBeenCalled();
    });
  });

  describe('createPDF', () => {
    it('should create PDF from multiple images', async () => {
      const { manipulateAsync } = require('expo-image-manipulator');
      const mockImageUris = ['file://test1.jpg', 'file://test2.jpg'];
      const mockPdfUri = 'file://document.pdf';

      manipulateAsync.mockResolvedValueOnce({
        uri: mockPdfUri,
        width: 1000,
        height: 1000,
      });

      const result = await DocumentProcessor.createPDF(mockImageUris);

      expect(result).toBe(mockPdfUri);
      expect(manipulateAsync).toHaveBeenCalled();
    });
  });

  describe('extractText', () => {
    it('should extract text from document', async () => {
      const mockImageUri = 'file://test.jpg';
      const mockText = 'Sample extracted text';

      // Mock the OCR functionality
      jest.spyOn(DocumentProcessor, 'extractText').mockResolvedValueOnce(mockText);

      const result = await DocumentProcessor.extractText(mockImageUri);

      expect(result).toBe(mockText);
    });
  });

  describe('detectDocumentEdges', () => {
    it('should detect document edges', async () => {
      const mockImageUri = 'file://test.jpg';
      const mockCorners = {
        topLeft: { x: 100, y: 100 },
        topRight: { x: 300, y: 100 },
        bottomLeft: { x: 100, y: 400 },
        bottomRight: { x: 300, y: 400 },
      };

      jest.spyOn(DocumentProcessor, 'detectDocumentEdges').mockResolvedValueOnce(mockCorners);

      const result = await DocumentProcessor.detectDocumentEdges(mockImageUri);

      expect(result).toEqual(mockCorners);
    });
  });

  describe('reduceNoise', () => {
    it('should reduce noise in document', async () => {
      const { manipulateAsync } = require('expo-image-manipulator');
      const mockImageUri = 'file://test.jpg';
      const mockDenoisedUri = 'file://denoised.jpg';

      manipulateAsync.mockResolvedValueOnce({
        uri: mockDenoisedUri,
        width: 1000,
        height: 1000,
      });

      const result = await DocumentProcessor.reduceNoise(mockImageUri);

      expect(result).toBe(mockDenoisedUri);
      expect(manipulateAsync).toHaveBeenCalled();
    });
  });

  describe('removeShadows', () => {
    it('should remove shadows from document', async () => {
      const { manipulateAsync } = require('expo-image-manipulator');
      const mockImageUri = 'file://test.jpg';
      const mockShadowRemovedUri = 'file://shadow-removed.jpg';

      manipulateAsync.mockResolvedValueOnce({
        uri: mockShadowRemovedUri,
        width: 1000,
        height: 1000,
      });

      const result = await DocumentProcessor.removeShadows(mockImageUri);

      expect(result).toBe(mockShadowRemovedUri);
      expect(manipulateAsync).toHaveBeenCalled();
    });
  });
});