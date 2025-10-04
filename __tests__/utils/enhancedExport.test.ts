// Enhanced Export Tests
import { EnhancedExporter, shareExport, saveExportToGallery, getSupportedFormats } from '../../utils/enhancedExport';

// Mock the required modules
jest.mock('expo-file-system', () => ({
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  getInfoAsync: jest.fn().mockResolvedValue({ exists: true, size: 1024 }),
  documentDirectory: 'file:///mock/documents/',
  EncodingType: {
    UTF8: 'utf8'
  }
}));

jest.mock('expo-media-library', () => ({
  createAssetAsync: jest.fn().mockResolvedValue({ uri: 'mock-asset-uri' }),
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-print', () => ({
  printToFileAsync: jest.fn().mockResolvedValue({ uri: 'mock-pdf-uri' }),
}));

describe('EnhancedExporter', () => {
  let exporter: EnhancedExporter;
  const mockDocuments = [
    {
      id: 'doc1',
      uri: 'file://mock/image1.jpg',
      title: 'Test Document 1',
      timestamp: Date.now(),
      metadata: {
        fileSize: 1024,
        dimensions: { width: 1200, height: 1600 },
        quality: 0.8
      }
    },
    {
      id: 'doc2',
      uri: 'file://mock/image2.jpg',
      title: 'Test Document 2',
      timestamp: Date.now(),
      metadata: {
        fileSize: 2048,
        dimensions: { width: 1200, height: 1600 },
        quality: 0.9
      }
    }
  ];

  beforeEach(() => {
    exporter = EnhancedExporter.getInstance();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = EnhancedExporter.getInstance();
      const instance2 = EnhancedExporter.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('exportDocuments', () => {
    it('should export documents in PDF format', async () => {
      const options = {
        format: 'pdf' as const,
        quality: 'high' as const,
        includeImages: true,
        includeOCR: true,
        includeTables: true,
        includeEntities: true,
        includeMetadata: true,
        title: 'Test Export',
      };

      const result = await exporter.exportDocuments(mockDocuments, options);

      expect(result).toBeDefined();
      expect(result.format).toBe('pdf');
      expect(result.filename).toContain('.pdf');
      expect(result.mimeType).toBe('application/pdf');
      expect(result.size).toBeGreaterThan(0);
    });

    it('should export documents in Word format', async () => {
      const options = {
        format: 'docx' as const,
        quality: 'high' as const,
        includeImages: false,
        includeOCR: true,
        includeTables: true,
        includeEntities: true,
        includeMetadata: true,
        title: 'Test Export',
      };

      const result = await exporter.exportDocuments(mockDocuments, options);

      expect(result).toBeDefined();
      expect(result.format).toBe('docx');
      expect(result.filename).toContain('.docx');
      expect(result.mimeType).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    });

    it('should export documents in Excel format', async () => {
      const options = {
        format: 'xlsx' as const,
        quality: 'high' as const,
        includeImages: false,
        includeOCR: true,
        includeTables: true,
        includeEntities: true,
        includeMetadata: true,
        title: 'Test Export',
      };

      const result = await exporter.exportDocuments(mockDocuments, options);

      expect(result).toBeDefined();
      expect(result.format).toBe('xlsx');
      expect(result.filename).toContain('.xlsx');
      expect(result.mimeType).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    });

    it('should export documents in PowerPoint format', async () => {
      const options = {
        format: 'pptx' as const,
        quality: 'high' as const,
        includeImages: false,
        includeOCR: true,
        includeTables: false,
        includeEntities: false,
        includeMetadata: true,
        title: 'Test Export',
      };

      const result = await exporter.exportDocuments(mockDocuments, options);

      expect(result).toBeDefined();
      expect(result.format).toBe('pptx');
      expect(result.filename).toContain('.pptx');
      expect(result.mimeType).toBe('application/vnd.openxmlformats-officedocument.presentationml.presentation');
    });

    it('should export documents in text format', async () => {
      const options = {
        format: 'txt' as const,
        quality: 'high' as const,
        includeImages: false,
        includeOCR: true,
        includeTables: false,
        includeEntities: false,
        includeMetadata: true,
        title: 'Test Export',
      };

      const result = await exporter.exportDocuments(mockDocuments, options);

      expect(result).toBeDefined();
      expect(result.format).toBe('txt');
      expect(result.filename).toContain('.txt');
      expect(result.mimeType).toBe('text/plain');
    });

    it('should export documents in CSV format', async () => {
      const options = {
        format: 'csv' as const,
        quality: 'high' as const,
        includeImages: false,
        includeOCR: true,
        includeTables: true,
        includeEntities: true,
        includeMetadata: true,
        title: 'Test Export',
      };

      const result = await exporter.exportDocuments(mockDocuments, options);

      expect(result).toBeDefined();
      expect(result.format).toBe('csv');
      expect(result.filename).toContain('.csv');
      expect(result.mimeType).toBe('text/csv');
    });

    it('should export documents in JSON format', async () => {
      const options = {
        format: 'json' as const,
        quality: 'high' as const,
        includeImages: false,
        includeOCR: true,
        includeTables: true,
        includeEntities: true,
        includeMetadata: true,
        title: 'Test Export',
      };

      const result = await exporter.exportDocuments(mockDocuments, options);

      expect(result).toBeDefined();
      expect(result.format).toBe('json');
      expect(result.filename).toContain('.json');
      expect(result.mimeType).toBe('application/json');
    });

    it('should export documents in HTML format', async () => {
      const options = {
        format: 'html' as const,
        quality: 'high' as const,
        includeImages: true,
        includeOCR: true,
        includeTables: true,
        includeEntities: true,
        includeMetadata: true,
        title: 'Test Export',
      };

      const result = await exporter.exportDocuments(mockDocuments, options);

      expect(result).toBeDefined();
      expect(result.format).toBe('html');
      expect(result.filename).toContain('.html');
      expect(result.mimeType).toBe('text/html');
    });

    it('should throw error for unsupported format', async () => {
      const options = {
        format: 'unsupported' as any,
        quality: 'high' as const,
      };

      await expect(exporter.exportDocuments(mockDocuments, options))
        .rejects.toThrow('Unsupported export format: unsupported');
    });
  });

  describe('Error Handling', () => {
    it('should handle export errors gracefully', async () => {
      // Mock an error in the file system
      const mockWriteAsStringAsync = require('expo-file-system').writeAsStringAsync;
      mockWriteAsStringAsync.mockRejectedValueOnce(new Error('Write failed'));

      const options = {
        format: 'txt' as const,
        quality: 'high' as const,
      };

      await expect(exporter.exportDocuments(mockDocuments, options))
        .rejects.toThrow('Failed to export documents: Error: Write failed');
    });
  });
});

describe('Export Utility Functions', () => {
  const mockExportResult = {
    uri: 'file://mock/export.pdf',
    filename: 'test.pdf',
    format: 'pdf',
    size: 1024,
    mimeType: 'application/pdf'
  };

  describe('shareExport', () => {
    it('should share export successfully', async () => {
      await expect(shareExport(mockExportResult)).resolves.not.toThrow();
    });

    it('should handle sharing errors', async () => {
      const mockShareAsync = require('expo-sharing').shareAsync;
      mockShareAsync.mockRejectedValueOnce(new Error('Share failed'));

      await expect(shareExport(mockExportResult))
        .rejects.toThrow('Failed to share export: Error: Share failed');
    });

    it('should handle sharing not available', async () => {
      const mockIsAvailableAsync = require('expo-sharing').isAvailableAsync;
      mockIsAvailableAsync.mockResolvedValueOnce(false);

      await expect(shareExport(mockExportResult))
        .rejects.toThrow('Failed to share export: Error: Sharing is not available on this device');
    });
  });

  describe('saveExportToGallery', () => {
    it('should save export to gallery successfully', async () => {
      const result = await saveExportToGallery(mockExportResult);
      expect(result).toBe('mock-asset-uri');
    });

    it('should handle save errors', async () => {
      const mockCreateAssetAsync = require('expo-media-library').createAssetAsync;
      mockCreateAssetAsync.mockRejectedValueOnce(new Error('Save failed'));

      await expect(saveExportToGallery(mockExportResult))
        .rejects.toThrow('Failed to save export to gallery: Error: Save failed');
    });
  });

  describe('getSupportedFormats', () => {
    it('should return all supported formats', () => {
      const formats = getSupportedFormats();
      
      expect(formats).toHaveLength(8);
      expect(formats).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ format: 'pdf', name: 'PDF Document' }),
          expect.objectContaining({ format: 'docx', name: 'Word Document' }),
          expect.objectContaining({ format: 'xlsx', name: 'Excel Spreadsheet' }),
          expect.objectContaining({ format: 'pptx', name: 'PowerPoint Presentation' }),
          expect.objectContaining({ format: 'txt', name: 'Plain Text' }),
          expect.objectContaining({ format: 'csv', name: 'CSV File' }),
          expect.objectContaining({ format: 'json', name: 'JSON File' }),
          expect.objectContaining({ format: 'html', name: 'HTML Document' }),
        ])
      );
    });
  });
});

