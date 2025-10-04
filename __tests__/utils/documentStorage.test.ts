import { DocumentStorage, StoredDocument } from '../../utils/documentStorage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
}));

describe('DocumentStorage', () => {
  const mockDocument: Omit<StoredDocument, 'id' | 'timestamp'> = {
    uri: 'file://test.jpg',
    name: 'Test Document',
    type: 'invoice',
    metadata: {
      size: 1024,
      width: 1000,
      height: 1000,
      quality: 0.8,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveDocument', () => {
    it('should save document successfully', async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      AsyncStorage.setItem.mockResolvedValueOnce(undefined);
      AsyncStorage.getItem.mockResolvedValueOnce('[]');

      const result = await DocumentStorage.saveDocument(mockDocument);

      expect(result.uri).toBe(mockDocument.uri);
      expect(result.name).toBe(mockDocument.name);
      expect(result.type).toBe(mockDocument.type);
      expect(result.id).toBeDefined();
      expect(result.timestamp).toBeDefined();
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should handle save errors gracefully', async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      AsyncStorage.setItem.mockRejectedValueOnce(new Error('Storage error'));

      await expect(DocumentStorage.saveDocument(mockDocument)).rejects.toThrow();
    });
  });

  describe('getAllDocuments', () => {
    it('should return empty array when no documents exist', async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      AsyncStorage.getItem.mockResolvedValueOnce(null);

      const documents = await DocumentStorage.getAllDocuments();
      expect(documents).toEqual([]);
    });

    it('should return documents when they exist', async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const mockDocuments = [
        {
          id: '1',
          uri: 'file://test1.jpg',
          name: 'Test Document 1',
          type: 'invoice',
          timestamp: Date.now(),
          metadata: { size: 1024, width: 1000, height: 1000, quality: 0.8 },
        },
        {
          id: '2',
          uri: 'file://test2.jpg',
          name: 'Test Document 2',
          type: 'receipt',
          timestamp: Date.now(),
          metadata: { size: 2048, width: 2000, height: 2000, quality: 0.9 },
        },
      ];

      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(mockDocuments));

      const documents = await DocumentStorage.getAllDocuments();
      expect(documents).toEqual(mockDocuments);
    });
  });

  describe('getDocument', () => {
    it('should return document when found', async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const mockDocument = {
        id: '1',
        uri: 'file://test.jpg',
        name: 'Test Document',
        type: 'invoice',
        timestamp: Date.now(),
        metadata: { size: 1024, width: 1000, height: 1000, quality: 0.8 },
      };

      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify([mockDocument]));

      const result = await DocumentStorage.getDocument('1');
      expect(result).toEqual(mockDocument);
    });

    it('should return null when document not found', async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify([]));

      const result = await DocumentStorage.getDocument('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('deleteDocument', () => {
    it('should delete document successfully', async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const mockDocuments = [
        {
          id: '1',
          uri: 'file://test1.jpg',
          name: 'Test Document 1',
          type: 'invoice',
          timestamp: Date.now(),
          metadata: { size: 1024, width: 1000, height: 1000, quality: 0.8 },
        },
        {
          id: '2',
          uri: 'file://test2.jpg',
          name: 'Test Document 2',
          type: 'receipt',
          timestamp: Date.now(),
          metadata: { size: 2048, width: 2000, height: 2000, quality: 0.9 },
        },
      ];

      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(mockDocuments));
      AsyncStorage.setItem.mockResolvedValueOnce(undefined);

      const result = await DocumentStorage.deleteDocument('1');
      expect(result).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should return false when document not found', async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify([]));

      const result = await DocumentStorage.deleteDocument('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('deleteDocuments', () => {
    it('should delete multiple documents successfully', async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const mockDocuments = [
        {
          id: '1',
          uri: 'file://test1.jpg',
          name: 'Test Document 1',
          type: 'invoice',
          timestamp: Date.now(),
          metadata: { size: 1024, width: 1000, height: 1000, quality: 0.8 },
        },
        {
          id: '2',
          uri: 'file://test2.jpg',
          name: 'Test Document 2',
          type: 'receipt',
          timestamp: Date.now(),
          metadata: { size: 2048, width: 2000, height: 2000, quality: 0.9 },
        },
        {
          id: '3',
          uri: 'file://test3.jpg',
          name: 'Test Document 3',
          type: 'contract',
          timestamp: Date.now(),
          metadata: { size: 4096, width: 3000, height: 3000, quality: 0.95 },
        },
      ];

      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(mockDocuments));
      AsyncStorage.setItem.mockResolvedValueOnce(undefined);

      const result = await DocumentStorage.deleteDocuments(['1', '3']);
      expect(result.success).toEqual(['1', '3']);
      expect(result.failed).toEqual([]);
    });
  });

  describe('clearAllDocuments', () => {
    it('should clear all documents', async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      AsyncStorage.clear.mockResolvedValueOnce(undefined);

      const result = await DocumentStorage.clearAllDocuments();
      expect(result).toBe(true);
      expect(AsyncStorage.clear).toHaveBeenCalled();
    });
  });

  describe('getStorageStats', () => {
    it('should return storage statistics', async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const mockDocuments = [
        {
          id: '1',
          uri: 'file://test1.jpg',
          name: 'Test Document 1',
          type: 'invoice',
          timestamp: Date.now(),
          metadata: { size: 1024, width: 1000, height: 1000, quality: 0.8 },
        },
        {
          id: '2',
          uri: 'file://test2.jpg',
          name: 'Test Document 2',
          type: 'receipt',
          timestamp: Date.now(),
          metadata: { size: 2048, width: 2000, height: 2000, quality: 0.9 },
        },
      ];

      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(mockDocuments));

      const stats = await DocumentStorage.getStorageStats();
      expect(stats.totalDocuments).toBe(2);
      expect(stats.totalSize).toBe(3072); // 1024 + 2048
      expect(stats.documentTypes).toEqual({ invoice: 1, receipt: 1 });
    });
  });

  describe('updateDocumentMetadata', () => {
    it('should update document metadata successfully', async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const mockDocuments = [
        {
          id: '1',
          uri: 'file://test1.jpg',
          name: 'Test Document 1',
          type: 'invoice',
          timestamp: Date.now(),
          metadata: { size: 1024, width: 1000, height: 1000, quality: 0.8 },
        },
      ];

      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(mockDocuments));
      AsyncStorage.setItem.mockResolvedValueOnce(undefined);

      const result = await DocumentStorage.updateDocumentMetadata('1', { quality: 0.9 });
      expect(result).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should return false when document not found', async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify([]));

      const result = await DocumentStorage.updateDocumentMetadata('nonexistent', { quality: 0.9 });
      expect(result).toBe(false);
    });
  });
});