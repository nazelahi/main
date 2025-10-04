import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
  Animated,
  PanResponder,
  Alert,
  Vibration,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { DocumentCorners } from '../utils/smartDetection';
import { EnhancedEdgeDetection, EdgeDetectionResult } from '../utils/enhancedEdgeDetection';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface RealTimeBoundaryDetectionProps {
  visible: boolean;
  onBoundaryDetected: (corners: DocumentCorners | null) => void;
  onClose: () => void;
  imageUri?: string;
  detectionInterval?: number;
  showVisualFeedback?: boolean;
  autoCaptureThreshold?: number;
}

interface DetectionMetrics {
  confidence: number;
  quality: number;
  stability: number;
  processingTime: number;
  frameCount: number;
}

const RealTimeBoundaryDetection: React.FC<RealTimeBoundaryDetectionProps> = ({
  visible,
  onBoundaryDetected,
  onClose,
  imageUri,
  detectionInterval = 1000,
  showVisualFeedback = true,
  autoCaptureThreshold = 0.8,
}) => {
  const [detectionState, setDetectionState] = useState<{
    corners: DocumentCorners | null;
    isDetecting: boolean;
    metrics: DetectionMetrics;
    isStable: boolean;
    recommendations: string[];
  }>({
    corners: null,
    isDetecting: false,
    metrics: {
      confidence: 0,
      quality: 0,
      stability: 0,
      processingTime: 0,
      frameCount: 0,
    },
    isStable: false,
    recommendations: [],
  });

  const [detectionMode, setDetectionMode] = useState<'realtime' | 'manual' | 'hybrid'>('realtime');
  const [showMetrics, setShowMetrics] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const cornerAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const boundaryAnim = useRef(new Animated.Value(0)).current;

  // Detection engine
  const detectionEngine = useRef(EnhancedEdgeDetection.getInstance()).current;
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const frameCountRef = useRef(0);

  useEffect(() => {
    if (visible) {
      startAnimations();
      if (detectionMode === 'realtime' || detectionMode === 'hybrid') {
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
  }, [visible, detectionMode, imageUri]);

  const startAnimations = () => {
    // Pulse animation for active detection
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Scanning line animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Corner detection animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(cornerAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(cornerAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Boundary detection animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(boundaryAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(boundaryAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const stopAnimations = () => {
    pulseAnim.stopAnimation();
    scanLineAnim.stopAnimation();
    cornerAnim.stopAnimation();
    fadeAnim.setValue(0);
    boundaryAnim.stopAnimation();
  };

  const startRealTimeDetection = useCallback(async () => {
    if (!imageUri || isPaused) return;

    const detectBoundary = async () => {
      try {
        setDetectionState(prev => ({ ...prev, isDetecting: true }));
        frameCountRef.current += 1;

        const result: EdgeDetectionResult = await detectionEngine.detectDocumentEdges(imageUri, {
          realTimeMode: true,
          edgeThreshold: 0.25,
          cornerThreshold: 0.6,
        });

        const newMetrics: DetectionMetrics = {
          confidence: result.confidence,
          quality: result.quality,
          stability: calculateStability(result),
          processingTime: result.processingTime,
          frameCount: frameCountRef.current,
        };

        const isStable = newMetrics.stability > 0.7 && newMetrics.confidence > 0.6;
        const recommendations = generateRecommendations(newMetrics, result.corners);

        setDetectionState(prev => ({
          ...prev,
          corners: result.corners,
          metrics: newMetrics,
          isStable,
          recommendations,
          isDetecting: false,
        }));

        // Auto-capture if conditions are met
        if (isStable && newMetrics.confidence > autoCaptureThreshold && result.corners) {
          setTimeout(() => {
            onBoundaryDetected(result.corners);
          }, 500);
        }
      } catch (error) {
        console.error('Real-time boundary detection error:', error);
        setDetectionState(prev => ({ ...prev, isDetecting: false }));
      }
    };

    // Initial detection
    await detectBoundary();

    // Set up interval for continuous detection
    detectionIntervalRef.current = setInterval(detectBoundary, detectionInterval);
  }, [imageUri, isPaused, detectionEngine, autoCaptureThreshold, onBoundaryDetected, detectionInterval]);

  const stopRealTimeDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
  };

  const calculateStability = (result: EdgeDetectionResult): number => {
    // Calculate stability based on detection history
    const history = detectionEngine.getDetectionHistory();
    if (history.length < 2) return 0;

    let totalVariation = 0;
    for (let i = 1; i < history.length; i++) {
      const prev = history[i - 1];
      const curr = history[i];
      const variation = calculateCornerVariation(prev, curr);
      totalVariation += variation;
    }

    const avgVariation = totalVariation / (history.length - 1);
    return Math.max(0, 1 - avgVariation);
  };

  const calculateCornerVariation = (corners1: DocumentCorners, corners2: DocumentCorners): number => {
    const keys: (keyof DocumentCorners)[] = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'];
    let totalDistance = 0;

    for (const key of keys) {
      const p1 = corners1[key];
      const p2 = corners2[key];
      const distance = Math.sqrt(
        Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)
      );
      totalDistance += distance;
    }

    const screenDiagonal = Math.sqrt(SCREEN_WIDTH * SCREEN_WIDTH + SCREEN_HEIGHT * SCREEN_HEIGHT);
    return totalDistance / (screenDiagonal * 4);
  };

  const generateRecommendations = (metrics: DetectionMetrics, corners: DocumentCorners | null): string[] => {
    const recommendations: string[] = [];

    if (!corners) {
      recommendations.push('Position document within the frame');
      recommendations.push('Ensure good lighting conditions');
      return recommendations;
    }

    if (metrics.confidence < 0.5) {
      recommendations.push('Move closer to the document');
      recommendations.push('Ensure document is flat and well-lit');
    }

    if (metrics.quality < 0.6) {
      recommendations.push('Hold device steady');
      recommendations.push('Avoid shadows and reflections');
    }

    if (metrics.stability < 0.5) {
      recommendations.push('Keep device stable');
      recommendations.push('Wait for detection to stabilize');
    }

    if (metrics.processingTime > 1000) {
      recommendations.push('Processing is slow - check device performance');
    }

    if (recommendations.length === 0) {
      recommendations.push('Document detection is optimal!');
    }

    return recommendations;
  };

  const handleManualDetection = async () => {
    if (!imageUri) return;

    try {
      setDetectionState(prev => ({ ...prev, isDetecting: true }));

      const result = await detectionEngine.detectDocumentEdges(imageUri, {
        realTimeMode: false,
        edgeThreshold: 0.3,
        cornerThreshold: 0.7,
      });

      const newMetrics: DetectionMetrics = {
        confidence: result.confidence,
        quality: result.quality,
        stability: calculateStability(result),
        processingTime: result.processingTime,
        frameCount: frameCountRef.current,
      };

      setDetectionState(prev => ({
        ...prev,
        corners: result.corners,
        metrics: newMetrics,
        isStable: newMetrics.stability > 0.7,
        recommendations: generateRecommendations(newMetrics, result.corners),
        isDetecting: false,
      }));

      if (result.corners) {
        Vibration.vibrate(100);
      }
    } catch (error) {
      console.error('Manual detection error:', error);
      Alert.alert('Error', 'Failed to detect document boundary.');
      setDetectionState(prev => ({ ...prev, isDetecting: false }));
    }
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
    if (isPaused) {
      startRealTimeDetection();
    } else {
      stopRealTimeDetection();
    }
  };

  const resetDetection = () => {
    detectionEngine.resetHistory();
    frameCountRef.current = 0;
    setDetectionState({
      corners: null,
      isDetecting: false,
      metrics: {
        confidence: 0,
        quality: 0,
        stability: 0,
        processingTime: 0,
        frameCount: 0,
      },
      isStable: false,
      recommendations: [],
    });
  };

  const confirmDetection = () => {
    if (detectionState.corners) {
      onBoundaryDetected(detectionState.corners);
    }
  };

  const renderBoundaryOverlay = () => {
    if (!detectionState.corners || !showVisualFeedback) return null;

    const { topLeft, topRight, bottomLeft, bottomRight } = detectionState.corners;

    return (
      <View style={styles.boundaryOverlay}>
        {/* Document boundary */}
        <Animated.View
          style={[
            styles.documentBoundary,
            {
              left: topLeft.x,
              top: topLeft.y,
              width: topRight.x - topLeft.x,
              height: bottomLeft.y - topLeft.y,
              opacity: boundaryAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.3, 0.8, 0.3],
              }),
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

        {/* Detection quality indicator */}
        <View style={styles.qualityIndicator}>
          <LinearGradient
            colors={
              detectionState.metrics.confidence > 0.8
                ? ['#4CAF50', '#45a049']
                : detectionState.metrics.confidence > 0.6
                ? ['#FF9800', '#F57C00']
                : ['#F44336', '#D32F2F']
            }
            style={styles.qualityIndicatorGradient}
          >
            <Text style={styles.qualityIndicatorText}>
              {Math.round(detectionState.metrics.confidence * 100)}%
            </Text>
          </LinearGradient>
        </View>
      </View>
    );
  };

  const renderCornerMarker = (corner: keyof DocumentCorners, position: { x: number; y: number }) => {
    return (
      <Animated.View
        key={corner}
        style={[
          styles.cornerMarker,
          {
            left: position.x - 15,
            top: position.y - 15,
            transform: [
              { scale: cornerAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [1, 1.2, 1],
              }) },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={['#4CAF50', '#45a049']}
          style={styles.cornerGradient}
        >
          <Ionicons name="resize" size={12} color="white" />
        </LinearGradient>
      </Animated.View>
    );
  };

  const renderMetricsPanel = () => {
    if (!showMetrics) return null;

    return (
      <Animated.View style={[styles.metricsPanel, { opacity: fadeAnim }]}>
        <LinearGradient
          colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.6)']}
          style={styles.metricsGradient}
        >
          <TouchableOpacity
            style={styles.closeMetricsButton}
            onPress={() => setShowMetrics(false)}
          >
            <Ionicons name="close" size={16} color="white" />
          </TouchableOpacity>

          <Text style={styles.metricsTitle}>Detection Metrics</Text>
          
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Confidence</Text>
              <Text style={styles.metricValue}>
                {Math.round(detectionState.metrics.confidence * 100)}%
              </Text>
            </View>
            
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Quality</Text>
              <Text style={styles.metricValue}>
                {Math.round(detectionState.metrics.quality * 100)}%
              </Text>
            </View>
            
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Stability</Text>
              <Text style={styles.metricValue}>
                {Math.round(detectionState.metrics.stability * 100)}%
              </Text>
            </View>
            
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Frames</Text>
              <Text style={styles.metricValue}>
                {detectionState.metrics.frameCount}
              </Text>
            </View>
          </View>

          {detectionState.recommendations.length > 0 && (
            <View style={styles.recommendationsContainer}>
              <Text style={styles.recommendationsTitle}>Recommendations:</Text>
              {detectionState.recommendations.map((rec, index) => (
                <Text key={index} style={styles.recommendationText}>
                  • {rec}
                </Text>
              ))}
            </View>
          )}
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
          {/* Mode Selector */}
          <View style={styles.modeSelector}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                detectionMode === 'realtime' && styles.activeModeButton,
              ]}
              onPress={() => setDetectionMode('realtime')}
            >
              <Ionicons name="eye" size={16} color="white" />
              <Text style={styles.modeButtonText}>Real-time</Text>
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

            <TouchableOpacity
              style={styles.actionButton}
              onPress={togglePause}
            >
              <LinearGradient
                colors={isPaused ? ['#4CAF50', '#45a049'] : ['#FF9800', '#F57C00']}
                style={styles.actionButtonGradient}
              >
                <Ionicons 
                  name={isPaused ? "play" : "pause"} 
                  size={16} 
                  color="white" 
                />
                <Text style={styles.actionButtonText}>
                  {isPaused ? 'Resume' : 'Pause'}
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
        {/* Boundary detection overlay */}
        {renderBoundaryOverlay()}

        {/* Metrics panel */}
        {renderMetricsPanel()}

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
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  boundaryOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  documentBoundary: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: '#4CAF50',
    borderStyle: 'dashed',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  cornerMarker: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 6,
  },
  cornerGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanningLine: {
    position: 'absolute',
    height: 3,
    backgroundColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 6,
  },
  qualityIndicator: {
    position: 'absolute',
    top: 20,
    right: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  qualityIndicatorGradient: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  qualityIndicatorText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  metricsPanel: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  metricsGradient: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  closeMetricsButton: {
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
  metricsTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metricItem: {
    width: '48%',
    marginBottom: 8,
  },
  metricLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginBottom: 2,
  },
  metricValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  recommendationsContainer: {
    marginTop: 8,
  },
  recommendationsTitle: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  recommendationText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    marginBottom: 2,
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
    flexWrap: 'wrap',
  },
  actionButton: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 8,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 11,
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

export default RealTimeBoundaryDetection;
