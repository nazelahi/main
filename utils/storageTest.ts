import { DocumentStorage, StoredDocument } from './documentStorage';

export const testDocumentPersistence = async (): Promise<void> => {
  try {
    console.log('🧪 Testing Document Persistence...');
    
    // Test 1: Save a test document
    console.log('1. Saving test document...');
    const testDoc = await DocumentStorage.saveDocument({
      uri: 'file://test/document.jpg',
      originalUri: 'file://test/document.jpg',
      documentType: 'test_document',
      side: 'single',
      metadata: {
        fileSize: 1024,
        ocrText: 'Test document content',
      }
    });
    console.log('✅ Test document saved:', testDoc.id);

    // Test 2: Retrieve all documents
    console.log('2. Retrieving all documents...');
    const allDocs = await DocumentStorage.getAllDocuments();
    console.log(`✅ Found ${allDocs.length} documents`);

    // Test 3: Find the test document
    console.log('3. Finding test document...');
    const foundDoc = await DocumentStorage.getDocument(testDoc.id);
    if (foundDoc) {
      console.log('✅ Test document found:', foundDoc.id);
    } else {
      console.log('❌ Test document not found');
    }

    // Test 4: Get storage statistics
    console.log('4. Getting storage statistics...');
    const stats = await DocumentStorage.getStorageStats();
    console.log('✅ Storage stats:', {
      totalDocuments: stats.totalDocuments,
      totalSize: `${Math.round(stats.totalSize / 1024)}KB`,
      oldestDocument: stats.oldestDocument?.timestamp,
      newestDocument: stats.newestDocument?.timestamp,
    });

    // Test 5: Update document metadata
    console.log('5. Updating document metadata...');
    const updateSuccess = await DocumentStorage.updateDocumentMetadata(testDoc.id, {
      ocrText: 'Updated test content',
    });
    console.log(updateSuccess ? '✅ Metadata updated' : '❌ Failed to update metadata');

    // Test 6: Delete the test document
    console.log('6. Deleting test document...');
    const deleteSuccess = await DocumentStorage.deleteDocument(testDoc.id);
    console.log(deleteSuccess ? '✅ Test document deleted' : '❌ Failed to delete test document');

    // Test 7: Verify deletion
    console.log('7. Verifying deletion...');
    const remainingDocs = await DocumentStorage.getAllDocuments();
    const testDocStillExists = remainingDocs.some(doc => doc.id === testDoc.id);
    console.log(testDocStillExists ? '❌ Test document still exists' : '✅ Test document successfully deleted');

    console.log('🎉 Document persistence test completed!');
    
  } catch (error) {
    console.error('❌ Document persistence test failed:', error);
    throw error;
  }
};

export const clearAllTestData = async (): Promise<void> => {
  try {
    console.log('🧹 Clearing all test data...');
    const success = await DocumentStorage.clearAllDocuments();
    console.log(success ? '✅ All documents cleared' : '❌ Failed to clear documents');
  } catch (error) {
    console.error('❌ Failed to clear test data:', error);
    throw error;
  }
};

export const showStorageInfo = async (): Promise<string> => {
  try {
    const stats = await DocumentStorage.getStorageStats();
    const allDocs = await DocumentStorage.getAllDocuments();
    
    const info = `
📊 Storage Information:
• Total Documents: ${stats.totalDocuments}
• Total Size: ${Math.round(stats.totalSize / 1024)}KB
• Oldest Document: ${stats.oldestDocument ? new Date(stats.oldestDocument.timestamp).toLocaleString() : 'None'}
• Newest Document: ${stats.newestDocument ? new Date(stats.newestDocument.timestamp).toLocaleString() : 'None'}

📋 Document List:
${allDocs.map((doc, index) => 
  `${index + 1}. ${doc.id} (${doc.documentType}) - ${new Date(doc.timestamp).toLocaleString()}`
).join('\n')}
    `.trim();
    
    console.log(info);
    return info;
  } catch (error) {
    console.error('❌ Failed to get storage info:', error);
    return 'Failed to get storage information';
  }
};