import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
  Animated,
  Image,
  Alert,
  Vibration,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { 
  AdvancedImageEnhancement, 
  EnhancementResult,
} from '../utils/imageEnhancement';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface EnhancementPreviewProps {
  visible: boolean;
  originalImageUri: string;
  onEnhancementComplete: (result: EnhancementResult) => void;
  onClose: () => void;
  enhancementOptions?: any;
}

const EnhancementPreview: React.FC<EnhancementPreviewProps> = ({
  visible,
  originalImageUri,
  onEnhancementComplete,
  onClose,
  enhancementOptions = {},
}) => {
  const [enhancedImageUri, setEnhancedImageUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(0.5);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const sliderAnim = useRef(new Animated.Value(0.5)).current;

  // Services
  const enhancementService = useRef(AdvancedImageEnhancement.getInstance()).current;

  useEffect(() => {
    if (visible && originalImageUri) {
      startAnimations();
      applyEnhancement();
    } else {
      stopAnimations();
      setEnhancedImageUri(null);
    }

    return () => {
      stopAnimations();
    };
  }, [visible, originalImageUri]);

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
  };

  const stopAnimations = () => {
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.9);
    slideAnim.setValue(50);
  };

  const applyEnhancement = async () => {
    if (!originalImageUri) return;

    try {
      setIsProcessing(true);
      console.log('Applying enhancement for preview...');

      const result = await enhancementService.enhanceImage(originalImageUri, enhancementOptions);
      setEnhancedImageUri(result.uri);

      console.log('Enhancement preview completed');
    } catch (error) {
      console.error('Enhancement preview failed:', error);
      Alert.alert('Error', 'Failed to create enhancement preview.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSliderMove = (event: any) => {
    const { locationX } = event.nativeEvent;
    const newPosition = Math.max(0, Math.min(1, locationX / SCREEN_WIDTH));
    setSliderPosition(newPosition);
    
    Animated.timing(sliderAnim, {
      toValue: newPosition,
      duration: 100,
      useNativeDriver: false,
    }).start();
  };

  const applyEnhancementToImage = async () => {
    if (!enhancedImageUri) {
      Alert.alert('Error', 'No enhanced image available.');
      return;
    }

    try {
      setIsProcessing(true);
      console.log('Applying enhancement to final image...');

      const result = await enhancementService.enhanceImage(originalImageUri, enhancementOptions);
      
      // Haptic feedback
      Vibration.vibrate(100);

      // Notify completion
      onEnhancementComplete(result);

      console.log('Enhancement applied successfully');
    } catch (error) {
      console.error('Enhancement application failed:', error);
      Alert.alert('Error', 'Failed to apply enhancement. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderImageComparison = () => (
    <View style={styles.imageContainer}>
      <View style={styles.imageWrapper}>
        {/* Original Image */}
        <View style={[styles.imageSection, { zIndex: 1 }]}>
          <Image
            source={{ uri: originalImageUri }}
            style={styles.image}
            resizeMode="cover"
          />
          <View style={styles.imageLabel}>
            <Text style={styles.imageLabelText}>Original</Text>
          </View>
        </View>

        {/* Enhanced Image */}
        {enhancedImageUri && (
          <View style={[styles.imageSection, { zIndex: 2 }]}>
            <Image
              source={{ uri: enhancedImageUri }}
              style={styles.image}
              resizeMode="cover"
            />
            <View style={styles.imageLabel}>
              <Text style={styles.imageLabelText}>Enhanced</Text>
            </View>
          </View>
        )}

        {/* Slider Overlay */}
        <View style={styles.sliderOverlay}>
          <View style={styles.sliderTrack}>
            <Animated.View 
              style={[
                styles.sliderFill,
                {
                  width: sliderAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]} 
            />
            <Animated.View 
              style={[
                styles.sliderThumb,
                {
                  left: sliderAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, SCREEN_WIDTH - 20],
                  }),
                },
              ]} 
            />
          </View>
          <TouchableOpacity
            style={styles.sliderArea}
            onPress={handleSliderMove}
            activeOpacity={1}
          />
        </View>
      </View>
    </View>
  );

  const renderSingleImage = () => (
    <View style={styles.imageContainer}>
      <View style={styles.imageWrapper}>
        {isProcessing ? (
          <View style={styles.loadingContainer}>
            <Ionicons name="hourglass" size={48} color="rgba(255,255,255,0.7)" />
            <Text style={styles.loadingText}>Processing...</Text>
          </View>
        ) : enhancedImageUri ? (
          <Image
            source={{ uri: enhancedImageUri }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <Image
            source={{ uri: originalImageUri }}
            style={styles.image}
            resizeMode="cover"
          />
        )}
      </View>
    </View>
  );

  const renderControls = () => (
    <View style={styles.controls}>
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => setShowComparison(!showComparison)}
      >
        <LinearGradient
          colors={showComparison ? ['#4CAF50', '#45a049'] : ['#666', '#555']}
          style={styles.toggleButtonGradient}
        >
          <Ionicons 
            name={showComparison ? "eye" : "eye-off"} 
            size={16} 
            color="white" 
          />
          <Text style={styles.toggleButtonText}>
            {showComparison ? 'Hide' : 'Show'} Comparison
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.refreshButton}
        onPress={applyEnhancement}
        disabled={isProcessing}
      >
        <LinearGradient
          colors={isProcessing ? ['#666', '#555'] : ['#2196F3', '#1976D2']}
          style={styles.refreshButtonGradient}
        >
          <Ionicons 
            name={isProcessing ? "hourglass" : "refresh"} 
            size={16} 
            color="white" 
          />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderActionButtons = () => (
    <View style={styles.actionButtons}>
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={onClose}
      >
        <LinearGradient
          colors={['#666', '#555']}
          style={styles.cancelButtonGradient}
        >
          <Ionicons name="close" size={16} color="white" />
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.applyButton}
        onPress={applyEnhancementToImage}
        disabled={isProcessing || !enhancedImageUri}
      >
        <LinearGradient
          colors={
            isProcessing || !enhancedImageUri
              ? ['#666', '#555']
              : ['#4CAF50', '#45a049']
          }
          style={styles.applyButtonGradient}
        >
          <Ionicons 
            name={isProcessing ? "hourglass" : "checkmark"} 
            size={16} 
            color="white" 
          />
          <Text style={styles.applyButtonText}>
            {isProcessing ? 'Processing...' : 'Apply Enhancement'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View style={[
          styles.modal,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: slideAnim },
            ],
          },
        ]}>
          <LinearGradient
            colors={['rgba(0,0,0,0.9)', 'rgba(0,0,0,0.8)']}
            style={styles.modalGradient}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Enhancement Preview</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>

            {/* Image Display */}
            {showComparison ? renderImageComparison() : renderSingleImage()}

            {/* Controls */}
            {renderControls()}

            {/* Action Buttons */}
            {renderActionButtons()}
          </LinearGradient>
        </Animated.View>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: SCREEN_WIDTH * 0.95,
    maxHeight: SCREEN_HEIGHT * 0.9,
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalGradient: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    height: 300,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  imageWrapper: {
    flex: 1,
    position: 'relative',
  },
  imageSection: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageLabel: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  imageLabelText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 8,
  },
  sliderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 3,
  },
  sliderTrack: {
    position: 'absolute',
    top: 20,
    left: 10,
    right: 10,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  sliderThumb: {
    position: 'absolute',
    top: -8,
    width: 20,
    height: 20,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    marginLeft: -10,
  },
  sliderArea: {
    flex: 1,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  toggleButton: {
    flex: 1,
    marginRight: 8,
  },
  toggleButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  toggleButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  refreshButton: {
    width: 48,
  },
  refreshButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  cancelButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  applyButton: {
    flex: 2,
    marginLeft: 8,
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
});

export default EnhancementPreview;
