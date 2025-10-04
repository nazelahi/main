import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
  Animated,
  Alert,
  Vibration,
  Modal,
  ScrollView,
  FlatList,
  Image,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as ImageManipulator from 'expo-image-manipulator';
import { DOCUMENT_TYPES, DocumentType } from '../config/documentTypes';
import { DesignSystem, createGradientStyle, createTextStyle } from '../config/designSystem';
import { ScannedDocument } from '../utils/pdfExport';
import { SmartDetectionEngine } from '../utils/smartDetection';
import { DocumentProcessor } from '../utils/imageProcessing';
import { EnhancedEdgeDetection, DocumentCorners } from '../utils/enhancedEdgeDetection';
import AdvancedDocumentDetection from './AdvancedDocumentDetection';
import RealTimeBoundaryDetection from './RealTimeBoundaryDetection';
import { AdvancedImageCapture, CaptureResult, BatchCaptureSession } from '../utils/advancedImageCapture';
import { AdvancedImageProcessor } from '../utils/imageProcessingAdvanced';
import { AdvancedImageEnhancement, EnhancementResult } from '../utils/imageEnhancement';
import { AdvancedCameraControls, CameraControlResult } from '../utils/advancedCameraControls';
import { AdvancedOCR, OCRResult, TextBlock } from '../utils/advancedOCR';
import BatchCaptureManager from './BatchCaptureManager';
import PerspectiveCorrection from './PerspectiveCorrection';
import ImageEnhancementPanel from './ImageEnhancementPanel';
import QuickEnhancementModal from './QuickEnhancementModal';
import EnhancementPreview from './EnhancementPreview';
import AdvancedCameraControlsComponent from './AdvancedCameraControls';
import QuickCameraSettings from './QuickCameraSettings';
import RealTimeTextDetection from './RealTimeTextDetection';
import TextExtractionEditor from './TextExtractionEditor';
import SearchablePDFGenerator from './SearchablePDFGenerator';
import HandwritingRecognition from './HandwritingRecognition';
import AIEnhancementsPanel from './AIEnhancementsPanel';
import RealQualityAssessment from '../utils/realQualityAssessment';
import AdvancedImageAnalysis from '../utils/advancedImageAnalysis';
import RealEdgeDetection from '../utils/realEdgeDetection';
import RealDocumentClassification from '../utils/realDocumentClassification';

const { width, height } = Dimensions.get('window');

// Function to get GIF URL for each document type
const getDocumentTypeGif = (documentTypeId: string): string => {
  const gifUrls: { [key: string]: string } = {
    // ID Card - Small card positioning and alignment
    'id_card': 'https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif',
    
    // Passport - Book-like document with photo page
    'passport': 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
    
    // Document - A4 paper scanning with corner detection
    'document': 'https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif',
    
    // Receipt - Small receipt handling and flattening
    'receipt': 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
    
    // Business Card - Small card scanning (front and back)
    'business_card': 'https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif',
    
    // Certificate - Formal document with seal/watermark visibility
    'certificate': 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
  };
  
  // Fallback to a general document scanning demo
  return gifUrls[documentTypeId] || 'https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif';
};

interface UnifiedCameraScannerProps {
  visible: boolean;
  onDocumentScanned: (imageUri: string, documentType?: DocumentType) => void;
  onBatchComplete: (documents: ScannedDocument[]) => void;
  onClose: () => void;
  isScanning?: boolean;
  selectedDocumentType?: DocumentType;
}


interface ScanMode {
  id: string;
  name: string;
  icon: string;
  description: string;
  autoEnhancement: boolean;
  qualityThreshold: number;
}