describe('Export Content Generation', () => {
  let exporter: EnhancedExporter;

  beforeEach(() => {
    exporter = EnhancedExporter.getInstance();
  });

  const mockDocumentsWithOCR = [
    {
      id: 'doc1',
      uri: 'file://mock/image1.jpg',
      title: 'Test Document 1',
      timestamp: Date.now(),
      ocrResult: {
        text: 'Sample text content',
        confidence: 0.9,
        boundingBoxes: [],
        language: 'en',
        processingTime: 1000,
        handwriting: {
          text: 'Sample text',
          confidence: 0.8,
          isHandwritten: false,
          boundingBoxes: [],
          language: 'en'
        },
        tables: {
          tables: [],
          confidence: 0,
          processingTime: 0
        },
        structure: {
          paragraphs: ['Sample text content'],
          tables: [],
          lists: [],
          headers: [],
          footers: [],
          confidence: 0.8
        },
        entities: []
      },
      metadata: {
        fileSize: 1024,
        dimensions: { width: 1200, height: 1600 },
        quality: 0.8
      }
    }
  ];

  it('should generate PDF content with OCR data', async () => {
    const options = {
      format: 'pdf' as const,
      includeOCR: true,
      includeImages: true,
      includeTables: true,
      includeEntities: true,
    };

    const result = await exporter.exportDocuments(mockDocumentsWithOCR, options);
    expect(result.format).toBe('pdf');
  });

  it('should generate Word content with OCR data', async () => {
    const options = {
      format: 'docx' as const,
      includeOCR: true,
      includeImages: false,
      includeTables: true,
      includeEntities: true,
    };

    const result = await exporter.exportDocuments(mockDocumentsWithOCR, options);
    expect(result.format).toBe('docx');
  });

  it('should generate Excel content with table data', async () => {
    const options = {
      format: 'xlsx' as const,
      includeOCR: true,
      includeTables: true,
      includeEntities: true,
    };

    const result = await exporter.exportDocuments(mockDocumentsWithOCR, options);
    expect(result.format).toBe('xlsx');
  });
});