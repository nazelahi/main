import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
  Animated,
  PanGestureHandler,
  State,
  PanResponder,
  Alert,
  Vibration,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { DocumentCorners, SmartDetectionEngine } from '../utils/smartDetection';
import { DocumentProcessor } from '../utils/imageProcessing';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AdvancedDocumentDetectionProps {
  visible: boolean;
  onDetectionComplete: (corners: DocumentCorners | null) => void;
  onClose: () => void;
  imageUri?: string;
  autoDetectionEnabled?: boolean;
  realTimeDetection?: boolean;
}

interface DetectionState {
  corners: DocumentCorners | null;
  isDetecting: boolean;
  confidence: number;
  quality: number;
  isStable: boolean;
  recommendations: string[];
  isManualAdjustment: boolean;
  selectedCorner: keyof DocumentCorners | null;
}

const AdvancedDocumentDetection: React.FC<AdvancedDocumentDetectionProps> = ({
  visible,
  onDetectionComplete,
  onClose,
  imageUri,
  autoDetectionEnabled = true,
  realTimeDetection = true,
}) => {
  const [detectionState, setDetectionState] = useState<DetectionState>({
    corners: null,
    isDetecting: false,
    confidence: 0,
    quality: 0,
    isStable: false,
    recommendations: [],
    isManualAdjustment: false,
    selectedCorner: null,
  });

  const [detectionMode, setDetectionMode] = useState<'auto' | 'manual' | 'hybrid'>('hybrid');
  const [showGuidance, setShowGuidance] = useState(true);
  const [detectionHistory, setDetectionHistory] = useState<DocumentCorners[]>([]);

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const cornerAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Detection engine
  const detectionEngine = useRef(SmartDetectionEngine.getInstance()).current;

  // Detection interval
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (visible) {
      startAnimations();
      if (realTimeDetection && imageUri) {
        startRealTimeDetection();
      }
    } else {
      stopRealTimeDetection();
      stopAnimations();
    }

    return () => {
      stopRealTimeDetection();
      stopAnimations();
    };
  }, [visible, realTimeDetection, imageUri]);

  const startAnimations = () => {
    // Pulse animation for corner markers
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

    // Scanning line animation
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

    // Corner detection animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(cornerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(cornerAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const stopAnimations = () => {
    pulseAnim.stopAnimation();
    scanLineAnim.stopAnimation();
    cornerAnim.stopAnimation();
    fadeAnim.setValue(0);
  };

  const startRealTimeDetection = useCallback(async () => {
    if (!imageUri || !autoDetectionEnabled) return;

    const detectDocument = async () => {
      try {
        setDetectionState(prev => ({ ...prev, isDetecting: true }));

        const result = await detectionEngine.detectDocument(imageUri);
        
        setDetectionState(prev => ({
          ...prev,
          corners: result.corners,
          confidence: result.confidence,
          quality: result.quality,
          isStable: result.isStable,
          recommendations: result.recommendations,
          isDetecting: false,
        }));

        // Add to detection history for stability analysis
        if (result.corners) {
          setDetectionHistory(prev => {
            const newHistory = [...prev, result.corners!];
            return newHistory.slice(-5); // Keep last 5 detections
          });
        }

        // Auto-complete if detection is stable and high quality
        if (result.isStable && result.quality > 0.8 && result.corners) {
          setTimeout(() => {
            onDetectionComplete(result.corners);
          }, 1000);
        }
      } catch (error) {
        console.error('Real-time detection error:', error);
        setDetectionState(prev => ({ ...prev, isDetecting: false }));
      }
    };

    // Initial detection
    await detectDocument();

    // Set up interval for continuous detection
    detectionIntervalRef.current = setInterval(detectDocument, 2000);
  }, [imageUri, autoDetectionEnabled, detectionEngine, onDetectionComplete]);

  const stopRealTimeDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
  };

  const handleManualDetection = async () => {
    if (!imageUri) return;

    try {
      setDetectionState(prev => ({ ...prev, isDetecting: true }));

      const corners = await DocumentProcessor.detectDocumentEdges(imageUri);
      
      if (corners) {
        setDetectionState(prev => ({
          ...prev,
          corners,
          isDetecting: false,
          isManualAdjustment: true,
        }));

        // Haptic feedback
        Vibration.vibrate(100);
      } else {
        Alert.alert('Detection Failed', 'Could not detect document edges. Please try again.');
        setDetectionState(prev => ({ ...prev, isDetecting: false }));
      }
    } catch (error) {
      console.error('Manual detection error:', error);
      Alert.alert('Error', 'Failed to detect document edges.');
      setDetectionState(prev => ({ ...prev, isDetecting: false }));
    }
  };

  const handleCornerDrag = (corner: keyof DocumentCorners, gestureState: any) => {
    if (!detectionState.corners) return;

    const newCorners = {
      ...detectionState.corners,
      [corner]: {
        x: Math.max(0, Math.min(SCREEN_WIDTH, gestureState.x)),
        y: Math.max(0, Math.min(SCREEN_HEIGHT, gestureState.y)),
      },
    };

    setDetectionState(prev => ({
      ...prev,
      corners: newCorners,
      isManualAdjustment: true,
    }));
  };

  const handleCornerPress = (corner: keyof DocumentCorners) => {
    setDetectionState(prev => ({
      ...prev,
      selectedCorner: corner,
    }));

    // Haptic feedback
    Vibration.vibrate(50);
  };

  const resetDetection = () => {
    setDetectionState({
      corners: null,
      isDetecting: false,
      confidence: 0,
      quality: 0,
      isStable: false,
      recommendations: [],
      isManualAdjustment: false,
      selectedCorner: null,
    });
    setDetectionHistory([]);
  };

  const confirmDetection = () => {
    if (detectionState.corners) {
      onDetectionComplete(detectionState.corners);
    }
  };

  const renderCornerMarker = (corner: keyof DocumentCorners, position: { x: number; y: number }) => {
    const isSelected = detectionState.selectedCorner === corner;
    const isDragging = detectionState.isManualAdjustment;

    return (
      <Animated.View
        key={corner}
        style={[
          styles.cornerMarker,
          {
            left: position.x - 15,
            top: position.y - 15,
            transform: [
              { scale: isSelected ? pulseAnim : new Animated.Value(1) },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.cornerHandle,
            isSelected && styles.selectedCornerHandle,
            isDragging && styles.draggingCornerHandle,
          ]}
          onPressIn={() => handleCornerPress(corner)}
          onPressOut={() => setDetectionState(prev => ({ ...prev, selectedCorner: null }))}
        >
          <LinearGradient
            colors={isSelected ? ['#FF6B6B', '#FECA57'] : ['#4CAF50', '#45a049']}
            style={styles.cornerGradient}
          >
            <Ionicons 
              name="resize" 
              size={12} 
              color="white" 
            />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderDocumentBoundary = () => {
    if (!detectionState.corners) return null;

    const { topLeft, topRight, bottomLeft, bottomRight } = detectionState.corners;

    return (
      <View style={styles.boundaryContainer}>
        {/* Document outline */}
        <View
          style={[
            styles.documentOutline,
            {
              left: topLeft.x,
              top: topLeft.y,
              width: topRight.x - topLeft.x,
              height: bottomLeft.y - topLeft.y,
            },
          ]}
        />

        {/* Corner markers */}
        {renderCornerMarker('topLeft', topLeft)}
        {renderCornerMarker('topRight', topRight)}
        {renderCornerMarker('bottomLeft', bottomLeft)}
        {renderCornerMarker('bottomRight', bottomRight)}

        {/* Scanning line */}
        <Animated.View
          style={[
            styles.scanningLine,
            {
              left: topLeft.x,
              right: SCREEN_WIDTH - topRight.x,
              top: scanLineAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [topLeft.y, bottomLeft.y],
              }),
            },
          ]}
        />
      </View>
    );
  };

  const renderDetectionGuidance = () => {
    if (!showGuidance) return null;

    return (
      <Animated.View style={[styles.guidanceContainer, { opacity: fadeAnim }]}>
        <LinearGradient
          colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.6)']}
          style={styles.guidanceGradient}
        >
          <TouchableOpacity
            style={styles.closeGuidanceButton}
            onPress={() => setShowGuidance(false)}
          >
            <Ionicons name="close" size={16} color="white" />
          </TouchableOpacity>

          <Text style={styles.guidanceTitle}>Document Detection</Text>
          
          {detectionState.recommendations.length > 0 && (
            <View style={styles.recommendationsContainer}>
              {detectionState.recommendations.map((rec, index) => (
                <Text key={index} style={styles.recommendationText}>
                  • {rec}
                </Text>
              ))}
            </View>
          )}

          <View style={styles.qualityMetrics}>
            <Text style={styles.qualityText}>
              Confidence: {Math.round(detectionState.confidence * 100)}%
            </Text>
            <Text style={styles.qualityText}>
              Quality: {Math.round(detectionState.quality * 100)}%
            </Text>
            <Text style={styles.qualityText}>
              Status: {detectionState.isStable ? 'Stable' : 'Unstable'}
            </Text>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  const renderControlPanel = () => {
    return (
      <Animated.View style={[styles.controlPanel, { opacity: fadeAnim }]}>
        <LinearGradient
          colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.6)']}
          style={styles.controlGradient}
        >
          {/* Detection Mode Selector */}
          <View style={styles.modeSelector}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                detectionMode === 'auto' && styles.activeModeButton,
              ]}
              onPress={() => setDetectionMode('auto')}
            >
              <Ionicons name="eye" size={16} color="white" />
              <Text style={styles.modeButtonText}>Auto</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeButton,
                detectionMode === 'manual' && styles.activeModeButton,
              ]}
              onPress={() => setDetectionMode('manual')}
            >
              <Ionicons name="hand-left" size={16} color="white" />
              <Text style={styles.modeButtonText}>Manual</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeButton,
                detectionMode === 'hybrid' && styles.activeModeButton,
              ]}
              onPress={() => setDetectionMode('hybrid')}
            >
              <Ionicons name="settings" size={16} color="white" />
              <Text style={styles.modeButtonText}>Hybrid</Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleManualDetection}
              disabled={detectionState.isDetecting}
            >
              <LinearGradient
                colors={detectionState.isDetecting ? ['#666', '#555'] : ['#4CAF50', '#45a049']}
                style={styles.actionButtonGradient}
              >
                <Ionicons 
                  name={detectionState.isDetecting ? "hourglass" : "scan"} 
                  size={16} 
                  color="white" 
                />
                <Text style={styles.actionButtonText}>
                  {detectionState.isDetecting ? 'Detecting...' : 'Detect'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {detectionState.corners && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={confirmDetection}
              >
                <LinearGradient
                  colors={['#FF6B6B', '#FECA57']}
                  style={styles.actionButtonGradient}
                >
                  <Ionicons name="checkmark" size={16} color="white" />
                  <Text style={styles.actionButtonText}>Confirm</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.actionButton}
              onPress={resetDetection}
            >
              <LinearGradient
                colors={['#666', '#555']}
                style={styles.actionButtonGradient}
              >
                <Ionicons name="refresh" size={16} color="white" />
                <Text style={styles.actionButtonText}>Reset</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        {/* Document boundary detection */}
        {renderDocumentBoundary()}

        {/* Detection guidance */}
        {renderDetectionGuidance()}

        {/* Control panel */}
        {renderControlPanel()}

        {/* Close button */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <LinearGradient
            colors={['#FF6B6B', '#FECA57']}
            style={styles.closeButtonGradient}
          >
            <Ionicons name="close" size={20} color="white" />
          </LinearGradient>
        </TouchableOpacity>
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
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  boundaryContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  documentOutline: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderStyle: 'dashed',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  cornerMarker: {
    position: 'absolute',
    width: 30,
    height: 30,
  },
  cornerHandle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  selectedCornerHandle: {
    shadowColor: '#FF6B6B',
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  draggingCornerHandle: {
    shadowColor: '#4CAF50',
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 12,
  },
  cornerGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
  },
  scanningLine: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  guidanceContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  guidanceGradient: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  closeGuidanceButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guidanceTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  recommendationsContainer: {
    marginBottom: 12,
  },
  recommendationText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginBottom: 4,
  },
  qualityMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  qualityText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  controlPanel: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  controlGradient: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  modeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  activeModeButton: {
    backgroundColor: 'rgba(76,175,80,0.3)',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  modeButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    zIndex: 20,
  },
  closeButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AdvancedDocumentDetection;
