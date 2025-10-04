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
import { DocumentCorners } from '../utils/enhancedEdgeDetection';
import { AdvancedImageProcessor } from '../utils/imageProcessingAdvanced';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PerspectiveCorrectionProps {
  visible: boolean;
  imageUri: string;
  corners: DocumentCorners | null;
  onCorrectionComplete: (correctedImageUri: string) => void;
  onClose: () => void;
  autoDetect?: boolean;
  showPreview?: boolean;
}

interface CorrectionMode {
  id: string;
  name: string;
  icon: string;
  description: string;
  autoApply: boolean;
}

const PerspectiveCorrection: React.FC<PerspectiveCorrectionProps> = ({
  visible,
  imageUri,
  corners,
  onCorrectionComplete,
  onClose,
  autoDetect = true,
  showPreview = true,
}) => {
  const [correctionMode, setCorrectionMode] = useState<CorrectionMode | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [correctedCorners, setCorrectedCorners] = useState<DocumentCorners | null>(corners);
  const [showCornerAdjustment, setShowCornerAdjustment] = useState(false);
  const [selectedCorner, setSelectedCorner] = useState<keyof DocumentCorners | null>(null);
  const [correctionStrength, setCorrectionStrength] = useState(1.0);
  const [showPreviewState, setShowPreviewState] = useState(true);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const cornerAnim = useRef(new Animated.Value(0)).current;

  // Services
  const processorService = useRef(AdvancedImageProcessor.getInstance()).current;

  // Correction modes
  const correctionModes: CorrectionMode[] = [
    {
      id: 'auto',
      name: 'Auto',
      icon: 'sparkles',
      description: 'Automatic perspective correction',
      autoApply: true,
    },
    {
      id: 'manual',
      name: 'Manual',
      icon: 'hand-left',
      description: 'Manual corner adjustment',
      autoApply: false,
    },
    {
      id: 'enhanced',
      name: 'Enhanced',
      icon: 'settings',
      description: 'Advanced correction algorithms',
      autoApply: true,
    },
    {
      id: 'minimal',
      name: 'Minimal',
      icon: 'resize',
      description: 'Light correction only',
      autoApply: true,
    },
  ];

  useEffect(() => {
    if (visible) {
      startAnimations();
      if (autoDetect && corners) {
        setCorrectedCorners(corners);
        if (correctionModes[0].autoApply) {
          setCorrectionMode(correctionModes[0]);
        }
      }
    } else {
      stopAnimations();
    }

    return () => {
      stopAnimations();
    };
  }, [visible, corners, autoDetect]);

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

    // Corner animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(cornerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(cornerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopAnimations = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(50);
    scaleAnim.setValue(0.9);
    cornerAnim.stopAnimation();
  };

  const applyPerspectiveCorrection = async (mode: CorrectionMode) => {
    if (!correctedCorners) {
      Alert.alert('No Corners', 'Please detect document corners first.');
      return;
    }

    try {
      setIsProcessing(true);
      console.log(`Applying perspective correction with mode: ${mode.name}`);

      // Calculate correction parameters based on mode
      const correctionParams = calculateCorrectionParams(mode, correctedCorners);
      
      // Apply perspective correction
      const result = await processorService.transformImage(
        imageUri,
        {
          crop: {
            x: correctionParams.cropX,
            y: correctionParams.cropY,
            width: correctionParams.cropWidth,
            height: correctionParams.cropHeight,
            maintainAspectRatio: true,
          },
          rotation: {
            angle: correctionParams.rotationAngle,
          },
        },
        'jpeg',
        0.9
      );

      // Haptic feedback
      Vibration.vibrate(100);

      // Notify completion
      onCorrectionComplete(result.uri);

      console.log('Perspective correction completed successfully');
    } catch (error) {
      console.error('Perspective correction failed:', error);
      Alert.alert('Error', 'Failed to apply perspective correction.');
    } finally {
      setIsProcessing(false);
    }
  };

  const calculateCorrectionParams = (mode: CorrectionMode, corners: DocumentCorners) => {
    const { topLeft, topRight, bottomLeft, bottomRight } = corners;
    
    // Calculate basic crop parameters
    const cropX = Math.min(topLeft.x, bottomLeft.x);
    const cropY = Math.min(topLeft.y, topRight.y);
    const cropWidth = Math.max(topRight.x, bottomRight.x) - cropX;
    const cropHeight = Math.max(bottomLeft.y, bottomRight.y) - cropY;
    
    // Calculate rotation angle based on mode
    let rotationAngle = 0;
    
    switch (mode.id) {
      case 'auto':
        // Automatic rotation based on corner alignment
        rotationAngle = calculateAutoRotation(corners);
        break;
      case 'enhanced':
        // Enhanced rotation with more sophisticated algorithms
        rotationAngle = calculateEnhancedRotation(corners);
        break;
      case 'minimal':
        // Minimal rotation
        rotationAngle = calculateMinimalRotation(corners);
        break;
      case 'manual':
        // No automatic rotation
        rotationAngle = 0;
        break;
    }

    return {
      cropX: Math.max(0, cropX),
      cropY: Math.max(0, cropY),
      cropWidth: Math.max(100, cropWidth),
      cropHeight: Math.max(100, cropHeight),
      rotationAngle: rotationAngle * correctionStrength,
    };
  };

  const calculateAutoRotation = (corners: DocumentCorners): number => {
    const { topLeft, topRight, bottomLeft, bottomRight } = corners;
    
    // Calculate rotation based on top edge alignment
    const topEdgeAngle = Math.atan2(topRight.y - topLeft.y, topRight.x - topLeft.x);
    const bottomEdgeAngle = Math.atan2(bottomRight.y - bottomLeft.y, bottomRight.x - bottomLeft.x);
    
    // Average the angles and convert to degrees
    const avgAngle = (topEdgeAngle + bottomEdgeAngle) / 2;
    return (avgAngle * 180) / Math.PI;
  };

  const calculateEnhancedRotation = (corners: DocumentCorners): number => {
    const { topLeft, topRight, bottomLeft, bottomRight } = corners;
    
    // More sophisticated rotation calculation
    const topEdgeAngle = Math.atan2(topRight.y - topLeft.y, topRight.x - topLeft.x);
    const bottomEdgeAngle = Math.atan2(bottomRight.y - bottomLeft.y, bottomRight.x - bottomLeft.x);
    const leftEdgeAngle = Math.atan2(bottomLeft.y - topLeft.y, bottomLeft.x - topLeft.x);
    const rightEdgeAngle = Math.atan2(bottomRight.y - topRight.y, bottomRight.x - topRight.x);
    
    // Weighted average of all edges
    const avgAngle = (topEdgeAngle + bottomEdgeAngle + leftEdgeAngle + rightEdgeAngle) / 4;
    return (avgAngle * 180) / Math.PI;
  };

  const calculateMinimalRotation = (corners: DocumentCorners): number => {
    const { topLeft, topRight } = corners;
    
    // Simple rotation based on top edge only
    const topEdgeAngle = Math.atan2(topRight.y - topLeft.y, topRight.x - topLeft.x);
    return (topEdgeAngle * 180) / Math.PI * 0.5; // Reduced rotation
  };

  const handleCornerDrag = (corner: keyof DocumentCorners, gestureState: any) => {
    if (!correctedCorners) return;

    const newCorners = {
      ...correctedCorners,
      [corner]: {
        x: Math.max(0, Math.min(SCREEN_WIDTH, gestureState.x)),
        y: Math.max(0, Math.min(SCREEN_HEIGHT, gestureState.y)),
      },
    };

    setCorrectedCorners(newCorners);
  };

  const handleCornerPress = (corner: keyof DocumentCorners) => {
    setSelectedCorner(corner);
    Vibration.vibrate(50);
  };

  const resetCorners = () => {
    if (corners) {
      setCorrectedCorners(corners);
    }
  };

  const renderCornerMarker = (corner: keyof DocumentCorners, position: { x: number; y: number }) => {
    if (!correctedCorners) return null;

    const isSelected = selectedCorner === corner;
    const isDragging = showCornerAdjustment;

    return (
      <Animated.View
        key={corner}
        style={[
          styles.cornerMarker,
          {
            left: position.x - 15,
            top: position.y - 15,
            transform: [
              { scale: isSelected ? cornerAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [1, 1.3, 1],
              }) : new Animated.Value(1) },
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
          onPressOut={() => setSelectedCorner(null)}
        >
          <LinearGradient
            colors={isSelected ? ['#FF6B6B', '#FECA57'] : ['#4CAF50', '#45a049']}
            style={styles.cornerGradient}
          >
            <Ionicons name="resize" size={12} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderDocumentOverlay = () => {
    if (!correctedCorners || !showPreviewState) return null;

    const { topLeft, topRight, bottomLeft, bottomRight } = correctedCorners;

    return (
      <View style={styles.overlayContainer}>
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
      </View>
    );
  };

  const renderModeSelector = () => (
    <Animated.View style={[styles.modeSelector, { opacity: fadeAnim }]}>
      <LinearGradient
        colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.6)']}
        style={styles.modeSelectorGradient}
      >
        <Text style={styles.modeSelectorTitle}>Correction Mode</Text>
        <View style={styles.modeButtons}>
          {correctionModes.map((mode) => (
            <TouchableOpacity
              key={mode.id}
              style={[
                styles.modeButton,
                correctionMode?.id === mode.id && styles.activeModeButton,
              ]}
              onPress={() => setCorrectionMode(mode)}
            >
              <Ionicons name={mode.icon as any} size={20} color="white" />
              <Text style={styles.modeButtonText}>{mode.name}</Text>
              <Text style={styles.modeButtonDescription}>{mode.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>
    </Animated.View>
  );

  const renderControlPanel = () => (
    <Animated.View style={[styles.controlPanel, { opacity: fadeAnim }]}>
      <LinearGradient
        colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.6)']}
        style={styles.controlGradient}
      >
        <View style={styles.controlRow}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setShowCornerAdjustment(!showCornerAdjustment)}
          >
            <LinearGradient
              colors={showCornerAdjustment ? ['#4CAF50', '#45a049'] : ['#666', '#555']}
              style={styles.controlButtonGradient}
            >
              <Ionicons name="resize" size={16} color="white" />
              <Text style={styles.controlButtonText}>Adjust</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={resetCorners}
          >
            <LinearGradient
              colors={['#FF9800', '#F57C00']}
              style={styles.controlButtonGradient}
            >
              <Ionicons name="refresh" size={16} color="white" />
              <Text style={styles.controlButtonText}>Reset</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setShowPreviewState(!showPreviewState)}
          >
            <LinearGradient
              colors={showPreviewState ? ['#2196F3', '#1976D2'] : ['#666', '#555']}
              style={styles.controlButtonGradient}
            >
              <Ionicons name="eye" size={16} color="white" />
              <Text style={styles.controlButtonText}>Preview</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.controlRow}>
          <TouchableOpacity
            style={styles.applyButton}
            onPress={() => correctionMode && applyPerspectiveCorrection(correctionMode)}
            disabled={!correctionMode || isProcessing}
          >
            <LinearGradient
              colors={
                !correctionMode || isProcessing
                  ? ['#666', '#555']
                  : ['#4CAF50', '#45a049']
              }
              style={styles.applyButtonGradient}
            >
              <Ionicons 
                name={isProcessing ? "hourglass" : "checkmark"} 
                size={20} 
                color="white" 
              />
              <Text style={styles.applyButtonText}>
                {isProcessing ? 'Processing...' : 'Apply Correction'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        {/* Document overlay */}
        {renderDocumentOverlay()}

        {/* Mode selector */}
        {renderModeSelector()}

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
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  documentOutline: {
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
  modeSelector: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  modeSelectorGradient: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  modeSelectorTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  modeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  modeButton: {
    width: '48%',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 8,
  },
  activeModeButton: {
    backgroundColor: 'rgba(76,175,80,0.3)',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  modeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  modeButtonDescription: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
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
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  controlButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  controlButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  controlButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  applyButton: {
    flex: 1,
  },
  applyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  applyButtonText: {
    color: 'white',
    fontSize: 14,
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

export default PerspectiveCorrection;
