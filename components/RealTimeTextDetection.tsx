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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AdvancedOCR, TextBlock, OCRSettings } from '../utils/advancedOCR';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface RealTimeTextDetectionProps {
  visible: boolean;
  imageUri: string;
  onTextDetected: (textBlocks: TextBlock[]) => void;
  onClose: () => void;
  detectionInterval?: number;
  showVisualFeedback?: boolean;
  autoDetectionThreshold?: number;
  language?: string;
}

const RealTimeTextDetection: React.FC<RealTimeTextDetectionProps> = ({
  visible,
  imageUri,
  onTextDetected,
  onClose,
  detectionInterval = 1000,
  showVisualFeedback = true,
  autoDetectionThreshold = 0.8,
  language = 'en',
}) => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedTextBlocks, setDetectedTextBlocks] = useState<TextBlock[]>([]);
  const [detectionCount, setDetectionCount] = useState(0);
  const [averageConfidence, setAverageConfidence] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Services
  const ocrService = useRef(AdvancedOCR.getInstance()).current;
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (visible && imageUri) {
      startAnimations();
      startDetection();
    } else {
      stopAnimations();
      stopDetection();
    }

    return () => {
      stopAnimations();
      stopDetection();
    };
  }, [visible, imageUri]);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Start pulsing animation
    startPulseAnimation();
  };

  const stopAnimations = () => {
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.9);
    slideAnim.setValue(50);
    pulseAnim.stopAnimation();
  };

  const startPulseAnimation = () => {
    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (isDetecting) {
          pulse();
        }
      });
    };
    pulse();
  };

  const startDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }

    setIsDetecting(true);
    setDetectionCount(0);
    setAverageConfidence(0);

    detectionIntervalRef.current = setInterval(async () => {
      if (!isPaused && imageUri) {
        await performDetection();
      }
    }, detectionInterval);
  };

  const stopDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    setIsDetecting(false);
  };

  const performDetection = async () => {
    try {
      const textBlocks = await ocrService.detectTextRealtime(imageUri, {
        language,
        enableRealTime: true,
      });

      if (textBlocks.length > 0) {
        setDetectedTextBlocks(textBlocks);
        setDetectionCount(prev => prev + 1);
        
        // Calculate average confidence
        const avgConfidence = textBlocks.reduce((sum, block) => sum + block.confidence, 0) / textBlocks.length;
        setAverageConfidence(avgConfidence);

        // Notify parent component
        onTextDetected(textBlocks);

        // Haptic feedback for high confidence detection
        if (avgConfidence >= autoDetectionThreshold) {
          Vibration.vibrate(50);
        }
      }
    } catch (error) {
      console.error('Real-time text detection failed:', error);
    }
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
    if (!isPaused) {
      Vibration.vibrate(100);
    }
  };

  const renderTextBlock = (block: TextBlock, index: number) => {
    const { boundingBox, text, confidence, isHandwriting } = block;
    
    return (
      <Animated.View
        key={block.id}
        style={[
          styles.textBlock,
          {
            left: boundingBox.x,
            top: boundingBox.y,
            width: boundingBox.width,
            height: boundingBox.height,
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={
            confidence >= autoDetectionThreshold
              ? ['rgba(76,175,80,0.8)', 'rgba(139,195,74,0.6)']
              : ['rgba(255,152,0,0.8)', 'rgba(255,193,7,0.6)']
          }
          style={styles.textBlockGradient}
        >
          <Text style={styles.textBlockText} numberOfLines={1}>
            {text}
          </Text>
          <View style={styles.textBlockInfo}>
            <Text style={styles.confidenceText}>
              {Math.round(confidence * 100)}%
            </Text>
            {isHandwriting && (
              <Ionicons name="create" size={12} color="white" />
            )}
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  const renderDetectionOverlay = () => {
    if (!showVisualFeedback || detectedTextBlocks.length === 0) return null;

    return (
      <View style={styles.detectionOverlay}>
        {detectedTextBlocks.map((block, index) => renderTextBlock(block, index))}
      </View>
    );
  };

  const renderControls = () => (
    <Animated.View style={[
      styles.controls,
      {
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      },
    ]}>
      <LinearGradient
        colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.6)']}
        style={styles.controlsGradient}
      >
        {/* Detection Status */}
        <View style={styles.statusContainer}>
          <Animated.View style={[
            styles.statusIndicator,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}>
            <Ionicons 
              name={isDetecting ? "scan" : "scan-outline"} 
              size={20} 
              color={isDetecting ? "#4CAF50" : "#FF9800"} 
            />
          </Animated.View>
          <View style={styles.statusText}>
            <Text style={styles.statusTitle}>
              {isDetecting ? 'Detecting Text...' : 'Detection Stopped'}
            </Text>
            <Text style={styles.statusSubtitle}>
              {detectionCount} detections • {Math.round(averageConfidence * 100)}% avg confidence
            </Text>
          </View>
        </View>

        {/* Control Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={togglePause}
          >
            <LinearGradient
              colors={isPaused ? ['#4CAF50', '#45a049'] : ['#FF9800', '#F57C00']}
              style={styles.controlButtonGradient}
            >
              <Ionicons 
                name={isPaused ? "play" : "pause"} 
                size={16} 
                color="white" 
              />
              <Text style={styles.controlButtonText}>
                {isPaused ? 'Resume' : 'Pause'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={onClose}
          >
            <LinearGradient
              colors={['#666', '#555']}
              style={styles.controlButtonGradient}
            >
              <Ionicons name="close" size={16} color="white" />
              <Text style={styles.controlButtonText}>Close</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <Animated.View style={[
        styles.overlay,
        { opacity: fadeAnim }
      ]}>
        {/* Detection Overlay */}
        {renderDetectionOverlay()}

        {/* Controls */}
        {renderControls()}
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
  },
  detectionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  textBlock: {
    position: 'absolute',
    borderRadius: 4,
    overflow: 'hidden',
  },
  textBlockGradient: {
    padding: 4,
    minHeight: 20,
    justifyContent: 'center',
  },
  textBlockText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  textBlockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  confidenceText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '500',
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  controlsGradient: {
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statusText: {
    flex: 1,
  },
  statusTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  statusSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  controlButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  controlButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  controlButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default RealTimeTextDetection;
