import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
  Animated,
  ScrollView,
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

interface QuickEnhancementModalProps {
  visible: boolean;
  imageUri: string;
  onEnhancementComplete: (result: EnhancementResult) => void;
  onClose: () => void;
}

interface QuickEnhancementOption {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string[];
  presetId?: string;
  customOptions?: any;
}

const QuickEnhancementModal: React.FC<QuickEnhancementModalProps> = ({
  visible,
  imageUri,
  onEnhancementComplete,
  onClose,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Services
  const enhancementService = useRef(AdvancedImageEnhancement.getInstance()).current;

  // Quick enhancement options
  const enhancementOptions: QuickEnhancementOption[] = [
    {
      id: 'auto',
      name: 'Auto Enhance',
      icon: 'sparkles',
      description: 'Automatic enhancement with optimal settings',
      color: ['#4CAF50', '#45a049'],
      presetId: 'auto',
    },
    {
      id: 'document',
      name: 'Document',
      icon: 'document-text',
      description: 'Optimized for text documents',
      color: ['#2196F3', '#1976D2'],
      presetId: 'document',
    },
    {
      id: 'photo',
      name: 'Photo',
      icon: 'image',
      description: 'Enhanced for photos and images',
      color: ['#FF9800', '#F57C00'],
      presetId: 'photo',
    },
    {
      id: 'blackwhite',
      name: 'Black & White',
      icon: 'contrast',
      description: 'High contrast black and white',
      color: ['#9E9E9E', '#757575'],
      presetId: 'high_contrast',
    },
    {
      id: 'vintage',
      name: 'Vintage',
      icon: 'camera',
      description: 'Vintage film look',
      color: ['#8D6E63', '#6D4C41'],
      presetId: 'vintage',
    },
    {
      id: 'sharpen',
      name: 'Sharpen',
      icon: 'flash',
      description: 'Enhance image sharpness',
      color: ['#E91E63', '#C2185B'],
      customOptions: {
        sharpening: {
          strength: 1.5,
          radius: 1.0,
          threshold: 0.0,
          unsharpMask: true,
        },
      },
    },
    {
      id: 'denoise',
      name: 'Denoise',
      icon: 'remove-circle',
      description: 'Reduce image noise',
      color: ['#607D8B', '#455A64'],
      customOptions: {
        noiseReduction: {
          strength: 0.7,
          preserveDetails: true,
          luminanceNoise: 0.6,
          colorNoise: 0.5,
        },
      },
    },
    {
      id: 'brighten',
      name: 'Brighten',
      icon: 'sunny',
      description: 'Increase brightness and contrast',
      color: ['#FFC107', '#FF8F00'],
      customOptions: {
        brightnessContrast: {
          brightness: 0.2,
          contrast: 0.3,
          highlights: -0.1,
          shadows: 0.2,
        },
      },
    },
  ];

  useEffect(() => {
    if (visible) {
      startAnimations();
    } else {
      stopAnimations();
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
    scaleAnim.setValue(0.8);
    slideAnim.setValue(30);
  };

  const applyEnhancement = async (option: QuickEnhancementOption) => {
    if (!imageUri) {
      Alert.alert('Error', 'No image provided for enhancement.');
      return;
    }

    try {
      setIsProcessing(true);
      setSelectedOption(option.id);
      console.log(`Applying ${option.name} enhancement...`);

      let result: EnhancementResult;

      if (option.presetId) {
        // Apply preset
        result = await enhancementService.applyPreset(imageUri, option.presetId);
      } else if (option.customOptions) {
        // Apply custom options
        result = await enhancementService.enhanceImage(imageUri, option.customOptions);
      } else {
        throw new Error('No enhancement options provided');
      }

      // Haptic feedback
      Vibration.vibrate(100);

      // Notify completion
      onEnhancementComplete(result);

      console.log(`${option.name} enhancement completed successfully`);
    } catch (error) {
      console.error(`${option.name} enhancement failed:`, error);
      Alert.alert('Error', `Failed to apply ${option.name} enhancement. Please try again.`);
    } finally {
      setIsProcessing(false);
      setSelectedOption(null);
    }
  };

  const renderEnhancementOption = (option: QuickEnhancementOption) => {
    const isSelected = selectedOption === option.id;
    const isProcessing = isSelected && selectedOption === option.id;

    return (
      <TouchableOpacity
        key={option.id}
        style={[styles.optionItem, isSelected && styles.selectedOptionItem]}
        onPress={() => applyEnhancement(option)}
        disabled={isProcessing}
      >
        <LinearGradient
          colors={isSelected ? option.color : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
          style={styles.optionGradient}
        >
          <View style={styles.optionContent}>
            <View style={styles.optionIcon}>
              <Ionicons 
                name={isProcessing ? "hourglass" : option.icon as any} 
                size={24} 
                color="white" 
              />
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionName}>{option.name}</Text>
              <Text style={styles.optionDescription}>{option.description}</Text>
            </View>
            {isSelected && (
              <View style={styles.processingIndicator}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              </View>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
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
              <Text style={styles.title}>Quick Enhancement</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>

            {/* Enhancement Options */}
            <ScrollView 
              style={styles.optionsList}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.optionsContent}
            >
              {enhancementOptions.map(renderEnhancementOption)}
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Select an enhancement to apply to your image
              </Text>
            </View>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modal: {
    width: SCREEN_WIDTH * 0.9,
    maxHeight: SCREEN_HEIGHT * 0.8,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
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
  optionsList: {
    flex: 1,
  },
  optionsContent: {
    paddingBottom: 10,
  },
  optionItem: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  selectedOptionItem: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  optionGradient: {
    padding: 16,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionText: {
    flex: 1,
  },
  optionName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionDescription: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  processingIndicator: {
    marginLeft: 12,
  },
  footer: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  footerText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default QuickEnhancementModal;