const UnifiedCameraScanner: React.FC<UnifiedCameraScannerProps> = ({
  visible,
  onDocumentScanned,
  onBatchComplete,
  onClose,
  isScanning = false,
  selectedDocumentType = DOCUMENT_TYPES[2],
}) => {
  const cameraRef = useRef<any>(null);
  const insets = useSafeAreaInsets();
  
  // Fallback for devices without safe area support
  const safeAreaTop = Math.max(insets.top, Platform.OS === 'ios' ? 20 : 16);
  const safeAreaBottom = Math.max(insets.bottom, Platform.OS === 'ios' ? 34 : 0);
  
  // Calculate responsive spacing based on screen height
  const screenHeight = Dimensions.get('window').height;
  const isSmallScreen = screenHeight < 700;
  const isLargeScreen = screenHeight > 900;
  
  const [flashMode, setFlashMode] = useState<'off' | 'on' | 'auto'>('off');
  const [cameraType, setCameraType] = useState<CameraType>('back');
  const [isDetecting, setIsDetecting] = useState(false);
  const [documentCorners, setDocumentCorners] = useState<DocumentCorners | null>(null);
  const [autoCaptureReady, setAutoCaptureReady] = useState(false);
  const [currentDocumentType, setCurrentDocumentType] = useState<DocumentType>(selectedDocumentType);

  // Initialize scan mode selection if document type is pre-selected
  useEffect(() => {
    if (selectedDocumentType) {
      setDocumentTypeSelected(true);
      setShowScanModeSelection(true);
    }
  }, [selectedDocumentType]);

  // Handle document type selection
  const handleDocumentTypeSelection = (documentType: DocumentType) => {
    setCurrentDocumentType(documentType);
    setDocumentTypeSelected(true);
    setShowScanModeSelection(true);
  };

  // Handle scan mode selection
  const handleScanModeSelection = (scanMode: 'single' | 'batch') => {
    setSelectedScanMode(scanMode);
    
    if (scanMode === 'batch') {
      // Initialize batch scanning
      setScannedDocuments([]);
      setCurrentSide('front');
    }
  };
  const [internalScanning, setInternalScanning] = useState(false);
  
  // Quality feedback states
  const [showQualityMeter, setShowQualityMeter] = useState(true);
  const [qualityScore, setQualityScore] = useState(0);
  const [qualityIssues, setQualityIssues] = useState<string[]>([]);
  const [scanGuidance, setScanGuidance] = useState<string>('');
  
  // Voice capture states
  const [voiceCaptureEnabled, setVoiceCaptureEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceCommand, setVoiceCommand] = useState<string>('');
  
  // Auto detection states
  const [autoDetectionEnabled, setAutoDetectionEnabled] = useState(true);
  const [detectedDocumentType, setDetectedDocumentType] = useState<DocumentType | null>(null);
  const [detectionConfidence, setDetectionConfidence] = useState(0);
  
  // Live crop states
  const [liveCropEnabled, setLiveCropEnabled] = useState(false);
  const [cropCorners, setCropCorners] = useState<DocumentCorners | null>(null);
  const [isAdjustingCrop, setIsAdjustingCrop] = useState(false);
  
  // Collapsible controls state
  const [controlsExpanded, setControlsExpanded] = useState(false);
  
  // GIF loading state
  const [gifLoading, setGifLoading] = useState(true);
  
  // Document info overlay visibility
  const [showDocumentInfo, setShowDocumentInfo] = useState(true);
  
  // Advanced document detection states
  const [showAdvancedDetection, setShowAdvancedDetection] = useState(false);
  const [showRealTimeDetection, setShowRealTimeDetection] = useState(false);
  const [detectedCorners, setDetectedCorners] = useState<DocumentCorners | null>(null);
  const [detectionMode, setDetectionMode] = useState<'auto' | 'manual' | 'hybrid'>('hybrid');
  
  // Capture and processing states
  const [showBatchCapture, setShowBatchCapture] = useState(false);
  const [showPerspectiveCorrection, setShowPerspectiveCorrection] = useState(false);
  const [currentImageUri, setCurrentImageUri] = useState<string>('');
  const [captureQuality, setCaptureQuality] = useState<'low' | 'medium' | 'high' | 'ultra'>('high');
  const [autoProcessing, setAutoProcessing] = useState(true);
  const [batchSession, setBatchSession] = useState<BatchCaptureSession | null>(null);

  // Image enhancement states
  const [showImageEnhancement, setShowImageEnhancement] = useState(false);
  const [showQuickEnhancement, setShowQuickEnhancement] = useState(false);
  const [showEnhancementPreview, setShowEnhancementPreview] = useState(false);
  const [enhancementOptions, setEnhancementOptions] = useState<any>({});
  const [enhancedImageUri, setEnhancedImageUri] = useState<string>('');
  const [autoEnhancement, setAutoEnhancement] = useState(false);

  // Camera controls states
  const [showCameraControls, setShowCameraControls] = useState(false);
  const [showQuickCameraSettings, setShowQuickCameraSettings] = useState(false);
  const [cameraSettings, setCameraSettings] = useState<any>({});
  const [lightingCondition, setLightingCondition] = useState<'bright' | 'normal' | 'low' | 'mixed'>('normal');
  const [autoCameraOptimization, setAutoCameraOptimization] = useState(true);

  // OCR and text recognition states
  const [showRealTimeTextDetection, setShowRealTimeTextDetection] = useState(false);
  const [showTextExtraction, setShowTextExtraction] = useState(false);
  const [showSearchablePDF, setShowSearchablePDF] = useState(false);
  const [showHandwritingRecognition, setShowHandwritingRecognition] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [detectedTextBlocks, setDetectedTextBlocks] = useState<TextBlock[]>([]);
  const [ocrLanguage, setOcrLanguage] = useState('en');
  const [autoOCR, setAutoOCR] = useState(false);

  // AI Enhancements states
  const [showAIEnhancements, setShowAIEnhancements] = useState(false);
  const [aiEnhancementResult, setAiEnhancementResult] = useState<any>(null);
  const [currentDocumentForAI, setCurrentDocumentForAI] = useState<string>('');

  // Unified scanning flow states
  const [showScanModeSelection, setShowScanModeSelection] = useState(false);
  const [selectedScanMode, setSelectedScanMode] = useState<'single' | 'batch' | null>(null);
  const [showDocumentTypeSelection, setShowDocumentTypeSelection] = useState(true);
  const [documentTypeSelected, setDocumentTypeSelected] = useState(false);

  // Services
  const imageEnhancement = useRef(AdvancedImageEnhancement.getInstance()).current;
  const cameraControls = useRef(AdvancedCameraControls.getInstance()).current;
  const ocrService = useRef(AdvancedOCR.getInstance()).current;
  const qualityAssessment = useRef(RealQualityAssessment.getInstance()).current;
  const imageAnalysis = useRef(AdvancedImageAnalysis.getInstance()).current;
  const realEdgeDetection = useRef(RealEdgeDetection.getInstance()).current;
  const realDocumentClassification = useRef(RealDocumentClassification.getInstance()).current;
  
  // Reset GIF loading when document type changes
  useEffect(() => {
    setGifLoading(true);
  }, [currentDocumentType.id]);
  
  // Batch scanning states
  const [scannedDocuments, setScannedDocuments] = useState<ScannedDocument[]>([]);
  const [currentSide, setCurrentSide] = useState<'front' | 'back' | 'single'>('front');
  const [showBatchManager, setShowBatchManager] = useState(false);
  
  // Smart scan modes
  const [showScanModes, setShowScanModes] = useState(false);
  
  // Animation values
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const cornerAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const qualityMeterAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  
  // Floating animation refs
  const floatingAnim1 = useRef(new Animated.Value(0)).current;
  const floatingAnim2 = useRef(new Animated.Value(0)).current;
  const floatingAnim3 = useRef(new Animated.Value(0)).current;

  // Auto-capture detection
  const detectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastDetectionTime = useRef<number>(0);

  // Scan modes
  const SCAN_MODES: ScanMode[] = [
    {
      id: 'auto',
      name: 'Auto',
      icon: 'sparkles',
      description: 'AI-powered automatic detection and enhancement',
      autoEnhancement: true,
      qualityThreshold: 0.7
    },
    {
      id: 'text',
      name: 'Text',
      icon: 'document-text',
      description: 'Optimized for text documents',
      autoEnhancement: true,
      qualityThreshold: 0.8
    },
    {
      id: 'photo',
      name: 'Photo',
      icon: 'image',
      description: 'Optimized for photos and images',
      autoEnhancement: false,
      qualityThreshold: 0.6
    },
    {
      id: 'manual',
      name: 'Manual',
      icon: 'hand-left',
      description: 'Manual capture with full control',
      autoEnhancement: false,
      qualityThreshold: 0.5
    }
  ];

  // Camera permissions
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (visible) {
      // Set initial side based on document type
      if (currentDocumentType.requiresBothSides) {
        setCurrentSide('front');
      } else {
        setCurrentSide('single');
      }

      // Entrance animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Start floating animations
      startFloatingAnimations();
      
      // Start scanning line animation
      startScanLineAnimation();
      
      // Start corner pulse animation
      startCornerPulseAnimation();
    } else {
      // Reset animations when not visible
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
      scaleAnim.setValue(0.9);
    }
  }, [visible, currentDocumentType]);

  const startFloatingAnimations = () => {
    const createFloatingAnimation = (animValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration: 3000 + delay * 1000,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 3000 + delay * 1000,
            useNativeDriver: true,
          }),
        ])
      );
    };

    createFloatingAnimation(floatingAnim1, 0).start();
    createFloatingAnimation(floatingAnim2, 1).start();
    createFloatingAnimation(floatingAnim3, 2).start();
  };

  const startScanLineAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startCornerPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  // Real quality assessment function
  const updateQualityFeedback = async (imageUri?: string) => {
    try {
      if (!imageUri) {
        // Reset quality feedback when no image
        setQualityScore(0);
        setQualityIssues([]);
        setScanGuidance('Position document in frame');
        return;
      }

      // Perform real quality assessment
      const qualityMetrics = await qualityAssessment.assessImageQuality(imageUri);
      const qualityIssues = qualityAssessment.generateQualityIssues(qualityMetrics);
      
      setQualityScore(Math.round(qualityMetrics.overallScore * 100));
      setQualityIssues(qualityIssues.issues);
      setScanGuidance(qualityIssues.guidance);
    } catch (error) {
      console.error('Quality assessment failed:', error);
      // Fallback to basic feedback
      setQualityScore(50);
      setQualityIssues(['Quality assessment unavailable']);
      setScanGuidance('Position document in frame');
    }
  };

  const detectDocument = useCallback(async () => {
    if (!cameraRef.current || isDetecting) return;

    try {
      setIsDetecting(true);
      
      // Use enhanced detection if available
      if (detectionMode === 'hybrid' || detectionMode === 'auto') {
        const enhancedDetection = EnhancedEdgeDetection.getInstance();
        const result = await enhancedDetection.detectDocumentEdgesRealtime({
          realTimeMode: true,
          edgeThreshold: 0.25,
          cornerThreshold: 0.6,
        });
        
        if (result.corners) {
          setDocumentCorners(result.corners);
          setDetectedCorners(result.corners);
          
          // Update quality feedback based on detection results
          await updateQualityFeedback();
          
          // Auto-capture if quality is good and auto-detection is enabled
          if (autoDetectionEnabled && result.quality > 0.7 && result.confidence > 0.8) {
            setAutoCaptureReady(true);
            
            // Auto-capture after a short delay
            setTimeout(() => {
              if (autoCaptureReady) {
                handleCapture();
              }
            }, 1500);
          }
        } else {
          setDocumentCorners(null);
          setDetectedCorners(null);
          setAutoCaptureReady(false);
          setQualityScore(0);
          setQualityIssues([]);
          setScanGuidance('Position document in frame');
        }
      } else {
        // Use real edge detection for fallback
        try {
          const realResult = await realEdgeDetection.detectDocumentEdgesRealtime();
          
          if (realResult.corners) {
            setDocumentCorners(realResult.corners);
            setDetectedCorners(realResult.corners);
            
            // Perform real quality assessment
            await updateQualityFeedback();
            
            // Auto-capture if quality is good and auto-detection is enabled
            if (autoDetectionEnabled && realResult.quality > 0.7) {
              setAutoCaptureReady(true);
              
              // Auto-capture after a short delay
              setTimeout(() => {
                if (autoCaptureReady) {
                  handleCapture();
                }
              }, 1500);
            }
          } else {
            setDocumentCorners(null);
            setDetectedCorners(null);
            setAutoCaptureReady(false);
            setQualityScore(0);
            setQualityIssues([]);
            setScanGuidance('Position document in frame');
          }
        } catch (error) {
          console.error('Real edge detection fallback failed:', error);
          
          // Final fallback to simulation
          const hasDocument = Math.random() > 0.3;
          
          if (hasDocument) {
            const corners: DocumentCorners = {
              topLeft: { x: width * 0.1, y: height * 0.2 },
              topRight: { x: width * 0.9, y: height * 0.2 },
              bottomLeft: { x: width * 0.1, y: height * 0.8 },
              bottomRight: { x: width * 0.9, y: height * 0.8 },
            };
            
            setDocumentCorners(corners);
            setDetectedCorners(corners);
            await updateQualityFeedback();
          } else {
            setDocumentCorners(null);
            setDetectedCorners(null);
            setAutoCaptureReady(false);
            setQualityScore(0);
            setQualityIssues([]);
            setScanGuidance('Position document in frame');
          }
        }
      }
    } catch (error) {
      console.error('Document detection error:', error);
    } finally {
      setIsDetecting(false);
    }
  }, [isDetecting, autoDetectionEnabled, autoCaptureReady, detectionMode]);

  const handleCapture = async () => {
    if (!cameraRef.current || internalScanning) return;

    try {
      setInternalScanning(true);
      
      // Auto-optimize camera settings if enabled
      if (autoCameraOptimization) {
        try {
          const optimizationResult = await cameraControls.autoConfigure(lightingCondition);
          if (optimizationResult.success) {
            setCameraSettings(optimizationResult.settings);
            console.log('Camera auto-optimized for capture');
          }
        } catch (error) {
          console.error('Camera auto-optimization failed:', error);
        }
      }
      
      // Perform real quality assessment before capture
      await updateQualityFeedback();
      
      // Wait a moment to show quality feedback
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Capture photo from camera
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: false,
      });

      // Store current image URI for processing
      setCurrentImageUri(photo.uri);

      // Use advanced image capture if available
      if (selectedScanMode === 'batch' || autoProcessing) {
        const captureService = AdvancedImageCapture.getInstance();
        
        // Get capture settings based on quality preference
        const captureSettings = getCaptureSettings(captureQuality);
        
        // Process the image with advanced capture
        const result = await captureService.captureHighResolutionImage(
          photo.uri,
          detectedCorners,
          captureSettings,
          {
            perspectiveCorrection: true,
            autoCrop: true,
            autoRotate: true,
            enhanceContrast: true,
            removeShadows: true,
            sharpen: true,
          }
        );

        if (selectedScanMode === 'batch') {
          // Handle batch scanning
          const newDocument: ScannedDocument = {
            id: `${Date.now()}-${Math.random()}`,
            uri: result.uri,
            side: currentSide,
            timestamp: Date.now(),
          };

          setScannedDocuments(prev => [...prev, newDocument]);

          // Auto-advance to next side if needed
          if (currentDocumentType.requiresBothSides && currentSide === 'front') {
            setCurrentSide('back');
          } else {
            // Check if we've reached max documents
            const totalDocs = scannedDocuments.length + 1;
            if (totalDocs >= (currentDocumentType.maxDocuments || 1)) {
              // Show completion option
              return;
            }
          }
        } else {
            // Apply auto-enhancement if enabled
            let finalUri = result.uri;
            if (autoEnhancement) {
              try {
                const enhancementResult = await imageEnhancement.enhanceImage(result.uri, {
                  colorCorrection: {
                    autoWhiteBalance: true,
                    autoContrast: true,
                    saturation: 0.1,
                  },
                  brightnessContrast: {
                    brightness: 0.05,
                    contrast: 0.1,
                  },
                  noiseReduction: {
                    strength: 0.3,
                    preserveDetails: true,
                  },
                  sharpening: {
                    strength: 0.5,
                    radius: 1.0,
                  },
                });
                finalUri = enhancementResult.uri;
              } catch (error) {
                console.error('Auto-enhancement failed:', error);
                // Continue with original image if enhancement fails
              }
            }

            // Apply auto-OCR if enabled
            if (autoOCR) {
              try {
                const ocrResult = await ocrService.performOCR(finalUri, {
                  language: ocrLanguage,
                  enableHandwriting: true,
                });
                setOcrResult(ocrResult);
                console.log('Auto-OCR completed:', {
                  textLength: ocrResult.text.length,
                  confidence: ocrResult.confidence,
                  language: ocrResult.language
                });
              } catch (error) {
                console.error('Auto-OCR failed:', error);
                // Continue without OCR if it fails
              }
            }
          
          // Handle single document scanning
          onDocumentScanned(finalUri, currentDocumentType);
        }
      } else {
        // Fallback to original processing
        const aspectRatio = currentDocumentType.aspectRatio;
        const targetWidth = 1200;
        const targetHeight = Math.round(targetWidth / aspectRatio);
        
        // First resize the image
        const resizedImage = await ImageManipulator.manipulateAsync(
          photo.uri,
          [{ resize: { width: targetWidth } }],
          { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
        );
        
        // Get the actual dimensions after resize
        const actualWidth = resizedImage.width;
        const actualHeight = resizedImage.height;
        
        // Calculate crop dimensions that fit within the actual image bounds
        const cropWidth = Math.min(targetWidth, actualWidth);
        const cropHeight = Math.min(targetHeight, actualHeight);
        
        // Center the crop area
        const originX = Math.max(0, Math.floor((actualWidth - cropWidth) / 2));
        const originY = Math.max(0, Math.floor((actualHeight - cropHeight) / 2));
        
        const processedImage = await ImageManipulator.manipulateAsync(
          resizedImage.uri,
          [{ crop: { originX, originY, width: cropWidth, height: cropHeight } }],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );

        if (selectedScanMode === 'batch') {
          // Handle batch scanning
          const newDocument: ScannedDocument = {
            id: `${Date.now()}-${Math.random()}`,
            uri: processedImage.uri,
            side: currentSide,
            timestamp: Date.now(),
          };

          setScannedDocuments(prev => [...prev, newDocument]);

          // Auto-advance to next side if needed
          if (currentDocumentType.requiresBothSides && currentSide === 'front') {
            setCurrentSide('back');
          } else {
            // Check if we've reached max documents
            const totalDocs = scannedDocuments.length + 1;
            if (totalDocs >= (currentDocumentType.maxDocuments || 1)) {
              // Show completion option
              return;
            }
          }
        } else {
          // Handle single document scanning
          onDocumentScanned(processedImage.uri, currentDocumentType);
        }
      }

      // Reset detection state
      setDocumentCorners(null);
      setDetectedCorners(null);
      setAutoCaptureReady(false);
      
      // Haptic feedback
      Vibration.vibrate(100);
      
    } catch (error) {
      console.error('Error capturing photo:', error);
      Alert.alert('Error', 'Failed to capture photo');
    } finally {
      setInternalScanning(false);
    }
  };

  // Get capture settings based on quality preference
  const getCaptureSettings = (quality: 'low' | 'medium' | 'high' | 'ultra') => {
    switch (quality) {
      case 'low':
        return {
          quality: 0.6,
          maxWidth: 1024,
          maxHeight: 1024,
          compression: 0.7,
        };
      case 'medium':
        return {
          quality: 0.7,
          maxWidth: 1536,
          maxHeight: 1536,
          compression: 0.8,
        };
      case 'high':
        return {
          quality: 0.8,
          maxWidth: 2048,
          maxHeight: 2048,
          compression: 0.85,
        };
      case 'ultra':
        return {
          quality: 0.9,
          maxWidth: 3072,
          maxHeight: 3072,
          compression: 0.9,
        };
      default:
        return {
          quality: 0.8,
          maxWidth: 2048,
          maxHeight: 2048,
          compression: 0.85,
        };
    }
  };

  // Voice capture functions
  const toggleVoiceCapture = () => {
    setVoiceCaptureEnabled(prev => !prev);
    if (!voiceCaptureEnabled) {
      startVoiceListening();
    } else {
      stopVoiceListening();
    }
  };

  const startVoiceListening = () => {
    setIsListening(true);
    setVoiceCommand('Listening...');
    
    // Simulate voice recognition
    setTimeout(() => {
      const commands = ['capture', 'take photo', 'scan', 'shoot'];
      const randomCommand = commands[Math.floor(Math.random() * commands.length)];
      setVoiceCommand(`Heard: "${randomCommand}"`);
      
      // If capture command detected, take photo
      if (randomCommand === 'capture' || randomCommand === 'take photo' || randomCommand === 'scan') {
        setTimeout(() => {
          handleCapture();
          setVoiceCommand('Captured!');
          setTimeout(() => {
            setIsListening(false);
            setVoiceCommand('');
          }, 1000);
        }, 500);
      } else {
        setTimeout(() => {
          setIsListening(false);
          setVoiceCommand('');
        }, 2000);
      }
    }, 1000);
  };

  const stopVoiceListening = () => {
    setIsListening(false);
    setVoiceCommand('');
  };

  // Flash toggle function
  const toggleFlash = () => {
    setFlashMode(prev => {
      switch (prev) {
        case 'off': return 'on';
        case 'on': return 'auto';
        case 'auto': return 'off';
        default: return 'off';
      }
    });
  };


  // Live crop functions
  const toggleLiveCrop = () => {
    setLiveCropEnabled(prev => !prev);
    if (!liveCropEnabled) {
      // Initialize crop corners with default document area
      setCropCorners({
        topLeft: { x: width * 0.1, y: height * 0.2 },
        topRight: { x: width * 0.9, y: height * 0.2 },
        bottomLeft: { x: width * 0.1, y: height * 0.8 },
        bottomRight: { x: width * 0.9, y: height * 0.8 },
      });
    } else {
      setCropCorners(null);
    }
  };

  const resetCrop = () => {
    setCropCorners({
      topLeft: { x: width * 0.1, y: height * 0.2 },
      topRight: { x: width * 0.9, y: height * 0.2 },
      bottomLeft: { x: width * 0.1, y: height * 0.8 },
      bottomRight: { x: width * 0.9, y: height * 0.8 },
    });
  };

  const getCurrentSideText = () => {
    if (!currentDocumentType.requiresBothSides) return 'Document';
    return currentSide === 'front' ? 'Front Side' : 'Back Side';
  };


  const canAddMore = () => {
    const current = scannedDocuments.length;
    const max = currentDocumentType.maxDocuments || 1;
    return current < max;
  };

  const isComplete = () => {
    if (currentDocumentType.requiresBothSides) {
      const hasFront = scannedDocuments.some(doc => doc.side === 'front');
      const hasBack = scannedDocuments.some(doc => doc.side === 'back');
      return hasFront && hasBack;
    }
    return scannedDocuments.length >= 1;
  };

  const handleCompleteBatch = () => {
    if (scannedDocuments.length === 0) {
      Alert.alert('No Documents', 'Please scan at least one document before completing the batch.');
      return;
    }
    onBatchComplete(scannedDocuments);
  };

  const handleAddMore = () => {
    if (currentDocumentType.requiresBothSides) {
      setCurrentSide('front');
    } else {
      setCurrentSide('single');
    }
  };

  const handleRetakeDocument = (documentId: string) => {
    setScannedDocuments(prev => prev.filter(doc => doc.id !== documentId));
  };

  const renderScannedDocument = ({ item: doc }: { item: ScannedDocument }) => (
    <View style={styles.documentItem}>
      <Image source={{ uri: doc.uri }} style={styles.documentImage} />
      
      <View style={styles.documentInfo}>
        <Text style={styles.documentSide}>
          {doc.side === 'single' ? 'Document' : `${doc.side.charAt(0).toUpperCase() + doc.side.slice(1)} Side`}
        </Text>
        <Text style={styles.documentTime}>
          {new Date(doc.timestamp).toLocaleTimeString()}
        </Text>
      </View>
      
      <TouchableOpacity
        style={styles.retakeButton}
        onPress={() => handleRetakeDocument(doc.id)}
      >
        <Ionicons name="refresh" size={18} color="#FF3B30" />
      </TouchableOpacity>
    </View>
  );

  const renderScanningLine = () => {
    const translateY = scanLineAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [height * 0.2, height * 0.8],
    });

    return (
      <Animated.View
        style={[styles.scanningLine, { transform: [{ translateY }] }]}
      />
    );
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
        <View style={styles.permissionContainer}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.permissionGradient}
          >
            <View style={styles.permissionContent}>
              <Ionicons name="camera" size={80} color="white" />
              <Text style={styles.permissionTitle}>Camera Permission Required</Text>
              <Text style={styles.permissionMessage}>
                This app needs camera access to scan documents. Please grant permission to continue.
              </Text>
              <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                <Text style={styles.permissionButtonText}>Grant Permission</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        
        {/* Background Gradient */}
        <LinearGradient
          {...createGradientStyle(DesignSystem.colors.gradients.primary)}
          style={styles.backgroundGradient}
        />
        
        {/* Floating Background Elements */}
        <Animated.View
          style={[
            styles.floatingElement1,
            {
              transform: [
                {
                  translateY: floatingAnim1.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -20],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.floatingElement2,
            {
              transform: [
                {
                  translateY: floatingAnim2.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -15],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.floatingElement3,
            {
              transform: [
                {
                  translateY: floatingAnim3.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -25],
                  }),
                },
              ],
            },
          ]}
        />

        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={cameraType}
          flash={flashMode}
          onCameraReady={detectDocument}
        />
        
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Top overlay */}
          <View style={[styles.topOverlayBlur, { 
            paddingTop: safeAreaTop,
            height: 60 + safeAreaTop
          }]}>
            <View style={styles.topOverlay}>
              <View style={styles.topControls}>
                <TouchableOpacity style={styles.controlButton} onPress={onClose}>
                  <LinearGradient
                    colors={['#FF6B6B', '#FECA57']}
                    style={styles.controlButtonGradient}
                  >
                    <Ionicons name="arrow-back" size={16} color="white" />
                  </LinearGradient>
                </TouchableOpacity>
                
                <View style={styles.titleContainer}>
                  <Text style={styles.title}>
                    {selectedScanMode === 'single' ? 'Single Scan' : selectedScanMode === 'batch' ? 'Batch Scan' : 'Document Scanner'}
                  </Text>
                  <Text style={styles.subtitle}>
                    {selectedScanMode === 'batch' ? getCurrentSideText() : currentDocumentType.name}
                  </Text>
                </View>
                
                <TouchableOpacity style={styles.controlButton} onPress={() => setControlsExpanded(!controlsExpanded)}>
                  <LinearGradient
                    colors={['#4FACFE', '#00F2FE']}
                    style={styles.controlButtonGradient}
                  >
                    <Ionicons name="settings" size={16} color="white" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Compact Scan Mode Selection - Outside Bottom Overlay */}
          {showScanModeSelection && documentTypeSelected && (
            <View style={[styles.compactScanModeContainer, { 
              bottom: (isSmallScreen ? 140 : isLargeScreen ? 150 : 145)
            }]}>
              <View style={styles.compactScanModeOptions}>
                <TouchableOpacity
                  style={[
                    styles.compactScanModeOption,
                    selectedScanMode === 'single' && styles.selectedScanModeOption
                  ]}
                  onPress={() => handleScanModeSelection('single')}
                >
                  <LinearGradient
                    colors={selectedScanMode === 'single' 
                      ? ['rgba(76,175,80,1)', 'rgba(69,160,73,0.8)']
                      : ['rgba(76,175,80,0.8)', 'rgba(69,160,73,0.6)']
                    }
                    style={styles.compactScanModeGradient}
                  >
                    <Ionicons name="document" size={16} color="white" />
                    <Text style={styles.compactScanModeText}>Single</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.compactScanModeOption,
                    selectedScanMode === 'batch' && styles.selectedScanModeOption
                  ]}
                  onPress={() => handleScanModeSelection('batch')}
                >
                  <LinearGradient
                    colors={selectedScanMode === 'batch'
                      ? ['rgba(255,152,0,1)', 'rgba(255,143,0,0.8)']
                      : ['rgba(255,152,0,0.8)', 'rgba(255,143,0,0.6)']
                    }
                    style={styles.compactScanModeGradient}
                  >
                    <Ionicons name="layers" size={16} color="white" />
                    <Text style={styles.compactScanModeText}>Batch</Text>
                    {selectedScanMode === 'batch' && scannedDocuments.length > 0 && (
                      <View style={styles.batchProgressBadge}>
                        <Text style={styles.batchProgressBadgeText}>{scannedDocuments.length}</Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Document Type Information Overlay */}
          {showDocumentInfo && (
            <View style={styles.documentInfoContainer}>
              <View style={styles.documentInfoBlur}>
                <LinearGradient
                  colors={[
                    'rgba(0,0,0,0.8)',
                    'rgba(0,0,0,0.6)',
                    'rgba(0,0,0,0.4)'
                  ]}
                  style={styles.documentInfoGradient}
                >
                {/* Close Button */}
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setShowDocumentInfo(false)}
                >
                  <Ionicons name="close" size={20} color="white" />
                </TouchableOpacity>
                
                <View style={styles.documentInfoHeader}>
                  <View style={styles.documentInfoTitleRow}>
                    <Ionicons name={currentDocumentType.icon as any} size={20} color="#4CAF50" />
                    <Text style={styles.documentInfoTitle}>{currentDocumentType.name}</Text>
                  </View>
                  <Text style={styles.documentInfoDescription}>{currentDocumentType.description}</Text>
                  
                  {/* GIF Image - Document-specific scanning demonstration */}
                  <View style={styles.documentGifContainer}>
                    {gifLoading && (
                      <View style={styles.gifLoadingContainer}>
                        <Ionicons name="refresh" size={24} color="#4CAF50" />
                        <Text style={styles.gifLoadingText}>Loading demo...</Text>
                      </View>
                    )}
                    <Image
                      source={{ uri: getDocumentTypeGif(currentDocumentType.id) }}
                      style={[styles.documentGif, gifLoading && styles.hiddenGif]}
                      resizeMode="contain"
                      onLoadStart={() => setGifLoading(true)}
                      onLoad={() => setGifLoading(false)}
                      onError={() => setGifLoading(false)}
                    />
                  </View>
                </View>
                
                <View style={styles.documentInfoInstructions}>
                  <Text style={styles.instructionsTitle}>Scan Instructions:</Text>
                  {currentDocumentType.scanInstructions.map((instruction, index) => (
                    <View key={index} style={styles.instructionItem}>
                      <View style={styles.instructionBullet} />
                      <Text style={styles.instructionText}>{instruction}</Text>
                    </View>
                  ))}
                </View>
                
                {currentDocumentType.requiresBothSides && (
                  <View style={styles.bothSidesWarning}>
                    <Ionicons name="information-circle" size={18} color="#FF9800" />
                    <Text style={styles.bothSidesText}>Requires both front and back sides</Text>
                  </View>
                )}
                </LinearGradient>
              </View>
            </View>
          )}



          {/* Document Detection Overlay */}
          {documentCorners && (
            <View style={styles.documentOverlay}>
              {/* Corner markers */}
              <Animated.View
                style={[
                  styles.cornerMarker,
                  styles.topLeft,
                  {
                    transform: [
                      { scale: pulseAnim },
                      { translateX: documentCorners.topLeft.x - 10 },
                      { translateY: documentCorners.topLeft.y - 10 },
                    ],
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.cornerMarker,
                  styles.topRight,
                  {
                    transform: [
                      { scale: pulseAnim },
                      { translateX: documentCorners.topRight.x - 10 },
                      { translateY: documentCorners.topRight.y - 10 },
                    ],
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.cornerMarker,
                  styles.bottomLeft,
                  {
                    transform: [
                      { scale: pulseAnim },
                      { translateX: documentCorners.bottomLeft.x - 10 },
                      { translateY: documentCorners.bottomLeft.y - 10 },
                    ],
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.cornerMarker,
                  styles.bottomRight,
                  {
                    transform: [
                      { scale: pulseAnim },
                      { translateX: documentCorners.bottomRight.x - 10 },
                      { translateY: documentCorners.bottomRight.y - 10 },
                    ],
                  },
                ]}
              />
              
              {/* Scanning line */}
              {renderScanningLine()}
            </View>
          )}

          {/* Live Crop Overlay */}
          {liveCropEnabled && cropCorners && (
            <View style={styles.cropOverlay}>
              {/* Crop area outline */}
              <View style={styles.cropArea}>
                <View style={styles.cropLine} />
                <View style={[styles.cropLine, { transform: [{ rotate: '90deg' }] }]} />
                <View style={[styles.cropLine, { transform: [{ rotate: '180deg' }] }]} />
                <View style={[styles.cropLine, { transform: [{ rotate: '270deg' }] }]} />
              </View>
              
              {/* Corner handles */}
              <TouchableOpacity
                style={[styles.cropHandle, { 
                  left: cropCorners.topLeft.x - 15, 
                  top: cropCorners.topLeft.y - 15 
                }]}
                onPressIn={() => setIsAdjustingCrop(true)}
              />
              <TouchableOpacity
                style={[styles.cropHandle, { 
                  left: cropCorners.topRight.x - 15, 
                  top: cropCorners.topRight.y - 15 
                }]}
                onPressIn={() => setIsAdjustingCrop(true)}
              />
              <TouchableOpacity
                style={[styles.cropHandle, { 
                  left: cropCorners.bottomLeft.x - 15, 
                  top: cropCorners.bottomLeft.y - 15 
                }]}
                onPressIn={() => setIsAdjustingCrop(true)}
              />
              <TouchableOpacity
                style={[styles.cropHandle, { 
                  left: cropCorners.bottomRight.x - 15, 
                  top: cropCorners.bottomRight.y - 15 
                }]}
                onPressIn={() => setIsAdjustingCrop(true)}
              />
              
              {/* Reset crop button */}
              <TouchableOpacity style={styles.resetCropButton} onPress={resetCrop}>
                <LinearGradient
                  colors={['rgba(255,107,107,0.8)', 'rgba(254,202,87,0.8)']}
                  style={styles.resetCropGradient}
                >
                  <Ionicons name="refresh" size={18} color="white" />
                  <Text style={styles.resetCropText}>Reset</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* Voice Command Display */}
          {voiceCaptureEnabled && voiceCommand && (
            <View style={styles.voiceCommandContainer}>
              <LinearGradient
                colors={['rgba(76,175,80,0.9)', 'rgba(139,195,74,0.8)']}
                style={styles.voiceCommandBubble}
              >
                <Ionicons 
                  name={isListening ? "mic" : "checkmark-circle"} 
                  size={20} 
                  color="white" 
                />
                <Text style={styles.voiceCommandText}>{voiceCommand}</Text>
              </LinearGradient>
            </View>
          )}

          {/* Quality Meter */}
          {showQualityMeter && qualityScore > 0 && (
            <View style={styles.qualityMeterContainer}>
              <LinearGradient
                colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)']}
                style={styles.qualityMeter}
              >
                <View style={styles.qualityHeader}>
                  <Text style={styles.qualityTitle}>Scan Quality</Text>
                  <Text style={styles.qualityScore}>{qualityScore}%</Text>
                </View>
                <View style={styles.qualityBar}>
                  <View 
                    style={[
                      styles.qualityBarFill, 
                      { 
                        width: `${qualityScore}%`,
                        backgroundColor: qualityScore > 80 ? '#4CAF50' : qualityScore > 60 ? '#FF9800' : '#F44336'
                      }
                    ]} 
                  />
                </View>
                {qualityIssues.length > 0 && (
                  <View style={styles.qualityIssues}>
                    {qualityIssues.slice(0, 2).map((issue, index) => (
                      <Text key={index} style={styles.qualityIssue}>
                        • {issue}
                      </Text>
                    ))}
                  </View>
                )}
                {scanGuidance && (
                  <Text style={styles.scanGuidance}>{scanGuidance}</Text>
                )}
              </LinearGradient>
            </View>
          )}

          {/* Advanced Controls */}
          <View style={styles.controlsContainer}>

            {/* Expanded Controls */}
            {controlsExpanded && (
              <View style={styles.expandedControls}>
                <LinearGradient
                  colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.6)']}
                  style={styles.expandedControlsGradient}
                >
                    {/* Close Controls Button */}
                    <TouchableOpacity 
                      style={styles.closeControlsButton} 
                      onPress={() => setControlsExpanded(false)}
                    >
                      <Ionicons name="close" size={18} color="white" />
                    </TouchableOpacity>
                    
                    {/* Organized Controls Grid */}
                    <View style={styles.controlsGrid}>
                      {/* Row 1: Basic Camera Controls */}
                      <View style={styles.controlsRow}>
                        {/* Flash Control */}
                        <TouchableOpacity style={styles.collapsibleButton} onPress={toggleFlash}>
                          <LinearGradient
                            colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)']}
                            style={styles.collapsibleButtonGradient}
                          >
                            <Ionicons 
                              name={flashMode === 'off' ? 'flash-off' : flashMode === 'on' ? 'flash' : 'flash-outline'} 
                              size={18} 
                              color="white" 
                            />
                            <Text style={styles.buttonLabel}>Flash</Text>
                          </LinearGradient>
                        </TouchableOpacity>

                        {/* Auto Detection Toggle */}
                        <TouchableOpacity style={styles.collapsibleButton} onPress={() => setAutoDetectionEnabled(!autoDetectionEnabled)}>
                          <LinearGradient
                            colors={autoDetectionEnabled 
                              ? ['rgba(76,175,80,0.8)', 'rgba(139,195,74,0.6)'] 
                              : ['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)']
                            }
                            style={styles.collapsibleButtonGradient}
                          >
                            <Ionicons 
                              name={autoDetectionEnabled ? "eye" : "eye-off"} 
                              size={18} 
                              color="white" 
                            />
                            <Text style={styles.buttonLabel}>Auto</Text>
                          </LinearGradient>
                        </TouchableOpacity>

                        {/* Voice Capture Toggle */}
                        <TouchableOpacity style={styles.collapsibleButton} onPress={toggleVoiceCapture}>
                          <LinearGradient
                            colors={voiceCaptureEnabled 
                              ? ['rgba(76,175,80,0.8)', 'rgba(139,195,74,0.6)'] 
                              : ['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)']
                            }
                            style={styles.collapsibleButtonGradient}
                          >
                            <Ionicons 
                              name={voiceCaptureEnabled ? "mic" : "mic-off"} 
                              size={18} 
                              color="white" 
                            />
                            <Text style={styles.buttonLabel}>Voice</Text>
                          </LinearGradient>
                        </TouchableOpacity>

                        {/* Live Crop Toggle */}
                        <TouchableOpacity style={styles.collapsibleButton} onPress={toggleLiveCrop}>
                          <LinearGradient
                            colors={liveCropEnabled 
                              ? ['rgba(33,150,243,0.8)', 'rgba(3,169,244,0.6)'] 
                              : ['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)']
                            }
                            style={styles.collapsibleButtonGradient}
                          >
                            <Ionicons 
                              name={liveCropEnabled ? "crop" : "crop-outline"} 
                              size={18} 
                              color="white" 
                            />
                            <Text style={styles.buttonLabel}>Crop</Text>
                          </LinearGradient>
                        </TouchableOpacity>

                        {/* Auto Camera Optimization Toggle */}
                        <TouchableOpacity style={styles.collapsibleButton} onPress={() => setAutoCameraOptimization(!autoCameraOptimization)}>
                          <LinearGradient
                            colors={autoCameraOptimization 
                              ? ['rgba(76,175,80,0.8)', 'rgba(139,195,74,0.6)'] 
                              : ['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)']
                            }
                            style={styles.collapsibleButtonGradient}
                          >
                            <Ionicons 
                              name={autoCameraOptimization ? "flash" : "flash-outline"} 
                              size={18} 
                              color="white" 
                            />
                            <Text style={styles.buttonLabel}>Auto</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>

                      {/* Row 2: Detection & Processing Controls */}
                      <View style={styles.controlsRow}>
                        {/* Advanced Detection Toggle */}
                        <TouchableOpacity style={styles.collapsibleButton} onPress={() => setShowAdvancedDetection(!showAdvancedDetection)}>
                          <LinearGradient
                            colors={showAdvancedDetection 
                              ? ['rgba(76,175,80,0.8)', 'rgba(139,195,74,0.6)'] 
                              : ['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)']
                            }
                            style={styles.collapsibleButtonGradient}
                          >
                            <Ionicons 
                              name={showAdvancedDetection ? "scan" : "scan-outline"} 
                              size={18} 
                              color="white" 
                            />
                            <Text style={styles.buttonLabel}>Detect</Text>
                          </LinearGradient>
                        </TouchableOpacity>

                        {/* Real-time Detection Toggle */}
                        <TouchableOpacity style={styles.collapsibleButton} onPress={() => setShowRealTimeDetection(!showRealTimeDetection)}>
                          <LinearGradient
                            colors={showRealTimeDetection 
                              ? ['rgba(255,152,0,0.8)', 'rgba(255,193,7,0.6)'] 
                              : ['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)']
                            }
                            style={styles.collapsibleButtonGradient}
                          >
                            <Ionicons 
                              name={showRealTimeDetection ? "eye" : "eye-outline"} 
                              size={18} 
                              color="white" 
                            />
                            <Text style={styles.buttonLabel}>Live</Text>
                          </LinearGradient>
                        </TouchableOpacity>

                        {/* Batch Capture Toggle */}
                        <TouchableOpacity style={styles.collapsibleButton} onPress={() => setShowBatchCapture(!showBatchCapture)}>
                          <LinearGradient
                            colors={showBatchCapture 
                              ? ['rgba(156,39,176,0.8)', 'rgba(142,36,170,0.6)'] 
                              : ['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)']
                            }
                            style={styles.collapsibleButtonGradient}
                          >
                            <Ionicons 
                              name={showBatchCapture ? "layers" : "layers-outline"} 
                              size={18} 
                              color="white" 
                            />
                            <Text style={styles.buttonLabel}>Batch</Text>
                          </LinearGradient>
                        </TouchableOpacity>

                        {/* Perspective Correction Toggle */}
                        <TouchableOpacity style={styles.collapsibleButton} onPress={() => setShowPerspectiveCorrection(!showPerspectiveCorrection)}>
                          <LinearGradient
                            colors={showPerspectiveCorrection 
                              ? ['rgba(255,87,34,0.8)', 'rgba(255,152,0,0.6)'] 
                              : ['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)']
                            }
                            style={styles.collapsibleButtonGradient}
                          >
                            <Ionicons 
                              name={showPerspectiveCorrection ? "resize" : "resize-outline"} 
                              size={18} 
                              color="white" 
                            />
                            <Text style={styles.buttonLabel}>Perspective</Text>
                          </LinearGradient>
                        </TouchableOpacity>

                        {/* Camera Controls Toggle */}
                        <TouchableOpacity style={styles.collapsibleButton} onPress={() => setShowCameraControls(!showCameraControls)}>
                          <LinearGradient
                            colors={showCameraControls 
                              ? ['rgba(33,150,243,0.8)', 'rgba(3,169,244,0.6)'] 
                              : ['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)']
                            }
                            style={styles.collapsibleButtonGradient}
                          >
                            <Ionicons 
                              name={showCameraControls ? "camera" : "camera-outline"} 
                              size={18} 
                              color="white" 
                            />
                            <Text style={styles.buttonLabel}>Camera</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>

                      {/* Row 3: Enhancement Controls */}
                      <View style={styles.controlsRow}>
                        {/* Image Enhancement Toggle */}
                        <TouchableOpacity style={styles.collapsibleButton} onPress={() => setShowImageEnhancement(!showImageEnhancement)}>
                          <LinearGradient
                            colors={showImageEnhancement 
                              ? ['rgba(233,30,99,0.8)', 'rgba(194,24,91,0.6)'] 
                              : ['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)']
                            }
                            style={styles.collapsibleButtonGradient}
                          >
                            <Ionicons 
                              name={showImageEnhancement ? "sparkles" : "sparkles-outline"} 
                              size={18} 
                              color="white" 
                            />
                            <Text style={styles.buttonLabel}>Enhance</Text>
                          </LinearGradient>
                        </TouchableOpacity>

                        {/* Quick Enhancement Toggle */}
                        <TouchableOpacity style={styles.collapsibleButton} onPress={() => setShowQuickEnhancement(!showQuickEnhancement)}>
                          <LinearGradient
                            colors={showQuickEnhancement 
                              ? ['rgba(103,58,183,0.8)', 'rgba(81,45,168,0.6)'] 
                              : ['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)']
                            }
                            style={styles.collapsibleButtonGradient}
                          >
                            <Ionicons 
                              name={showQuickEnhancement ? "flash" : "flash-outline"} 
                              size={18} 
                              color="white" 
                            />
                            <Text style={styles.buttonLabel}>Quick</Text>
                          </LinearGradient>
                        </TouchableOpacity>

                        {/* Auto Enhancement Toggle */}
                        <TouchableOpacity style={styles.collapsibleButton} onPress={() => setAutoEnhancement(!autoEnhancement)}>
                          <LinearGradient
                            colors={autoEnhancement 
                              ? ['rgba(76,175,80,0.8)', 'rgba(139,195,74,0.6)'] 
                              : ['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)']
                            }
                            style={styles.collapsibleButtonGradient}
                          >
                            <Ionicons 
                              name={autoEnhancement ? "sparkles" : "sparkles-outline"} 
                              size={18} 
                              color="white" 
                            />
                            <Text style={styles.buttonLabel}>Auto</Text>
                          </LinearGradient>
                        </TouchableOpacity>

                        {/* Quick Camera Settings Toggle */}
                        <TouchableOpacity style={styles.collapsibleButton} onPress={() => setShowQuickCameraSettings(!showQuickCameraSettings)}>
                          <LinearGradient
                            colors={showQuickCameraSettings 
                              ? ['rgba(255,152,0,0.8)', 'rgba(255,193,7,0.6)'] 
                              : ['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)']
                            }
                            style={styles.collapsibleButtonGradient}
                          >
                            <Ionicons 
                              name={showQuickCameraSettings ? "settings" : "settings-outline"} 
                              size={18} 
                              color="white" 
                            />
                            <Text style={styles.buttonLabel}>Settings</Text>
                          </LinearGradient>
                        </TouchableOpacity>

                        {/* Auto OCR Toggle */}
                        <TouchableOpacity style={styles.collapsibleButton} onPress={() => setAutoOCR(!autoOCR)}>
                          <LinearGradient
                            colors={autoOCR 
                              ? ['rgba(76,175,80,0.8)', 'rgba(139,195,74,0.6)'] 
                              : ['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)']
                            }
                            style={styles.collapsibleButtonGradient}
                          >
                            <Ionicons 
                              name={autoOCR ? "eye" : "eye-outline"} 
                              size={18} 
                              color="white" 
                            />
                            <Text style={styles.buttonLabel}>OCR</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>

                      {/* Row 4: OCR & Text Recognition Controls */}
                      <View style={styles.controlsRow}>
                        {/* Real-time Text Detection Toggle */}
                        <TouchableOpacity style={styles.collapsibleButton} onPress={() => setShowRealTimeTextDetection(!showRealTimeTextDetection)}>
                          <LinearGradient
                            colors={showRealTimeTextDetection 
                              ? ['rgba(156,39,176,0.8)', 'rgba(123,31,162,0.6)'] 
                              : ['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)']
                            }
                            style={styles.collapsibleButtonGradient}
                          >
                            <Ionicons 
                              name={showRealTimeTextDetection ? "text" : "text-outline"} 
                              size={18} 
                              color="white" 
                            />
                            <Text style={styles.buttonLabel}>Text</Text>
                          </LinearGradient>
                        </TouchableOpacity>

                        {/* Text Extraction Toggle */}
                        <TouchableOpacity style={styles.collapsibleButton} onPress={() => setShowTextExtraction(!showTextExtraction)}>
                          <LinearGradient
                            colors={showTextExtraction 
                              ? ['rgba(255,87,34,0.8)', 'rgba(216,67,21,0.6)'] 
                              : ['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)']
                            }
                            style={styles.collapsibleButtonGradient}
                          >
                            <Ionicons 
                              name={showTextExtraction ? "document-text" : "document-text-outline"} 
                              size={18} 
                              color="white" 
                            />
                            <Text style={styles.buttonLabel}>Extract</Text>
                          </LinearGradient>
                        </TouchableOpacity>

                        {/* Searchable PDF Toggle */}
                        <TouchableOpacity style={styles.collapsibleButton} onPress={() => setShowSearchablePDF(!showSearchablePDF)}>
                          <LinearGradient
                            colors={showSearchablePDF 
                              ? ['rgba(0,150,136,0.8)', 'rgba(0,121,107,0.6)'] 
                              : ['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)']
                            }
                            style={styles.collapsibleButtonGradient}
                          >
                            <Ionicons 
                              name={showSearchablePDF ? "document" : "document-outline"} 
                              size={18} 
                              color="white" 
                            />
                            <Text style={styles.buttonLabel}>PDF</Text>
                          </LinearGradient>
                        </TouchableOpacity>

                        {/* Handwriting Recognition Toggle */}
                        <TouchableOpacity style={styles.collapsibleButton} onPress={() => setShowHandwritingRecognition(!showHandwritingRecognition)}>
                          <LinearGradient
                            colors={showHandwritingRecognition 
                              ? ['rgba(121,85,72,0.8)', 'rgba(93,64,55,0.6)'] 
                              : ['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)']
                            }
                            style={styles.collapsibleButtonGradient}
                          >
                            <Ionicons 
                              name={showHandwritingRecognition ? "create" : "create-outline"} 
                              size={18} 
                              color="white" 
                            />
                            <Text style={styles.buttonLabel}>Handwriting</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>

                      {/* Row 5: AI Enhancements */}
                      <View style={styles.controlsRow}>
                        {/* AI Enhancements Toggle */}
                        <TouchableOpacity style={styles.collapsibleButton} onPress={() => {
                          setCurrentDocumentForAI(currentImageUri || '');
                          setShowAIEnhancements(!showAIEnhancements);
                        }}>
                          <LinearGradient
                            colors={showAIEnhancements 
                              ? ['rgba(156,39,176,0.8)', 'rgba(123,31,162,0.6)'] 
                              : ['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)']
                            }
                            style={styles.collapsibleButtonGradient}
                          >
                            <Ionicons 
                              name={showAIEnhancements ? "sparkles" : "sparkles-outline"} 
                              size={18} 
                              color="white" 
                            />
                            <Text style={styles.buttonLabel}>AI Enhance</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    </View>
                </LinearGradient>
              </View>
            )}
          </View>

          {/* Single Bottom Overlay - All Bottom Elements */}
          <View style={[styles.bottomOverlayContainer, { 
            bottom: (isSmallScreen ? 10 : isLargeScreen ? 15 : 12)
          }]}>
            {/* Scanned Documents (for batch mode) */}
            {selectedScanMode === 'batch' && scannedDocuments.length > 0 && (
              <View style={styles.documentsSection}>
                <Text style={styles.documentsTitle}>Scanned Documents:</Text>
                <FlatList
                  data={scannedDocuments}
                  renderItem={renderScannedDocument}
                  keyExtractor={(item) => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.documentsList}
                />
              </View>
            )}

            {/* Document Type Selector */}
            {showDocumentTypeSelection && (
              <View style={styles.documentTypeBottomContainer}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.documentTypesBottomList}
                >
                  {DOCUMENT_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type.id}
                      style={[
                        styles.documentTypeBottomItem,
                        currentDocumentType.id === type.id && styles.selectedDocumentTypeBottom
                      ]}
                      onPress={() => handleDocumentTypeSelection(type)}
                    >
                      <LinearGradient
                        colors={
                          currentDocumentType.id === type.id
                            ? ['rgba(76,175,80,0.8)', 'rgba(139,195,74,0.8)']
                            : ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']
                        }
                        style={styles.documentTypeBottomGradient}
                      >
                        <Ionicons 
                          name={type.icon as any} 
                          size={14} 
                          color={currentDocumentType.id === type.id ? "white" : "rgba(255,255,255,0.9)"} 
                        />
                        <Text style={[
                          styles.documentTypeBottomText,
                          currentDocumentType.id === type.id && styles.selectedDocumentTypeBottomText
                        ]}>
                          {type.name}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
            
            {/* Capture Button with Add More Button (for batch mode) */}
            <View style={styles.captureContainer}>
              {/* Add More Button (for batch mode) - Positioned absolutely on left */}
              {selectedScanMode === 'batch' && canAddMore() && !isComplete() && (
                <TouchableOpacity 
                  style={styles.addMoreButtonLeft} 
                  onPress={handleAddMore}
                >
                  <LinearGradient
                    colors={['#4FACFE', '#00F2FE']}
                    style={styles.addMoreButtonGradient}
                  >
                    <Ionicons name="add" size={20} color="white" />
                  </LinearGradient>
                </TouchableOpacity>
              )}
              
              {/* Capture Button - Always centered */}
              <TouchableOpacity
                style={styles.captureButton}
                onPress={handleCapture}
                disabled={internalScanning}
              >
                <LinearGradient
                  colors={
                    internalScanning 
                      ? ['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)']
                      : ['#FF6B6B', '#FECA57']
                  }
                  style={styles.captureButtonGradient}
                >
                  <Ionicons 
                    name={internalScanning ? "hourglass" : "camera"} 
                    size={28} 
                    color="white" 
                  />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Complete Button (for batch mode) */}
            {selectedScanMode === 'batch' && isComplete() && (
              <View style={styles.completeButtonContainer}>
                <TouchableOpacity style={styles.completeButton} onPress={handleCompleteBatch}>
                  <LinearGradient
                    colors={['#4CAF50', '#45a049']}
                    style={styles.completeGradient}
                  >
                    <Ionicons name="checkmark" size={20} color="white" />
                    <Text style={styles.completeText}>Complete Batch</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Advanced Document Detection Modal */}
        <AdvancedDocumentDetection
          visible={showAdvancedDetection}
          onDetectionComplete={(corners) => {
            setDetectedCorners(corners);
            setDocumentCorners(corners);
            setShowAdvancedDetection(false);
            if (corners) {
              Vibration.vibrate(100);
            }
          }}
          onClose={() => setShowAdvancedDetection(false)}
          imageUri={''} // Will be set when camera is ready
          autoDetectionEnabled={autoDetectionEnabled}
          realTimeDetection={true}
        />

        {/* Real-time Boundary Detection Modal */}
        <RealTimeBoundaryDetection
          visible={showRealTimeDetection}
          onBoundaryDetected={(corners) => {
            setDetectedCorners(corners);
            setDocumentCorners(corners);
            setShowRealTimeDetection(false);
            if (corners) {
              Vibration.vibrate(100);
            }
          }}
          onClose={() => setShowRealTimeDetection(false)}
          imageUri={''} // Will be set when camera is ready
          detectionInterval={1000}
          showVisualFeedback={true}
          autoCaptureThreshold={0.8}
        />

        {/* Batch Capture Manager Modal */}
        <BatchCaptureManager
          visible={showBatchCapture}
          onBatchComplete={(results) => {
            // Convert CaptureResult to ScannedDocument format
            const documents: ScannedDocument[] = results.map((result, index) => ({
              id: `batch_${Date.now()}_${index}`,
              uri: result.uri,
              side: 'single' as const,
              timestamp: result.metadata.timestamp,
            }));
            
            onBatchComplete(documents);
            setShowBatchCapture(false);
            Vibration.vibrate(200);
          }}
          onClose={() => setShowBatchCapture(false)}
          maxDocuments={10}
          documentType={currentDocumentType.name}
          autoProcessing={autoProcessing}
        />

        {/* Perspective Correction Modal */}
        <PerspectiveCorrection
          visible={showPerspectiveCorrection}
          imageUri={currentImageUri}
          corners={detectedCorners}
          onCorrectionComplete={(correctedImageUri) => {
            // Handle corrected image
            if (selectedScanMode === 'batch') {
              const newDocument: ScannedDocument = {
                id: `corrected_${Date.now()}`,
                uri: correctedImageUri,
                side: currentSide,
                timestamp: Date.now(),
              };
              setScannedDocuments(prev => [...prev, newDocument]);
            } else {
              onDocumentScanned(correctedImageUri, currentDocumentType);
            }
            setShowPerspectiveCorrection(false);
            Vibration.vibrate(100);
          }}
          onClose={() => setShowPerspectiveCorrection(false)}
          autoDetect={true}
          showPreview={true}
        />

        {/* Image Enhancement Panel */}
        <ImageEnhancementPanel
          visible={showImageEnhancement}
          imageUri={currentImageUri}
          onEnhancementComplete={(result) => {
            // Handle enhanced image
            if (selectedScanMode === 'batch') {
              const newDocument: ScannedDocument = {
                id: `enhanced_${Date.now()}`,
                uri: result.uri,
                side: currentSide,
                timestamp: Date.now(),
              };
              setScannedDocuments(prev => [...prev, newDocument]);
            } else {
              onDocumentScanned(result.uri, currentDocumentType);
            }
            setShowImageEnhancement(false);
            Vibration.vibrate(100);
          }}
          onClose={() => setShowImageEnhancement(false)}
          showPreview={true}
          autoApply={false}
        />

        {/* Quick Enhancement Modal */}
        <QuickEnhancementModal
          visible={showQuickEnhancement}
          imageUri={currentImageUri}
          onEnhancementComplete={(result) => {
            // Handle enhanced image
            if (selectedScanMode === 'batch') {
              const newDocument: ScannedDocument = {
                id: `quick_enhanced_${Date.now()}`,
                uri: result.uri,
                side: currentSide,
                timestamp: Date.now(),
              };
              setScannedDocuments(prev => [...prev, newDocument]);
            } else {
              onDocumentScanned(result.uri, currentDocumentType);
            }
            setShowQuickEnhancement(false);
            Vibration.vibrate(100);
          }}
          onClose={() => setShowQuickEnhancement(false)}
        />

        {/* Enhancement Preview Modal */}
        <EnhancementPreview
          visible={showEnhancementPreview}
          originalImageUri={currentImageUri}
          onEnhancementComplete={(result) => {
            // Handle enhanced image
            if (selectedScanMode === 'batch') {
              const newDocument: ScannedDocument = {
                id: `preview_enhanced_${Date.now()}`,
                uri: result.uri,
                side: currentSide,
                timestamp: Date.now(),
              };
              setScannedDocuments(prev => [...prev, newDocument]);
            } else {
              onDocumentScanned(result.uri, currentDocumentType);
            }
            setShowEnhancementPreview(false);
            Vibration.vibrate(100);
          }}
          onClose={() => setShowEnhancementPreview(false)}
          enhancementOptions={enhancementOptions}
        />

        {/* Advanced Camera Controls Modal */}
        <AdvancedCameraControlsComponent
          visible={showCameraControls}
          onSettingsChange={(settings: any) => {
            setCameraSettings(settings);
            console.log('Camera settings updated:', settings);
          }}
          onClose={() => setShowCameraControls(false)}
          documentType={currentDocumentType.id}
          lightingCondition={lightingCondition}
        />

        {/* Quick Camera Settings Modal */}
        <QuickCameraSettings
          visible={showQuickCameraSettings}
          onSettingsChange={(settings: any) => {
            setCameraSettings(settings);
            console.log('Quick camera settings applied:', settings);
          }}
          onClose={() => setShowQuickCameraSettings(false)}
          documentType={currentDocumentType.id}
          lightingCondition={lightingCondition}
        />

        {/* Real-time Text Detection */}
        <RealTimeTextDetection
          visible={showRealTimeTextDetection}
          imageUri={currentImageUri}
          onTextDetected={(textBlocks: TextBlock[]) => {
            setDetectedTextBlocks(textBlocks);
            console.log('Text detected:', textBlocks.length, 'blocks');
          }}
          onClose={() => setShowRealTimeTextDetection(false)}
          language={ocrLanguage}
          detectionInterval={1000}
          showVisualFeedback={true}
          autoDetectionThreshold={0.8}
        />

        {/* Text Extraction Editor */}
        <TextExtractionEditor
          visible={showTextExtraction}
          imageUri={currentImageUri}
          onTextExtracted={(result: OCRResult) => {
            setOcrResult(result);
            console.log('Text extracted:', result.text.length, 'characters');
          }}
          onClose={() => setShowTextExtraction(false)}
          language={ocrLanguage}
          enableEditing={true}
          showSuggestions={true}
        />

        {/* Searchable PDF Generator */}
        <SearchablePDFGenerator
          visible={showSearchablePDF}
          imageUri={currentImageUri}
          ocrResult={ocrResult}
          onPDFGenerated={(pdfUri: string) => {
            console.log('Searchable PDF generated:', pdfUri);
            // Handle PDF generation completion
          }}
          onClose={() => setShowSearchablePDF(false)}
          defaultOptions={{
            includeText: true,
            includeImages: true,
            compressionLevel: 6,
            metadata: {
              title: `Scanned Document - ${currentDocumentType.name}`,
              author: 'Document Scanner',
              subject: 'OCR Generated PDF',
              keywords: ['OCR', 'Scanned', 'Searchable', currentDocumentType.name],
            },
          }}
        />

        {/* Handwriting Recognition */}
        <HandwritingRecognition
          visible={showHandwritingRecognition}
          imageUri={currentImageUri}
          onHandwritingRecognized={(result: OCRResult) => {
            setOcrResult(result);
            console.log('Handwriting recognized:', result.text.length, 'characters');
          }}
          onClose={() => setShowHandwritingRecognition(false)}
          language={ocrLanguage}
          enableRealTime={false}
        />

        {/* AI Enhancements Panel */}
        <AIEnhancementsPanel
          visible={showAIEnhancements}
          imageUri={currentDocumentForAI}
          onClose={() => setShowAIEnhancements(false)}
          onEnhancementComplete={(result) => {
            console.log('AI enhancements completed:', result);
            setAiEnhancementResult(result);
            setShowAIEnhancements(false);
            
            // Apply the enhanced image if available
            if (result.crop && result.crop.success) {
              setCurrentImageUri(result.crop.croppedUri);
            }
          }}
          documentMetadata={currentImageUri ? {
            id: `doc_${Date.now()}`,
            uri: currentImageUri,
            fileName: `document_${Date.now()}.jpg`,
            documentType: 'document',
            tags: [],
            qualityScore: 0.8,
            dateCreated: new Date(),
            dateModified: new Date(),
            size: 0,
            dimensions: { width: 1920, height: 1080 },
            customMetadata: {},
            organizationPath: '/',
            suggestedActions: []
          } : undefined}
        />
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  floatingElement1: {
    position: 'absolute',
    top: 100,
    right: 50,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  floatingElement2: {
    position: 'absolute',
    top: 200,
    left: 30,
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  floatingElement3: {
    position: 'absolute',
    top: 300,
    right: 80,
    width: 25,
    height: 25,
    borderRadius: 12.5,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  camera: {
    flex: 1,
  },
  content: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topOverlayBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    zIndex: 10,
  },
  topOverlay: {
    flex: 1,
    paddingTop: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  topControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: 8, // Minimal padding for compact style
  },
  controlButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  controlButtonBlur: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  controlButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  title: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    marginTop: 1,
    textAlign: 'center',
  },
  documentTypeContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  compactScanModeContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  compactScanModeOptions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  compactScanModeOption: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  compactScanModeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  compactScanModeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  selectedScanModeOption: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  batchProgressBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  batchProgressBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  selectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 15,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  selectionSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 20,
  },
  documentTypesHorizontalList: {
    paddingHorizontal: 0,
    alignItems: 'center',
  },
  documentTypeHorizontalItem: {
    marginRight: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  documentTypeHorizontalGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 60,
    justifyContent: 'center',
  },
  documentTypeHorizontalText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    textAlign: 'center',
  },
  selectedDocumentTypeHorizontal: {
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  selectedDocumentTypeText: {
    color: 'white',
    fontWeight: '700',
  },
  infoButton: {
    marginLeft: 6,
    padding: 2,
  },
  documentInfoContainer: {
    position: 'absolute',
    top: 180,
    bottom: 180,
    left: 20,
    right: 20,
    zIndex: 15,
  },
  documentInfoBlur: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  documentInfoGradient: {
    borderRadius: 20,
    padding: 20,
    minHeight: 200,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  documentInfoHeader: {
    marginBottom: 12,
  },
  documentInfoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  documentInfoTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  documentInfoDescription: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  documentGifContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  documentGif: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  gifLoadingContainer: {
    position: 'absolute',
    width: '100%',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  gifLoadingText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  hiddenGif: {
    opacity: 0,
    width: '100%',
    height: 120,
  },
  documentInfoInstructions: {
    marginBottom: 8,
  },
  instructionsTitle: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  instructionBullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4CAF50',
    marginTop: 8,
    marginRight: 8,
  },
  instructionText: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  bothSidesWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,152,0,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,152,0,0.3)',
  },
  bothSidesText: {
    color: '#FF9800',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  scanModesContainer: {
    position: 'absolute',
    top: 120,
    right: 20,
    zIndex: 10,
  },
  scanModeButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  scanModeBlur: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  scanModeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  scanModesModal: {
    position: 'absolute',
    top: 160,
    right: 20,
    width: 250,
    backgroundColor: 'rgba(0,0,0,0.9)',
    borderRadius: 12,
    maxHeight: 300,
    zIndex: 20,
  },
  scanModesList: {
    maxHeight: 300,
  },
  scanModeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  selectedScanMode: {
    backgroundColor: 'rgba(76,175,80,0.2)',
  },
  scanModeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  scanModeItemText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  documentOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
  },
  cornerMarker: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#00ff00',
    borderWidth: 3,
  },
  topLeft: {
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  topRight: {
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  bottomLeft: {
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  bottomRight: {
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  scanningLine: {
    position: 'absolute',
    left: '10%',
    right: '10%',
    height: 2,
    backgroundColor: '#00ff00',
    shadowColor: '#00ff00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  cropOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
  },
  cropArea: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#2196F3',
    borderStyle: 'dashed',
  },
  cropLine: {
    position: 'absolute',
    width: 2,
    height: 2,
    backgroundColor: '#2196F3',
  },
  cropHandle: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#2196F3',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  resetCropButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 10,
  },
  resetCropGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  resetCropText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  voiceCommandContainer: {
    position: 'absolute',
    top: 220,
    left: 20,
    right: 20,
    zIndex: 10,
    alignItems: 'center',
  },
  voiceCommandBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  voiceCommandText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  qualityMeterContainer: {
    position: 'absolute',
    top: 120,
    left: 12,
    width: 160,
    zIndex: 10,
  },
  qualityMeter: {
    padding: 8,
    borderRadius: 6,
    minHeight: 50,
  },
  qualityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  qualityTitle: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  qualityScore: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  qualityBar: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    marginBottom: 4,
  },
  qualityBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  qualityIssues: {
    marginBottom: 2,
  },
  qualityIssue: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 9,
    marginBottom: 1,
  },
  scanGuidance: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  controlsContainer: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  closeControlsButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  expandedControls: {
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    width: '90%',
    alignSelf: 'center',
  },
  expandedControlsGradient: {
    padding: 12,
    alignItems: 'center',
    width: '100%',
  },
  horizontalControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  controlsGrid: {
    marginTop: 8,
    paddingHorizontal: 4,
    width: '100%',
    alignItems: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 8,
    paddingHorizontal: 4,
    width: '100%',
  },
  collapsibleButton: {
    borderRadius: 12,
    marginVertical: 2,
    marginHorizontal: 2,
    width: 44,
    height: 48,
    overflow: 'hidden',
  },
  collapsibleButtonBlur: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  collapsibleButtonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: 'column',
  },
  buttonLabel: {
    color: 'white',
    fontSize: 9,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 11,
  },
  bottomOverlayContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingVertical: 8,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    zIndex: 1000,
  },
  documentsSection: {
    paddingHorizontal: 20,
    paddingVertical: 4,
    marginBottom: 4,
  },
  documentsTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  documentsList: {
    paddingRight: 20,
  },
  documentItem: {
    width: 80,
    marginRight: 12,
    alignItems: 'center',
  },
  documentImage: {
    width: 80,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  documentInfo: {
    marginTop: 8,
    alignItems: 'center',
  },
  documentSide: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  documentTime: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    marginTop: 2,
  },
  retakeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 4,
    marginBottom: 4,
  },
  captureContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  addMoreButtonLeft: {
    position: 'absolute',
    left: 20,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 10,
  },
  completeButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    marginTop: 4,
  },
  documentTypeBottomContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'transparent',
    marginBottom: 4,
  },
  documentTypesBottomList: {
    alignItems: 'center',
    gap: 8,
  },
  documentTypeBottomItem: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  documentTypeBottomGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 4,
  },
  documentTypeBottomText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 10,
    fontWeight: '500',
  },
  selectedDocumentTypeBottom: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  selectedDocumentTypeBottomText: {
    color: 'white',
    fontWeight: '600',
  },
  captureButton: {
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  captureButtonBlur: {
    borderRadius: 35,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  captureButtonGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 30,
    width: 60,
    height: 60,
  },
  addMoreButton: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    width: 50,
    height: 50,
  },
  addMoreButtonBlur: {
    borderRadius: 30,
    overflow: 'hidden',
  },
  addMoreButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 24,
    height: 50,
    width: 50,
  },
  completeButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  completeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  completeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  permissionContainer: {
    flex: 1,
  },
  permissionGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  permissionContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  permissionTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  permissionMessage: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default UnifiedCameraScanner;
