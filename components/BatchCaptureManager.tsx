import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
  Animated,
  FlatList,
  Image,
  Alert,
  Vibration,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { DocumentCorners } from '../utils/enhancedEdgeDetection';
import { AdvancedImageCapture, CaptureResult, BatchCaptureSession } from '../utils/advancedImageCapture';
import { AdvancedImageProcessor } from '../utils/imageProcessingAdvanced';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface BatchCaptureManagerProps {
  visible: boolean;
  onBatchComplete: (results: CaptureResult[]) => void;
  onClose: () => void;
  maxDocuments?: number;
  documentType?: string;
  autoProcessing?: boolean;
}

interface DocumentItem {
  id: string;
  uri: string;
  corners?: DocumentCorners | null;
  timestamp: number;
  status: 'captured' | 'processing' | 'completed' | 'error';
  result?: CaptureResult;
  error?: string;
}

const BatchCaptureManager: React.FC<BatchCaptureManagerProps> = ({
  visible,
  onBatchComplete,
  onClose,
  maxDocuments = 10,
  documentType = 'Document',
  autoProcessing = true,
}) => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [currentSession, setCurrentSession] = useState<BatchCaptureSession | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentItem | null>(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // Services
  const captureService = useRef(AdvancedImageCapture.getInstance()).current;
  const processorService = useRef(AdvancedImageProcessor.getInstance()).current;

  useEffect(() => {
    if (visible) {
      startAnimations();
      startNewSession();
    } else {
      stopAnimations();
      if (currentSession) {
        captureService.cancelBatchSession();
      }
    }

    return () => {
      stopAnimations();
    };
  }, [visible]);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const stopAnimations = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(50);
    scaleAnim.setValue(0.9);
  };

  const startNewSession = () => {
    const session = captureService.startBatchSession();
    setCurrentSession(session);
    setDocuments([]);
    console.log('Started new batch capture session');
  };

  const addDocument = async (imageUri: string, corners?: DocumentCorners | null) => {
    if (documents.length >= maxDocuments) {
      Alert.alert('Limit Reached', `Maximum ${maxDocuments} documents allowed per batch.`);
      return;
    }

    const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newDocument: DocumentItem = {
      id: documentId,
      uri: imageUri,
      corners: corners,
      timestamp: Date.now(),
      status: 'captured',
    };

    setDocuments(prev => [...prev, newDocument]);

    if (autoProcessing) {
      await processDocument(newDocument);
    }

    // Haptic feedback
    Vibration.vibrate(100);
  };

  const processDocument = async (document: DocumentItem) => {
    try {
      setDocuments(prev => 
        prev.map(doc => 
          doc.id === document.id 
            ? { ...doc, status: 'processing' }
            : doc
        )
      );

      const result = await captureService.addDocumentToBatch(
        document.uri,
        document.corners,
        {
          quality: 0.9,
          maxWidth: 2048,
          maxHeight: 2048,
          format: 'jpeg',
          compression: 0.8,
        },
        {
          perspectiveCorrection: true,
          autoCrop: true,
          autoRotate: true,
          enhanceContrast: true,
          removeShadows: true,
          sharpen: true,
        }
      );

      setDocuments(prev => 
        prev.map(doc => 
          doc.id === document.id 
            ? { ...doc, status: 'completed', result: result }
            : doc
        )
      );

      console.log(`Document ${document.id} processed successfully`);
    } catch (error) {
      console.error(`Failed to process document ${document.id}:`, error);
      setDocuments(prev => 
        prev.map(doc => 
          doc.id === document.id 
            ? { ...doc, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' }
            : doc
        )
      );
    }
  };

  const reprocessDocument = async (document: DocumentItem) => {
    await processDocument(document);
  };

  const removeDocument = (documentId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== documentId));
    Vibration.vibrate(50);
  };

  const completeBatch = async () => {
    if (documents.length === 0) {
      Alert.alert('No Documents', 'Please capture at least one document before completing the batch.');
      return;
    }

    try {
      setIsProcessing(true);

      // Process any remaining unprocessed documents
      const unprocessedDocs = documents.filter(doc => doc.status === 'captured');
      for (const doc of unprocessedDocs) {
        await processDocument(doc);
      }

      // Wait a moment for processing to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get completed results
      const completedResults = documents
        .filter(doc => doc.status === 'completed' && doc.result)
        .map(doc => doc.result!);

      if (completedResults.length === 0) {
        Alert.alert('No Valid Documents', 'No documents were successfully processed.');
        return;
      }

      // Complete the batch session
      const session = captureService.completeBatchSession();
      
      // Haptic feedback
      Vibration.vibrate(200);

      // Notify parent component
      onBatchComplete(completedResults);

      console.log(`Batch completed with ${completedResults.length} documents`);
    } catch (error) {
      console.error('Failed to complete batch:', error);
      Alert.alert('Error', 'Failed to complete batch processing.');
    } finally {
      setIsProcessing(false);
    }
  };

  const clearBatch = () => {
    Alert.alert(
      'Clear Batch',
      'Are you sure you want to clear all captured documents?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            setDocuments([]);
            startNewSession();
            Vibration.vibrate(100);
          },
        },
      ]
    );
  };

  const showDocumentPreview = (document: DocumentItem) => {
    setSelectedDocument(document);
    setShowPreview(true);
  };

  const getStatusIcon = (status: DocumentItem['status']) => {
    switch (status) {
      case 'captured':
        return 'checkmark-circle';
      case 'processing':
        return 'hourglass';
      case 'completed':
        return 'checkmark-circle';
      case 'error':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const getStatusColor = (status: DocumentItem['status']) => {
    switch (status) {
      case 'captured':
        return '#4CAF50';
      case 'processing':
        return '#FF9800';
      case 'completed':
        return '#2196F3';
      case 'error':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const renderDocumentItem = ({ item: document }: { item: DocumentItem }) => (
    <Animated.View style={[styles.documentItem, { opacity: fadeAnim }]}>
      <TouchableOpacity
        style={styles.documentImageContainer}
        onPress={() => showDocumentPreview(document)}
      >
        <Image source={{ uri: document.uri }} style={styles.documentImage} />
        <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(document.status) }]}>
          <Ionicons name={getStatusIcon(document.status)} size={16} color="white" />
        </View>
      </TouchableOpacity>

      <View style={styles.documentInfo}>
        <Text style={styles.documentNumber}>
          Document {documents.indexOf(document) + 1}
        </Text>
        <Text style={styles.documentTime}>
          {new Date(document.timestamp).toLocaleTimeString()}
        </Text>
        {document.status === 'error' && document.error && (
          <Text style={styles.errorText}>{document.error}</Text>
        )}
        {document.result && (
          <Text style={styles.fileSizeText}>
            {(document.result.fileSize / 1024).toFixed(1)} KB
          </Text>
        )}
      </View>

      <View style={styles.documentActions}>
        {document.status === 'error' && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => reprocessDocument(document)}
          >
            <Ionicons name="refresh" size={16} color="#4CAF50" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => removeDocument(document.id)}
        >
          <Ionicons name="trash" size={16} color="#F44336" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderHeader = () => (
    <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
      <LinearGradient
        colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.6)']}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Batch Capture</Text>
            <Text style={styles.headerSubtitle}>
              {documents.length}/{maxDocuments} documents
            </Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerButton} onPress={clearBatch}>
              <Ionicons name="trash" size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={onClose}>
              <Ionicons name="close" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  const renderFooter = () => (
    <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
      <LinearGradient
        colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.6)']}
        style={styles.footerGradient}
      >
        <View style={styles.footerContent}>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearBatch}
            disabled={documents.length === 0}
          >
            <LinearGradient
              colors={documents.length === 0 ? ['#666', '#555'] : ['#F44336', '#D32F2F']}
              style={styles.clearButtonGradient}
            >
              <Ionicons name="trash" size={16} color="white" />
              <Text style={styles.clearButtonText}>Clear All</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.completeButton}
            onPress={completeBatch}
            disabled={documents.length === 0 || isProcessing}
          >
            <LinearGradient
              colors={
                documents.length === 0 || isProcessing
                  ? ['#666', '#555']
                  : ['#4CAF50', '#45a049']
              }
              style={styles.completeButtonGradient}
            >
              <Ionicons 
                name={isProcessing ? "hourglass" : "checkmark"} 
                size={16} 
                color="white" 
              />
              <Text style={styles.completeButtonText}>
                {isProcessing ? 'Processing...' : 'Complete Batch'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  const renderDocumentPreview = () => (
    <Modal
      visible={showPreview}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => setShowPreview(false)}
    >
      <View style={styles.previewContainer}>
        <View style={styles.previewHeader}>
          <TouchableOpacity
            style={styles.previewCloseButton}
            onPress={() => setShowPreview(false)}
          >
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.previewTitle}>Document Preview</Text>
        </View>
        
        {selectedDocument && (
          <View style={styles.previewContent}>
            <Image
              source={{ uri: selectedDocument.uri }}
              style={styles.previewImage}
              resizeMode="contain"
            />
            <View style={styles.previewInfo}>
              <Text style={styles.previewInfoText}>
                Status: {selectedDocument.status}
              </Text>
              <Text style={styles.previewInfoText}>
                Size: {selectedDocument.result ? `${(selectedDocument.result.fileSize / 1024).toFixed(1)} KB` : 'N/A'}
              </Text>
              <Text style={styles.previewInfoText}>
                Dimensions: {selectedDocument.result ? `${selectedDocument.result.width}x${selectedDocument.result.height}` : 'N/A'}
              </Text>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        {renderHeader()}
        
        <View style={styles.content}>
          {documents.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document" size={64} color="rgba(255,255,255,0.3)" />
              <Text style={styles.emptyStateTitle}>No Documents Captured</Text>
              <Text style={styles.emptyStateSubtitle}>
                Start capturing documents to begin your batch
              </Text>
            </View>
          ) : (
            <FlatList
              data={documents}
              renderItem={renderDocumentItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.documentsList}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        {renderFooter()}
        {renderDocumentPreview()}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  content: {
    flex: 1,
    paddingTop: 100,
    paddingBottom: 120,
  },
  documentsList: {
    padding: 20,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  documentImageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  documentImage: {
    width: 60,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  statusIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentInfo: {
    flex: 1,
  },
  documentNumber: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  documentTime: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 2,
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 2,
  },
  fileSizeText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    marginTop: 2,
  },
  documentActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  footerGradient: {
    paddingBottom: 20,
    paddingTop: 16,
    paddingHorizontal: 20,
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clearButton: {
    flex: 1,
    marginRight: 8,
  },
  clearButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  completeButton: {
    flex: 2,
    marginLeft: 8,
  },
  completeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  completeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  previewCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  previewTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  previewContent: {
    flex: 1,
    padding: 20,
  },
  previewImage: {
    flex: 1,
    width: '100%',
  },
  previewInfo: {
    marginTop: 16,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
  },
  previewInfoText: {
    color: 'white',
    fontSize: 14,
    marginBottom: 4,
  },
});

export default BatchCaptureManager;
