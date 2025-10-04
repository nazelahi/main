import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

export interface StoredDocument {
  id: string;
  uri: string;
  originalUri: string; // Original file path before processing
  timestamp: number;
  documentType?: string;
  side?: 'front' | 'back' | 'single';
  metadata?: {
    width?: number;
    height?: number;
    fileSize?: number;
    ocrText?: string;
  };
}

const STORAGE_KEYS = {
  DOCUMENTS: 'scanned_documents',
  DOCUMENT_COUNTER: 'document_counter',
} as const;

export class DocumentStorage {
  /**
   * Save a document to persistent storage
   */
  static async saveDocument(document: Omit<StoredDocument, 'id' | 'timestamp'>): Promise<StoredDocument> {
    try {
      // Generate unique ID
      const counter = await this.getDocumentCounter();
      const id = `doc_${Date.now()}_${counter}`;
      
      const storedDocument: StoredDocument = {
        ...document,
        id,
        timestamp: Date.now(),
      };

      // Get existing documents
      const existingDocuments = await this.getAllDocuments();
      
      // Add new document
      const updatedDocuments = [...existingDocuments, storedDocument];
      
      // Save to AsyncStorage
      await AsyncStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(updatedDocuments));
      
      // Update counter
      await AsyncStorage.setItem(STORAGE_KEYS.DOCUMENT_COUNTER, (counter + 1).toString());
      
      console.log('Document saved successfully:', id);
      return storedDocument;
    } catch (_error) {
      console.error('Error saving document:', error);
      throw new Error('Failed to save document');
    }
  }

  /**
   * Get all stored documents
   */
  static async getAllDocuments(): Promise<StoredDocument[]> {
    try {
      const documentsJson = await AsyncStorage.getItem(STORAGE_KEYS.DOCUMENTS);
      if (!documentsJson) {
        return [];
      }
      
      const documents = JSON.parse(documentsJson) as StoredDocument[];
      
      // Filter out documents with invalid URIs (files that may have been deleted)
      const validDocuments = [];
      for (const doc of documents) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(doc.uri);
          if (fileInfo.exists) {
            validDocuments.push(doc);
          } else {
            console.log('Removing invalid document:', doc.id);
          }
        } catch (error) {
          console.log('Error checking document file:', doc.id, error);
          // Keep the document if we can't check the file
          validDocuments.push(doc);
        }
      }
      
      // Update storage if we removed invalid documents
      if (validDocuments.length !== documents.length) {
        await AsyncStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(validDocuments));
      }
      
      return validDocuments;
    } catch (error) {
      console.error('Error loading documents:', error);
      return [];
    }
  }

  /**
   * Get a specific document by ID
   */
  static async getDocument(id: string): Promise<StoredDocument | null> {
    try {
      const documents = await this.getAllDocuments();
      return documents.find(doc => doc.id === id) || null;
    } catch (error) {
      console.error('Error getting document:', error);
      return null;
    }
  }

  /**
   * Delete a document by ID
   */
  static async deleteDocument(id: string): Promise<boolean> {
    try {
      const documents = await this.getAllDocuments();
      const documentToDelete = documents.find(doc => doc.id === id);
      
      if (!documentToDelete) {
        console.log('Document not found:', id);
        return false;
      }

      // Try to delete the actual file
      try {
        const fileInfo = await FileSystem.getInfoAsync(documentToDelete.uri);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(documentToDelete.uri);
          console.log('File deleted:', documentToDelete.uri);
        }
      } catch (fileError) {
        console.log('Error deleting file:', fileError);
        // Continue with removing from storage even if file deletion fails
      }

      // Remove from storage
      const updatedDocuments = documents.filter(doc => doc.id !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(updatedDocuments));
      
      console.log('Document deleted successfully:', id);
      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      return false;
    }
  }

  /**
   * Delete multiple documents by IDs
   */
  static async deleteDocuments(ids: string[]): Promise<{ success: string[], failed: string[] }> {
    const success: string[] = [];
    const failed: string[] = [];

    for (const id of ids) {
      const deleted = await this.deleteDocument(id);
      if (deleted) {
        success.push(id);
      } else {
        failed.push(id);
      }
    }

    return { success, failed };
  }

  /**
   * Clear all documents
   */
  static async clearAllDocuments(): Promise<boolean> {
    try {
      const documents = await this.getAllDocuments();
      
      // Delete all files
      for (const doc of documents) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(doc.uri);
          if (fileInfo.exists) {
            await FileSystem.deleteAsync(doc.uri);
          }
        } catch (error) {
          console.log('Error deleting file:', doc.uri, error);
        }
      }
      
      // Clear storage
      await AsyncStorage.removeItem(STORAGE_KEYS.DOCUMENTS);
      await AsyncStorage.setItem(STORAGE_KEYS.DOCUMENT_COUNTER, '0');
      
      console.log('All documents cleared');
      return true;
    } catch (error) {
      console.error('Error clearing documents:', error);
      return false;
    }
  }

  /**
   * Get document counter for unique IDs
   */
  private static async getDocumentCounter(): Promise<number> {
    try {
      const counter = await AsyncStorage.getItem(STORAGE_KEYS.DOCUMENT_COUNTER);
      return counter ? parseInt(counter, 10) : 0;
    } catch (error) {
      console.error('Error getting document counter:', error);
      return 0;
    }
  }

  /**
   * Get storage statistics
   */
  static async getStorageStats(): Promise<{
    totalDocuments: number;
    totalSize: number;
    oldestDocument?: StoredDocument;
    newestDocument?: StoredDocument;
  }> {
    try {
      const documents = await this.getAllDocuments();
      let totalSize = 0;
      let oldestDocument: StoredDocument | undefined;
      let newestDocument: StoredDocument | undefined;

      for (const doc of documents) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(doc.uri);
          if (fileInfo.exists && fileInfo.size) {
            totalSize += fileInfo.size;
          }
        } catch (error) {
          console.log('Error getting file size for:', doc.id);
        }

        if (!oldestDocument || doc.timestamp < oldestDocument.timestamp) {
          oldestDocument = doc;
        }
        if (!newestDocument || doc.timestamp > newestDocument.timestamp) {
          newestDocument = doc;
        }
      }

      return {
        totalDocuments: documents.length,
        totalSize,
        oldestDocument,
        newestDocument,
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return {
        totalDocuments: 0,
        totalSize: 0,
      };
    }
  }

  /**
   * Update document metadata
   */
  static async updateDocumentMetadata(id: string, metadata: Partial<StoredDocument['metadata']>): Promise<boolean> {
    try {
      const documents = await this.getAllDocuments();
      const documentIndex = documents.findIndex(doc => doc.id === id);
      
      if (documentIndex === -1) {
        return false;
      }

      documents[documentIndex].metadata = {
        ...documents[documentIndex].metadata,
        ...metadata,
      };

      await AsyncStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(documents));
      return true;
    } catch (error) {
      console.error('Error updating document metadata:', error);
      return false;
    }
  }
}