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
  AdvancedCameraControls, 
  CameraPreset,
} from '../utils/advancedCameraControls';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface QuickCameraSettingsProps {
  visible: boolean;
  onSettingsChange: (settings: any) => void;
  onClose: () => void;
  documentType?: string;
  lightingCondition?: 'bright' | 'normal' | 'low' | 'mixed';
}

interface QuickSetting {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string[];
  presetId?: string;
  settings?: any;
}

const QuickCameraSettings: React.FC<QuickCameraSettingsProps> = ({
  visible,
  onSettingsChange,
  onClose,
  documentType = 'document',
  lightingCondition = 'normal',
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState<string | null>(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Services
  const cameraControls = useRef(AdvancedCameraControls.getInstance()).current;

  // Quick camera settings
  const quickSettings: QuickSetting[] = [
    {
      id: 'auto_optimize',
      name: 'Auto Optimize',
      icon: 'sparkles',
      description: 'Automatically optimize camera for current conditions',
      color: ['#4CAF50', '#45a049'],
      settings: { autoOptimize: true },
    },
    {
      id: 'document_standard',
      name: 'Document Mode',
      icon: 'document-text',
      description: 'Optimized for standard document scanning',
      color: ['#2196F3', '#1976D2'],
      presetId: 'document_standard',
    },
    {
      id: 'low_light',
      name: 'Low Light',
      icon: 'moon',
      description: 'Optimized for low light conditions',
      color: ['#FF9800', '#F57C00'],
      presetId: 'document_low_light',
    },
    {
      id: 'receipt_scan',
      name: 'Receipt Scan',
      icon: 'receipt',
      description: 'Optimized for small receipt scanning',
      color: ['#9C27B0', '#7B1FA2'],
      presetId: 'receipt_scanning',
    },
    {
      id: 'photo_scan',
      name: 'Photo Scan',
      icon: 'image',
      description: 'Optimized for photo and image scanning',
      color: ['#E91E63', '#C2185B'],
      presetId: 'photo_scanning',
    },
    {
      id: 'text_optimized',
      name: 'Text Optimized',
      icon: 'text',
      description: 'Optimized for text document scanning',
      color: ['#607D8B', '#455A64'],
      presetId: 'text_optimized',
    },
    {
      id: 'mixed_lighting',
      name: 'Mixed Lighting',
      icon: 'partly-sunny',
      description: 'Optimized for mixed lighting conditions',
      color: ['#FF5722', '#D84315'],
      presetId: 'mixed_lighting',
    },
    {
      id: 'hdr_mode',
      name: 'HDR Mode',
      icon: 'contrast',
      description: 'Enable HDR for difficult lighting',
      color: ['#795548', '#5D4037'],
      settings: {
        hdr: {
          enabled: true,
          mode: 'auto',
          strength: 0.7,
        },
      },
    },
    {
      id: 'macro_focus',
      name: 'Macro Focus',
      icon: 'scan',
      description: 'Enable macro focus for close-up scanning',
      color: ['#3F51B5', '#303F9F'],
      settings: {
        focus: {
          mode: 'macro',
          sensitivity: 0.9,
          stabilization: true,
        },
      },
    },
    {
      id: 'high_resolution',
      name: 'High Resolution',
      icon: 'resize',
      description: 'Maximum resolution for detailed scanning',
      color: ['#009688', '#00695C'],
      settings: {
        resolution: {
          quality: 'ultra',
          compression: 0.95,
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

  const applySetting = async (setting: QuickSetting) => {
    try {
      setIsProcessing(true);
      setSelectedSetting(setting.id);
      console.log(`Applying camera setting: ${setting.name}`);

      let result;

      if (setting.presetId) {
        // Apply preset
        result = await cameraControls.applyPreset(setting.presetId);
      } else if (setting.settings) {
        // Apply custom settings
        result = await cameraControls.autoConfigure(lightingCondition);
        
        // Apply additional custom settings
        if (setting.settings.hdr) {
          await cameraControls.configureHDR(setting.settings.hdr);
        }
        if (setting.settings.focus) {
          await cameraControls.configureFocus(setting.settings.focus);
        }
        if (setting.settings.resolution) {
          await cameraControls.configureResolution(setting.settings.resolution);
        }
        
        result = {
          success: true,
          settings: cameraControls.getCurrentSettings(),
          processingTime: 0,
        };
      } else {
        throw new Error('No settings provided');
      }

      if (result.success) {
        // Notify parent component
        onSettingsChange(result.settings);
        
        // Haptic feedback
        Vibration.vibrate(100);
        
        console.log(`${setting.name} applied successfully`);
      } else {
        Alert.alert('Error', result.error || `Failed to apply ${setting.name}`);
      }
    } catch (error) {
      console.error(`Failed to apply ${setting.name}:`, error);
      Alert.alert('Error', `Failed to apply ${setting.name}. Please try again.`);
    } finally {
      setIsProcessing(false);
      setSelectedSetting(null);
    }
  };

  const renderQuickSetting = (setting: QuickSetting) => {
    const isSelected = selectedSetting === setting.id;
    const isProcessing = isSelected && selectedSetting === setting.id;

    return (
      <TouchableOpacity
        key={setting.id}
        style={[styles.settingItem, isSelected && styles.selectedSettingItem]}
        onPress={() => applySetting(setting)}
        disabled={isProcessing}
      >
        <LinearGradient
          colors={isSelected ? setting.color : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
          style={styles.settingGradient}
        >
          <View style={styles.settingContent}>
            <View style={styles.settingIcon}>
              <Ionicons 
                name={isProcessing ? "hourglass" : setting.icon as any} 
                size={24} 
                color="white" 
              />
            </View>
            <View style={styles.settingText}>
              <Text style={styles.settingName}>{setting.name}</Text>
              <Text style={styles.settingDescription}>{setting.description}</Text>
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
              <Text style={styles.title}>Quick Camera Settings</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>

            {/* Settings Grid */}
            <ScrollView 
              style={styles.settingsList}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.settingsContent}
            >
              {quickSettings.map(renderQuickSetting)}
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Select a setting to optimize your camera for scanning
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
  settingsList: {
    flex: 1,
  },
  settingsContent: {
    paddingBottom: 10,
  },
  settingItem: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  selectedSettingItem: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  settingGradient: {
    padding: 16,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingText: {
    flex: 1,
  },
  settingName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
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

export default QuickCameraSettings;
