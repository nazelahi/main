import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, Alert, AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Camera } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import * as MediaLibrary from 'expo-media-library';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import ImagePreview from './components/ImagePreview';
import DocumentList from './components/DocumentList';
import HomeScreen from './components/HomeScreen';
import AdvancedOCRPreview from './components/AdvancedOCRPreview';
import UnifiedCameraScanner from './components/UnifiedCameraScanner';
import { handleError, withErrorHandling } from './utils/errorHandler';
import { getAppConfig } from './config/appConfig';
import { terminateOCREngine } from './utils/ocr';
import { DocumentStorage, StoredDocument } from './utils/documentStorage';
import { DesignSystem, createGradientStyle, createTextStyle } from './config/designSystem';

export default function App() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [currentScreen, setCurrentScreen] = useState<'home' | 'preview' | 'list' | 'advancedOCR' | 'camera'>('home');
  const [cameraMode, setCameraMode] = useState<'quick' | 'batch' | 'smart'>('quick');
  const [scannedDocuments, setScannedDocuments] = useState<StoredDocument[]>([]);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [appConfig] = useState(getAppConfig());
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'background') {
        // Clean up resources when app goes to background
        cleanupResources();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [cleanupResources]);

  const initializeApp = withErrorHandling(async () => {
    try {
      await getPermissions();
      await loadStoredDocuments();
      setIsInitialized(true);
    } catch (error) {
      handleError(error as Error, 'initializeApp');
      setIsInitialized(true); // Still allow app to run
    }
  }, 'initializeApp');

  const loadStoredDocuments = withErrorHandling(async () => {
    try {
      setIsLoadingDocuments(true);
      const documents = await DocumentStorage.getAllDocuments();
      setScannedDocuments(documents);
      console.log(`Loaded ${documents.length} stored documents`);
    } catch (error) {
      handleError(error as Error, 'loadStoredDocuments');
      console.error('Failed to load stored documents:', error);
    } finally {
      setIsLoadingDocuments(false);
    }
  }, 'loadStoredDocuments');

  const getPermissions = withErrorHandling(async () => {
    try {
      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
      const { status: mediaStatus } = await MediaLibrary.requestPermissionsAsync();
      
      if (cameraStatus === 'granted' && mediaStatus === 'granted') {
        setHasPermission(true);
      } else {
        setHasPermission(false);
        Alert.alert(
          'Permission Required', 
          'Camera and media library permissions are required for this app to work. Please enable them in your device settings.'
        );
      }
    } catch (error) {
      handleError(error as Error, 'getPermissions');
      setHasPermission(false);
    }
  }, 'getPermissions');

  const cleanupResources = withErrorHandling(async () => {
    try {
      await terminateOCREngine();
    } catch (error) {
      handleError(error as Error, 'cleanupResources');
    }
  }, 'cleanupResources');

  const handleDocumentScanned = withErrorHandling(async (imageUri: string, _documentType?: unknown) => {
    try {
      setIsScanning(true);
      
      // Process the image with enhancement using app config
      const processedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          { resize: { width: appConfig.imageProcessing.maxWidth } },
          { crop: { 
            originX: 0, 
            originY: 0, 
            width: appConfig.imageProcessing.maxWidth, 
            height: appConfig.imageProcessing.maxHeight 
          }},
        ],
        { 
          compress: appConfig.imageProcessing.compression, 
          format: ImageManipulator.SaveFormat.JPEG 
        }
      );

      setCurrentImage(processedImage.uri);
      setCurrentScreen('preview');
    } catch (error) {
      handleError(error as Error, 'handleDocumentScanned');
      Alert.alert('Error', 'Failed to process the scanned document. Please try again.');
    } finally {
      setIsScanning(false);
    }
  }, 'handleDocumentScanned');

  const handleSaveDocument = withErrorHandling(async () => {
    if (!currentImage) return;

    try {
      // Check storage limits
      if (scannedDocuments.length >= appConfig.storage.maxDocuments) {
        Alert.alert(
          'Storage Limit Reached', 
          `You have reached the maximum number of documents (${appConfig.storage.maxDocuments}). Please delete some documents to save new ones.`
        );
        return;
      }

      // Save to device gallery
      await MediaLibrary.createAssetAsync(currentImage);
      
      // Save to persistent storage
      const storedDocument = await DocumentStorage.saveDocument({
        uri: currentImage,
        originalUri: currentImage,
        documentType: 'scanned_document',
        side: 'single',
        metadata: {
          fileSize: 0, // Will be updated by storage utility
        }
      });

      // Update local state
      setScannedDocuments(prev => [...prev, storedDocument]);
      Alert.alert('Success', 'Document saved successfully!');
      setCurrentScreen('home');
    } catch (error) {
      handleError(error as Error, 'handleSaveDocument');
      Alert.alert('Error', 'Failed to save document. Please check your storage permissions.');
    }
  }, 'handleSaveDocument');

  const handleRetake = () => {
    setCurrentImage(null);
    setCurrentScreen('home');
  };

  const handleAdvancedOCR = () => {
    if (currentImage) {
      setCurrentScreen('advancedOCR');
    }
  };

  const handleSmartScan = () => {
    setCameraMode('smart');
    setCurrentScreen('camera');
  };

  const handleQuickScan = () => {
    setCameraMode('quick');
    setCurrentScreen('camera');
  };

  const handleBatchScan = () => {
    setCameraMode('batch');
    setCurrentScreen('camera');
  };

  const handleStartScan = () => {
    // This is now handled by the HomeScreen component
  };

  const handleViewDocuments = () => {
    setCurrentScreen('list');
  };

  // Removed unused handleRefreshDocuments function

  const handleDocumentsDeleted = withErrorHandling(async (deletedUris: string[]) => {
    try {
      // Reload documents from storage to update the list
      await loadStoredDocuments();
      console.log(`Removed ${deletedUris.length} documents from local state`);
    } catch (error) {
      handleError(error as Error, 'handleDocumentsDeleted');
    }
  }, 'handleDocumentsDeleted');

  const handleBatchComplete = withErrorHandling(async (documents: unknown[]) => {
    try {
      // Save each document to persistent storage
      const savedDocuments: StoredDocument[] = [];
      
      for (const doc of documents) {
        const storedDocument = await DocumentStorage.saveDocument({
          uri: doc.uri,
          originalUri: doc.uri,
          documentType: doc.documentType || 'scanned_document',
          side: doc.side || 'single',
          metadata: {
            fileSize: 0,
          }
        });
        savedDocuments.push(storedDocument);
      }

      // Update local state
      setScannedDocuments(prev => [...prev, ...savedDocuments]);
      Alert.alert('Success', `Batch scan completed! ${documents.length} documents added.`);
    } catch (error) {
      handleError(error as Error, 'handleBatchComplete');
      Alert.alert('Error', 'Failed to save some documents from batch scan.');
    }
  }, 'handleBatchComplete');

  if (!isInitialized) {
    return (
      <View style={styles.container}>
        <LinearGradient
          {...createGradientStyle(DesignSystem.colors.gradients.primary)}
          style={styles.loadingContainer}
        >
          <View style={styles.loadingContent}>
            <View style={styles.loadingIconContainer}>
              <Ionicons name="scan" size={48} color="white" />
            </View>
            <Text style={styles.loadingText}>
              {isLoadingDocuments ? 'Loading saved documents...' : 'Initializing Document Scanner...'}
            </Text>
            <View style={styles.loadingDots}>
              <View style={[styles.dot, styles.dot1]} />
              <View style={[styles.dot, styles.dot2]} />
              <View style={[styles.dot, styles.dot3]} />
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  }

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <LinearGradient
          {...createGradientStyle(DesignSystem.colors.gradients.accent)}
          style={styles.loadingContainer}
        >
          <View style={styles.loadingContent}>
            <View style={styles.loadingIconContainer}>
              <Ionicons name="hourglass" size={48} color="white" />
            </View>
            <Text style={styles.loadingText}>Requesting permissions...</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <LinearGradient
          {...createGradientStyle(DesignSystem.colors.gradients.secondary)}
          style={styles.errorContainer}
        >
          <View style={styles.errorContent}>
            <View style={styles.errorIconContainer}>
              <Ionicons name="camera" size={48} color="white" />
            </View>
            <Text style={styles.errorTitle}>Camera Access Required</Text>
            <Text style={styles.errorMessage}>
              This app needs camera access to scan documents. Please enable camera permissions in your device settings.
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={getPermissions}>
              <LinearGradient
                {...createGradientStyle(DesignSystem.colors.gradients.primary)}
                style={styles.retryButtonGradient}
              >
                <Ionicons name="refresh" size={20} color="white" />
                <Text style={styles.retryButtonText}>Retry</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar style="light" />
      
      {currentScreen === 'home' && (
        <HomeScreen 
          scannedImages={scannedDocuments.map(doc => doc.uri)}
          onStartScan={handleStartScan}
          onViewDocuments={handleViewDocuments}
          onImagePress={(imageUri) => {
            setCurrentImage(imageUri);
            setCurrentScreen('preview');
          }}
          onBatchComplete={handleBatchComplete}
          onSmartScan={handleSmartScan}
          onQuickScan={handleQuickScan}
          onBatchScan={handleBatchScan}
        />
      )}
      
      
      {currentScreen === 'preview' && currentImage && (
        <ImagePreview 
          imageUri={currentImage}
          onSave={handleSaveDocument}
          onRetake={handleRetake}
          onBack={() => setCurrentScreen('home')}
          onAdvancedOCR={handleAdvancedOCR}
        />
      )}
      
      {currentScreen === 'advancedOCR' && currentImage && (
        <AdvancedOCRPreview 
          imageUri={currentImage}
          onBack={() => setCurrentScreen('preview')}
          onSave={(result) => {
            console.log('Advanced OCR result saved:', result);
            setCurrentScreen('preview');
          }}
        />
      )}
      
      {currentScreen === 'list' && (
        <DocumentList 
          images={scannedDocuments.map(doc => doc.uri)}
          onBack={() => setCurrentScreen('home')}
          onImagePress={(imageUri) => {
            setCurrentImage(imageUri);
            setCurrentScreen('preview');
          }}
          onDocumentsDeleted={handleDocumentsDeleted}
        />
      )}

      {currentScreen === 'camera' && (
        <UnifiedCameraScanner
          visible={true}
          mode={cameraMode}
          onDocumentScanned={handleDocumentScanned}
          onBatchComplete={handleBatchComplete}
          onClose={() => setCurrentScreen('home')}
          isScanning={isScanning}
        />
      )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DesignSystem.spacing.xl,
  },
  loadingText: {
    ...createTextStyle('lg', 'medium'),
    color: DesignSystem.colors.textInverse,
    textAlign: 'center',
    marginBottom: DesignSystem.spacing.xl,
  },
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.6)',
    marginHorizontal: 4,
  },
  dot1: {
    // animationDelay: '0s', // Not supported in React Native StyleSheet
  },
  dot2: {
    // animationDelay: '0.2s', // Not supported in React Native StyleSheet
  },
  dot3: {
    // animationDelay: '0.4s', // Not supported in React Native StyleSheet
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: DesignSystem.spacing['4xl'],
  },
  errorContent: {
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 300,
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DesignSystem.spacing.xl,
  },
  errorTitle: {
    ...createTextStyle('2xl', 'bold'),
    color: DesignSystem.colors.textInverse,
    textAlign: 'center',
    marginBottom: DesignSystem.spacing.md,
  },
  errorMessage: {
    ...createTextStyle('base', 'normal'),
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: DesignSystem.typography.lineHeights.relaxed * DesignSystem.typography.sizes.base,
    marginBottom: DesignSystem.spacing['3xl'],
  },
  retryButton: {
    borderRadius: DesignSystem.borderRadius['2xl'],
    overflow: 'hidden',
  },
  retryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DesignSystem.spacing['3xl'],
    paddingVertical: DesignSystem.spacing.lg,
  },
  retryButtonText: {
    ...createTextStyle('base', 'semibold'),
    color: DesignSystem.colors.textInverse,
    marginLeft: DesignSystem.spacing.sm,
  },
});
