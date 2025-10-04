import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  EnhancementPreset, 
  EnhancementResult,
  ColorCorrectionOptions,
  BrightnessContrastOptions,
  BlackWhiteOptions,
  NoiseReductionOptions,
  SharpeningOptions,
} from '../utils/imageEnhancement';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ImageEnhancementPanelProps {
  visible: boolean;
  imageUri: string;
  onEnhancementComplete: (result: EnhancementResult) => void;
  onClose: () => void;
  showPreview?: boolean;
  autoApply?: boolean;
}

interface SliderControl {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onValueChange: (value: number) => void;
}

const ImageEnhancementPanel: React.FC<ImageEnhancementPanelProps> = ({
  visible,
  imageUri,
  onEnhancementComplete,
  onClose,
  showPreview = true,
  autoApply = false,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<EnhancementPreset | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeTab, setActiveTab] = useState<'presets' | 'color' | 'brightness' | 'blackwhite' | 'noise' | 'sharpening'>('presets');

  // Enhancement options
  const [colorOptions, setColorOptions] = useState<ColorCorrectionOptions>({
    autoWhiteBalance: true,
    autoContrast: true,
    saturation: 0,
    vibrance: 0,
    temperature: 0,
    tint: 0,
  });

  const [brightnessOptions, setBrightnessOptions] = useState<BrightnessContrastOptions>({
    brightness: 0,
    contrast: 0,
    highlights: 0,
    shadows: 0,
    gamma: 1.0,
  });

  const [blackWhiteOptions, setBlackWhiteOptions] = useState<BlackWhiteOptions>({
    mode: 'auto',
    redChannel: 1.0,
    greenChannel: 1.0,
    blueChannel: 1.0,
    contrast: 0,
    brightness: 0,
  });

  const [noiseOptions, setNoiseOptions] = useState<NoiseReductionOptions>({
    strength: 0.5,
    preserveDetails: true,
    luminanceNoise: 0.5,
    colorNoise: 0.5,
  });

  const [sharpeningOptions, setSharpeningOptions] = useState<SharpeningOptions>({
    strength: 1.0,
    radius: 1.0,
    threshold: 0.0,
    unsharpMask: false,
  });

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // Services
  const enhancementService = useRef(AdvancedImageEnhancement.getInstance()).current;
  const [presets, setPresets] = useState<EnhancementPreset[]>([]);

  useEffect(() => {
    if (visible) {
      startAnimations();
      loadPresets();
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

  const loadPresets = () => {
    const availablePresets = enhancementService.getPresets();
    setPresets(availablePresets);
    if (availablePresets.length > 0) {
      setSelectedPreset(availablePresets[0]);
    }
  };

  const applyEnhancement = async (options?: any) => {
    if (!imageUri) {
      Alert.alert('Error', 'No image provided for enhancement.');
      return;
    }

    try {
      setIsProcessing(true);
      console.log('Applying image enhancement...');

      let result: EnhancementResult;

      if (selectedPreset && !options) {
        // Apply preset
        result = await enhancementService.applyPreset(imageUri, selectedPreset.id);
      } else {
        // Apply custom options
        result = await enhancementService.enhanceImage(imageUri, {
          colorCorrection: colorOptions,
          brightnessContrast: brightnessOptions,
          blackWhite: blackWhiteOptions,
          noiseReduction: noiseOptions,
          sharpening: sharpeningOptions,
          ...options,
        });
      }

      // Haptic feedback
      Vibration.vibrate(100);

      // Notify completion
      onEnhancementComplete(result);

      console.log('Image enhancement completed successfully');
    } catch (error) {
      console.error('Image enhancement failed:', error);
      Alert.alert('Error', 'Failed to enhance image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetToDefaults = () => {
    setColorOptions({
      autoWhiteBalance: true,
      autoContrast: true,
      saturation: 0,
      vibrance: 0,
      temperature: 0,
      tint: 0,
    });
    setBrightnessOptions({
      brightness: 0,
      contrast: 0,
      highlights: 0,
      shadows: 0,
      gamma: 1.0,
    });
    setBlackWhiteOptions({
      mode: 'auto',
      redChannel: 1.0,
      greenChannel: 1.0,
      blueChannel: 1.0,
      contrast: 0,
      brightness: 0,
    });
    setNoiseOptions({
      strength: 0.5,
      preserveDetails: true,
      luminanceNoise: 0.5,
      colorNoise: 0.5,
    });
    setSharpeningOptions({
      strength: 1.0,
      radius: 1.0,
      threshold: 0.0,
      unsharpMask: false,
    });
    setSelectedPreset(null);
  };

  const renderSlider = (control: SliderControl) => (
    <View style={styles.sliderContainer}>
      <View style={styles.sliderHeader}>
        <Text style={styles.sliderLabel}>{control.label}</Text>
        <Text style={styles.sliderValue}>
          {control.value.toFixed(control.step < 1 ? 2 : 0)}{control.unit || ''}
        </Text>
      </View>
      <View style={styles.sliderTrack}>
        <View 
          style={[
            styles.sliderFill,
            { 
              width: `${((control.value - control.min) / (control.max - control.min)) * 100}%` 
            }
          ]} 
        />
        <View 
          style={[
            styles.sliderThumb,
            { 
              left: `${((control.value - control.min) / (control.max - control.min)) * 100}%` 
            }
          ]} 
        />
      </View>
    </View>
  );

  const renderPresetsTab = () => (
    <Animated.View style={[styles.tabContent, { opacity: fadeAnim }]}>
      <Text style={styles.tabTitle}>Enhancement Presets</Text>
      <ScrollView style={styles.presetsList} showsVerticalScrollIndicator={false}>
        {presets.map((preset) => (
          <TouchableOpacity
            key={preset.id}
            style={[
              styles.presetItem,
              selectedPreset?.id === preset.id && styles.selectedPresetItem,
            ]}
            onPress={() => setSelectedPreset(preset)}
          >
            <LinearGradient
              colors={
                selectedPreset?.id === preset.id
                  ? ['rgba(76,175,80,0.8)', 'rgba(139,195,74,0.6)']
                  : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']
              }
              style={styles.presetGradient}
            >
              <View style={styles.presetHeader}>
                <Text style={styles.presetName}>{preset.name}</Text>
                {selectedPreset?.id === preset.id && (
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                )}
              </View>
              <Text style={styles.presetDescription}>{preset.description}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Animated.View>
  );

  const renderColorTab = () => (
    <Animated.View style={[styles.tabContent, { opacity: fadeAnim }]}>
      <Text style={styles.tabTitle}>Color Correction</Text>
      <ScrollView style={styles.controlsList} showsVerticalScrollIndicator={false}>
        {renderSlider({
          label: 'Saturation',
          value: colorOptions.saturation,
          min: -1,
          max: 1,
          step: 0.1,
          onValueChange: (value) => setColorOptions(prev => ({ ...prev, saturation: value })),
        })}
        {renderSlider({
          label: 'Vibrance',
          value: colorOptions.vibrance,
          min: -1,
          max: 1,
          step: 0.1,
          onValueChange: (value) => setColorOptions(prev => ({ ...prev, vibrance: value })),
        })}
        {renderSlider({
          label: 'Temperature',
          value: colorOptions.temperature,
          min: -100,
          max: 100,
          step: 5,
          unit: 'K',
          onValueChange: (value) => setColorOptions(prev => ({ ...prev, temperature: value })),
        })}
        {renderSlider({
          label: 'Tint',
          value: colorOptions.tint,
          min: -100,
          max: 100,
          step: 5,
          onValueChange: (value) => setColorOptions(prev => ({ ...prev, tint: value })),
        })}
      </ScrollView>
    </Animated.View>
  );

  const renderBrightnessTab = () => (
    <Animated.View style={[styles.tabContent, { opacity: fadeAnim }]}>
      <Text style={styles.tabTitle}>Brightness & Contrast</Text>
      <ScrollView style={styles.controlsList} showsVerticalScrollIndicator={false}>
        {renderSlider({
          label: 'Brightness',
          value: brightnessOptions.brightness,
          min: -1,
          max: 1,
          step: 0.1,
          onValueChange: (value) => setBrightnessOptions(prev => ({ ...prev, brightness: value })),
        })}
        {renderSlider({
          label: 'Contrast',
          value: brightnessOptions.contrast,
          min: -1,
          max: 1,
          step: 0.1,
          onValueChange: (value) => setBrightnessOptions(prev => ({ ...prev, contrast: value })),
        })}
        {renderSlider({
          label: 'Highlights',
          value: brightnessOptions.highlights,
          min: -1,
          max: 1,
          step: 0.1,
          onValueChange: (value) => setBrightnessOptions(prev => ({ ...prev, highlights: value })),
        })}
        {renderSlider({
          label: 'Shadows',
          value: brightnessOptions.shadows,
          min: -1,
          max: 1,
          step: 0.1,
          onValueChange: (value) => setBrightnessOptions(prev => ({ ...prev, shadows: value })),
        })}
        {renderSlider({
          label: 'Gamma',
          value: brightnessOptions.gamma,
          min: 0.1,
          max: 3,
          step: 0.1,
          onValueChange: (value) => setBrightnessOptions(prev => ({ ...prev, gamma: value })),
        })}
      </ScrollView>
    </Animated.View>
  );

  const renderBlackWhiteTab = () => (
    <Animated.View style={[styles.tabContent, { opacity: fadeAnim }]}>
      <Text style={styles.tabTitle}>Black & White</Text>
      <ScrollView style={styles.controlsList} showsVerticalScrollIndicator={false}>
        <View style={styles.modeSelector}>
          <Text style={styles.modeLabel}>Mode:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['auto', 'manual', 'high_contrast', 'sepia', 'vintage'].map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.modeButton,
                  blackWhiteOptions.mode === mode && styles.selectedModeButton,
                ]}
                onPress={() => setBlackWhiteOptions(prev => ({ ...prev, mode: mode as any }))}
              >
                <Text style={styles.modeButtonText}>
                  {mode.charAt(0).toUpperCase() + mode.slice(1).replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        {blackWhiteOptions.mode === 'manual' && (
          <>
            {renderSlider({
              label: 'Red Channel',
              value: blackWhiteOptions.redChannel,
              min: 0,
              max: 2,
              step: 0.1,
              onValueChange: (value) => setBlackWhiteOptions(prev => ({ ...prev, redChannel: value })),
            })}
            {renderSlider({
              label: 'Green Channel',
              value: blackWhiteOptions.greenChannel,
              min: 0,
              max: 2,
              step: 0.1,
              onValueChange: (value) => setBlackWhiteOptions(prev => ({ ...prev, greenChannel: value })),
            })}
            {renderSlider({
              label: 'Blue Channel',
              value: blackWhiteOptions.blueChannel,
              min: 0,
              max: 2,
              step: 0.1,
              onValueChange: (value) => setBlackWhiteOptions(prev => ({ ...prev, blueChannel: value })),
            })}
          </>
        )}
        
        {renderSlider({
          label: 'Contrast',
          value: blackWhiteOptions.contrast,
          min: -1,
          max: 1,
          step: 0.1,
          onValueChange: (value) => setBlackWhiteOptions(prev => ({ ...prev, contrast: value })),
        })}
        {renderSlider({
          label: 'Brightness',
          value: blackWhiteOptions.brightness,
          min: -1,
          max: 1,
          step: 0.1,
          onValueChange: (value) => setBlackWhiteOptions(prev => ({ ...prev, brightness: value })),
        })}
      </ScrollView>
    </Animated.View>
  );

  const renderNoiseTab = () => (
    <Animated.View style={[styles.tabContent, { opacity: fadeAnim }]}>
      <Text style={styles.tabTitle}>Noise Reduction</Text>
      <ScrollView style={styles.controlsList} showsVerticalScrollIndicator={false}>
        {renderSlider({
          label: 'Strength',
          value: noiseOptions.strength,
          min: 0,
          max: 1,
          step: 0.1,
          onValueChange: (value) => setNoiseOptions(prev => ({ ...prev, strength: value })),
        })}
        {renderSlider({
          label: 'Luminance Noise',
          value: noiseOptions.luminanceNoise,
          min: 0,
          max: 1,
          step: 0.1,
          onValueChange: (value) => setNoiseOptions(prev => ({ ...prev, luminanceNoise: value })),
        })}
        {renderSlider({
          label: 'Color Noise',
          value: noiseOptions.colorNoise,
          min: 0,
          max: 1,
          step: 0.1,
          onValueChange: (value) => setNoiseOptions(prev => ({ ...prev, colorNoise: value })),
        })}
      </ScrollView>
    </Animated.View>
  );

  const renderSharpeningTab = () => (
    <Animated.View style={[styles.tabContent, { opacity: fadeAnim }]}>
      <Text style={styles.tabTitle}>Sharpening</Text>
      <ScrollView style={styles.controlsList} showsVerticalScrollIndicator={false}>
        {renderSlider({
          label: 'Strength',
          value: sharpeningOptions.strength,
          min: 0,
          max: 2,
          step: 0.1,
          onValueChange: (value) => setSharpeningOptions(prev => ({ ...prev, strength: value })),
        })}
        {renderSlider({
          label: 'Radius',
          value: sharpeningOptions.radius,
          min: 0.5,
          max: 5,
          step: 0.1,
          onValueChange: (value) => setSharpeningOptions(prev => ({ ...prev, radius: value })),
        })}
        {renderSlider({
          label: 'Threshold',
          value: sharpeningOptions.threshold,
          min: 0,
          max: 1,
          step: 0.1,
          onValueChange: (value) => setSharpeningOptions(prev => ({ ...prev, threshold: value })),
        })}
      </ScrollView>
    </Animated.View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'presets':
        return renderPresetsTab();
      case 'color':
        return renderColorTab();
      case 'brightness':
        return renderBrightnessTab();
      case 'blackwhite':
        return renderBlackWhiteTab();
      case 'noise':
        return renderNoiseTab();
      case 'sharpening':
        return renderSharpeningTab();
      default:
        return renderPresetsTab();
    }
  };

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {[
          { id: 'presets', label: 'Presets', icon: 'sparkles' },
          { id: 'color', label: 'Color', icon: 'color-palette' },
          { id: 'brightness', label: 'Brightness', icon: 'sunny' },
          { id: 'blackwhite', label: 'B&W', icon: 'contrast' },
          { id: 'noise', label: 'Noise', icon: 'remove-circle' },
          { id: 'sharpening', label: 'Sharpen', icon: 'flash' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && styles.activeTab,
            ]}
            onPress={() => setActiveTab(tab.id as any)}
          >
            <Ionicons 
              name={tab.icon as any} 
              size={16} 
              color={activeTab === tab.id ? '#4CAF50' : 'rgba(255,255,255,0.7)'} 
            />
            <Text style={[
              styles.tabText,
              activeTab === tab.id && styles.activeTabText,
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderActionButtons = () => (
    <View style={styles.actionButtons}>
      <TouchableOpacity
        style={styles.resetButton}
        onPress={resetToDefaults}
      >
        <LinearGradient
          colors={['#666', '#555']}
          style={styles.resetButtonGradient}
        >
          <Ionicons name="refresh" size={16} color="white" />
          <Text style={styles.resetButtonText}>Reset</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.applyButton}
        onPress={() => applyEnhancement()}
        disabled={isProcessing}
      >
        <LinearGradient
          colors={
            isProcessing
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
            {isProcessing ? 'Processing...' : 'Apply'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.panel, { 
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ],
        }]}>
          <LinearGradient
            colors={['rgba(0,0,0,0.9)', 'rgba(0,0,0,0.8)']}
            style={styles.panelGradient}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Image Enhancement</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>

            {/* Tabs */}
            {renderTabs()}

            {/* Tab Content */}
            <View style={styles.content}>
              {renderTabContent()}
            </View>

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
    justifyContent: 'flex-end',
  },
  panel: {
    maxHeight: SCREEN_HEIGHT * 0.8,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  panelGradient: {
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
  tabsContainer: {
    marginBottom: 20,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  activeTab: {
    backgroundColor: 'rgba(76,175,80,0.3)',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  tabText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  activeTabText: {
    color: '#4CAF50',
  },
  content: {
    flex: 1,
    marginBottom: 20,
  },
  tabContent: {
    flex: 1,
  },
  tabTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  presetsList: {
    flex: 1,
  },
  presetItem: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  presetGradient: {
    padding: 16,
  },
  presetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  presetName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  presetDescription: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  selectedPresetItem: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  controlsList: {
    flex: 1,
  },
  sliderContainer: {
    marginBottom: 20,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sliderLabel: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  sliderValue: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  sliderTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    position: 'relative',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  sliderThumb: {
    position: 'absolute',
    top: -6,
    width: 16,
    height: 16,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    marginLeft: -8,
  },
  modeSelector: {
    marginBottom: 20,
  },
  modeLabel: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  modeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  selectedModeButton: {
    backgroundColor: 'rgba(76,175,80,0.3)',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  modeButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resetButton: {
    flex: 1,
    marginRight: 8,
  },
  resetButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  resetButtonText: {
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

export default ImageEnhancementPanel;
