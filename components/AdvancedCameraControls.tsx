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
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { 
  AdvancedCameraControls, 
  CameraPreset,
  FlashMode,
  HDRSettings,
  FocusSettings,
  ExposureSettings,
  WhiteBalanceSettings,
  ResolutionSettings,
} from '../utils/advancedCameraControls';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AdvancedCameraControlsProps {
  visible: boolean;
  onSettingsChange: (settings: any) => void;
  onClose: () => void;
  documentType?: string;
  lightingCondition?: 'bright' | 'normal' | 'low' | 'mixed';
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

const AdvancedCameraControlsComponent: React.FC<AdvancedCameraControlsProps> = ({
  visible,
  onSettingsChange,
  onClose,
  documentType = 'document',
  lightingCondition = 'normal',
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'flash' | 'hdr' | 'focus' | 'exposure' | 'whitebalance' | 'resolution'>('presets');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPreset, setCurrentPreset] = useState<CameraPreset | null>(null);

  // Camera settings
  const [flashSettings, setFlashSettings] = useState<FlashMode>({
    mode: 'auto',
    intensity: 0.5,
    redEyeReduction: false,
  });

  const [hdrSettings, setHdrSettings] = useState<HDRSettings>({
    enabled: false,
    mode: 'auto',
    exposureBracketing: 3,
    mergeAlgorithm: 'hdr',
    toneMapping: 'reinhard',
    strength: 0.5,
  });

  const [focusSettings, setFocusSettings] = useState<FocusSettings>({
    mode: 'auto',
    point: null,
    distance: 1.0,
    sensitivity: 0.7,
    stabilization: true,
  });

  const [exposureSettings, setExposureSettings] = useState<ExposureSettings>({
    mode: 'auto',
    compensation: 0,
    iso: 100,
    shutterSpeed: 1/60,
    aperture: 2.8,
    metering: 'matrix',
  });

  const [whiteBalanceSettings, setWhiteBalanceSettings] = useState<WhiteBalanceSettings>({
    mode: 'auto',
    temperature: 5500,
    tint: 0,
    preset: 'daylight',
  });

  const [resolutionSettings, setResolutionSettings] = useState<ResolutionSettings>({
    width: 1920,
    height: 1080,
    aspectRatio: 16/9,
    quality: 'high',
    compression: 0.85,
    format: 'jpeg',
  });

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // Services
  const cameraControls = useRef(AdvancedCameraControls.getInstance()).current;
  const [presets, setPresets] = useState<CameraPreset[]>([]);

  useEffect(() => {
    if (visible) {
      startAnimations();
      loadPresets();
      autoConfigure();
    } else {
      stopAnimations();
    }

    return () => {
      stopAnimations();
    };
  }, [visible, documentType, lightingCondition]);

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
    const availablePresets = cameraControls.getPresets();
    setPresets(availablePresets);
    
    // Find preset for current document type and lighting
    const matchingPreset = availablePresets.find(p => 
      p.documentType === documentType && p.lightingCondition === lightingCondition
    );
    
    if (matchingPreset) {
      setCurrentPreset(matchingPreset);
    }
  };

  const autoConfigure = async () => {
    try {
      setIsProcessing(true);
      const result = await cameraControls.autoConfigure(lightingCondition);
      
      if (result.success) {
        // Update local state with auto-configured settings
        setFlashSettings(result.settings.flash);
        setHdrSettings(result.settings.hdr);
        setFocusSettings(result.settings.focus);
        setExposureSettings(result.settings.exposure);
        setWhiteBalanceSettings(result.settings.whiteBalance);
        setResolutionSettings(result.settings.resolution);
        
        // Notify parent component
        onSettingsChange(result.settings);
      }
    } catch (error) {
      console.error('Auto-configuration failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const applyPreset = async (preset: CameraPreset) => {
    try {
      setIsProcessing(true);
      const result = await cameraControls.applyPreset(preset.id);
      
      if (result.success) {
        setCurrentPreset(preset);
        
        // Update local state
        setFlashSettings(result.settings.flash);
        setHdrSettings(result.settings.hdr);
        setFocusSettings(result.settings.focus);
        setExposureSettings(result.settings.exposure);
        setWhiteBalanceSettings(result.settings.whiteBalance);
        setResolutionSettings(result.settings.resolution);
        
        // Notify parent component
        onSettingsChange(result.settings);
        
        Vibration.vibrate(100);
      } else {
        Alert.alert('Error', result.error || 'Failed to apply preset');
      }
    } catch (error) {
      console.error('Failed to apply preset:', error);
      Alert.alert('Error', 'Failed to apply preset');
    } finally {
      setIsProcessing(false);
    }
  };

  const updateSettings = async (settings: any) => {
    try {
      // Update local state
      if (settings.flash) setFlashSettings(prev => ({ ...prev, ...settings.flash }));
      if (settings.hdr) setHdrSettings(prev => ({ ...prev, ...settings.hdr }));
      if (settings.focus) setFocusSettings(prev => ({ ...prev, ...settings.focus }));
      if (settings.exposure) setExposureSettings(prev => ({ ...prev, ...settings.exposure }));
      if (settings.whiteBalance) setWhiteBalanceSettings(prev => ({ ...prev, ...settings.whiteBalance }));
      if (settings.resolution) setResolutionSettings(prev => ({ ...prev, ...settings.resolution }));
      
      // Notify parent component
      onSettingsChange(settings);
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
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
      <Text style={styles.tabTitle}>Camera Presets</Text>
      <ScrollView style={styles.presetsList} showsVerticalScrollIndicator={false}>
        {presets.map((preset) => (
          <TouchableOpacity
            key={preset.id}
            style={[
              styles.presetItem,
              currentPreset?.id === preset.id && styles.selectedPresetItem,
            ]}
            onPress={() => applyPreset(preset)}
          >
            <LinearGradient
              colors={
                currentPreset?.id === preset.id
                  ? ['rgba(76,175,80,0.8)', 'rgba(139,195,74,0.6)']
                  : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']
              }
              style={styles.presetGradient}
            >
              <View style={styles.presetHeader}>
                <Text style={styles.presetName}>{preset.name}</Text>
                {currentPreset?.id === preset.id && (
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                )}
              </View>
              <Text style={styles.presetDescription}>{preset.description}</Text>
              <View style={styles.presetTags}>
                <Text style={styles.presetTag}>{preset.documentType}</Text>
                <Text style={styles.presetTag}>{preset.lightingCondition}</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Animated.View>
  );

  const renderFlashTab = () => (
    <Animated.View style={[styles.tabContent, { opacity: fadeAnim }]}>
      <Text style={styles.tabTitle}>Flash Settings</Text>
      <ScrollView style={styles.controlsList} showsVerticalScrollIndicator={false}>
        <View style={styles.modeSelector}>
          <Text style={styles.modeLabel}>Flash Mode:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['off', 'on', 'auto', 'torch'].map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.modeButton,
                  flashSettings.mode === mode && styles.selectedModeButton,
                ]}
                onPress={() => updateSettings({ flash: { mode } })}
              >
                <Text style={styles.modeButtonText}>
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {flashSettings.mode === 'torch' && (
          <>
            {renderSlider({
              label: 'Intensity',
              value: flashSettings.intensity || 0.5,
              min: 0,
              max: 1,
              step: 0.1,
              onValueChange: (value) => updateSettings({ flash: { intensity: value } }),
            })}
          </>
        )}

        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Red Eye Reduction</Text>
          <Switch
            value={flashSettings.redEyeReduction || false}
            onValueChange={(value) => updateSettings({ flash: { redEyeReduction: value } })}
            trackColor={{ false: '#767577', true: '#4CAF50' }}
            thumbColor={flashSettings.redEyeReduction ? '#fff' : '#f4f3f4'}
          />
        </View>
      </ScrollView>
    </Animated.View>
  );

  const renderHDRTab = () => (
    <Animated.View style={[styles.tabContent, { opacity: fadeAnim }]}>
      <Text style={styles.tabTitle}>HDR Settings</Text>
      <ScrollView style={styles.controlsList} showsVerticalScrollIndicator={false}>
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Enable HDR</Text>
          <Switch
            value={hdrSettings.enabled}
            onValueChange={(value) => updateSettings({ hdr: { enabled: value } })}
            trackColor={{ false: '#767577', true: '#4CAF50' }}
            thumbColor={hdrSettings.enabled ? '#fff' : '#f4f3f4'}
          />
        </View>

        {hdrSettings.enabled && (
          <>
            <View style={styles.modeSelector}>
              <Text style={styles.modeLabel}>HDR Mode:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {['auto', 'manual', 'off'].map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    style={[
                      styles.modeButton,
                      hdrSettings.mode === mode && styles.selectedModeButton,
                    ]}
                    onPress={() => updateSettings({ hdr: { mode } })}
                  >
                    <Text style={styles.modeButtonText}>
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {renderSlider({
              label: 'Strength',
              value: hdrSettings.strength,
              min: 0,
              max: 1,
              step: 0.1,
              onValueChange: (value) => updateSettings({ hdr: { strength: value } }),
            })}

            {renderSlider({
              label: 'Exposure Bracketing',
              value: hdrSettings.exposureBracketing,
              min: 1,
              max: 5,
              step: 1,
              onValueChange: (value) => updateSettings({ hdr: { exposureBracketing: value } }),
            })}
          </>
        )}
      </ScrollView>
    </Animated.View>
  );

  const renderFocusTab = () => (
    <Animated.View style={[styles.tabContent, { opacity: fadeAnim }]}>
      <Text style={styles.tabTitle}>Focus Settings</Text>
      <ScrollView style={styles.controlsList} showsVerticalScrollIndicator={false}>
        <View style={styles.modeSelector}>
          <Text style={styles.modeLabel}>Focus Mode:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['auto', 'manual', 'continuous', 'macro'].map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.modeButton,
                  focusSettings.mode === mode && styles.selectedModeButton,
                ]}
                onPress={() => updateSettings({ focus: { mode } })}
              >
                <Text style={styles.modeButtonText}>
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {renderSlider({
          label: 'Sensitivity',
          value: focusSettings.sensitivity,
          min: 0,
          max: 1,
          step: 0.1,
          onValueChange: (value) => updateSettings({ focus: { sensitivity: value } }),
        })}

        {renderSlider({
          label: 'Distance',
          value: focusSettings.distance,
          min: 0.1,
          max: 10,
          step: 0.1,
          unit: 'm',
          onValueChange: (value) => updateSettings({ focus: { distance: value } }),
        })}

        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Stabilization</Text>
          <Switch
            value={focusSettings.stabilization}
            onValueChange={(value) => updateSettings({ focus: { stabilization: value } })}
            trackColor={{ false: '#767577', true: '#4CAF50' }}
            thumbColor={focusSettings.stabilization ? '#fff' : '#f4f3f4'}
          />
        </View>
      </ScrollView>
    </Animated.View>
  );

  const renderExposureTab = () => (
    <Animated.View style={[styles.tabContent, { opacity: fadeAnim }]}>
      <Text style={styles.tabTitle}>Exposure Settings</Text>
      <ScrollView style={styles.controlsList} showsVerticalScrollIndicator={false}>
        <View style={styles.modeSelector}>
          <Text style={styles.modeLabel}>Exposure Mode:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['auto', 'manual', 'priority'].map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.modeButton,
                  exposureSettings.mode === mode && styles.selectedModeButton,
                ]}
                onPress={() => updateSettings({ exposure: { mode } })}
              >
                <Text style={styles.modeButtonText}>
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {renderSlider({
          label: 'Compensation',
          value: exposureSettings.compensation,
          min: -3,
          max: 3,
          step: 0.1,
          unit: ' EV',
          onValueChange: (value) => updateSettings({ exposure: { compensation: value } }),
        })}

        {exposureSettings.mode === 'manual' && (
          <>
            {renderSlider({
              label: 'ISO',
              value: exposureSettings.iso,
              min: 50,
              max: 3200,
              step: 50,
              onValueChange: (value) => updateSettings({ exposure: { iso: value } }),
            })}

            {renderSlider({
              label: 'Shutter Speed',
              value: exposureSettings.shutterSpeed,
              min: 1/4000,
              max: 1,
              step: 1/1000,
              unit: 's',
              onValueChange: (value) => updateSettings({ exposure: { shutterSpeed: value } }),
            })}

            {renderSlider({
              label: 'Aperture',
              value: exposureSettings.aperture,
              min: 1.4,
              max: 22,
              step: 0.1,
              unit: 'f',
              onValueChange: (value) => updateSettings({ exposure: { aperture: value } }),
            })}
          </>
        )}

        <View style={styles.modeSelector}>
          <Text style={styles.modeLabel}>Metering:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['matrix', 'center', 'spot'].map((metering) => (
              <TouchableOpacity
                key={metering}
                style={[
                  styles.modeButton,
                  exposureSettings.metering === metering && styles.selectedModeButton,
                ]}
                onPress={() => updateSettings({ exposure: { metering } })}
              >
                <Text style={styles.modeButtonText}>
                  {metering.charAt(0).toUpperCase() + metering.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </Animated.View>
  );

  const renderWhiteBalanceTab = () => (
    <Animated.View style={[styles.tabContent, { opacity: fadeAnim }]}>
      <Text style={styles.tabTitle}>White Balance</Text>
      <ScrollView style={styles.controlsList} showsVerticalScrollIndicator={false}>
        <View style={styles.modeSelector}>
          <Text style={styles.modeLabel}>Mode:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['auto', 'manual', 'preset'].map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.modeButton,
                  whiteBalanceSettings.mode === mode && styles.selectedModeButton,
                ]}
                onPress={() => updateSettings({ whiteBalance: { mode } })}
              >
                <Text style={styles.modeButtonText}>
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {whiteBalanceSettings.mode === 'preset' && (
          <View style={styles.modeSelector}>
            <Text style={styles.modeLabel}>Preset:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {['daylight', 'cloudy', 'tungsten', 'fluorescent', 'flash'].map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={[
                    styles.modeButton,
                    whiteBalanceSettings.preset === preset && styles.selectedModeButton,
                  ]}
                  onPress={() => updateSettings({ whiteBalance: { preset } })}
                >
                  <Text style={styles.modeButtonText}>
                    {preset.charAt(0).toUpperCase() + preset.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {whiteBalanceSettings.mode === 'manual' && (
          <>
            {renderSlider({
              label: 'Temperature',
              value: whiteBalanceSettings.temperature,
              min: 2000,
              max: 8000,
              step: 100,
              unit: 'K',
              onValueChange: (value) => updateSettings({ whiteBalance: { temperature: value } }),
            })}

            {renderSlider({
              label: 'Tint',
              value: whiteBalanceSettings.tint,
              min: -100,
              max: 100,
              step: 10,
              onValueChange: (value) => updateSettings({ whiteBalance: { tint: value } }),
            })}
          </>
        )}
      </ScrollView>
    </Animated.View>
  );

  const renderResolutionTab = () => (
    <Animated.View style={[styles.tabContent, { opacity: fadeAnim }]}>
      <Text style={styles.tabTitle}>Resolution Settings</Text>
      <ScrollView style={styles.controlsList} showsVerticalScrollIndicator={false}>
        <View style={styles.modeSelector}>
          <Text style={styles.modeLabel}>Quality:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['low', 'medium', 'high', 'ultra'].map((quality) => (
              <TouchableOpacity
                key={quality}
                style={[
                  styles.modeButton,
                  resolutionSettings.quality === quality && styles.selectedModeButton,
                ]}
                onPress={() => updateSettings({ resolution: { quality } })}
              >
                <Text style={styles.modeButtonText}>
                  {quality.charAt(0).toUpperCase() + quality.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {renderSlider({
          label: 'Compression',
          value: resolutionSettings.compression,
          min: 0.1,
          max: 1,
          step: 0.05,
          onValueChange: (value) => updateSettings({ resolution: { compression: value } }),
        })}

        <View style={styles.modeSelector}>
          <Text style={styles.modeLabel}>Format:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['jpeg', 'png', 'heic'].map((format) => (
              <TouchableOpacity
                key={format}
                style={[
                  styles.modeButton,
                  resolutionSettings.format === format && styles.selectedModeButton,
                ]}
                onPress={() => updateSettings({ resolution: { format } })}
              >
                <Text style={styles.modeButtonText}>
                  {format.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.resolutionInfo}>
          <Text style={styles.resolutionText}>
            Current: {resolutionSettings.width} × {resolutionSettings.height}
          </Text>
          <Text style={styles.resolutionText}>
            Aspect Ratio: {resolutionSettings.aspectRatio.toFixed(2)}
          </Text>
        </View>
      </ScrollView>
    </Animated.View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'presets':
        return renderPresetsTab();
      case 'flash':
        return renderFlashTab();
      case 'hdr':
        return renderHDRTab();
      case 'focus':
        return renderFocusTab();
      case 'exposure':
        return renderExposureTab();
      case 'whitebalance':
        return renderWhiteBalanceTab();
      case 'resolution':
        return renderResolutionTab();
      default:
        return renderPresetsTab();
    }
  };

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {[
          { id: 'presets', label: 'Presets', icon: 'settings' },
          { id: 'flash', label: 'Flash', icon: 'flash' },
          { id: 'hdr', label: 'HDR', icon: 'contrast' },
          { id: 'focus', label: 'Focus', icon: 'scan' },
          { id: 'exposure', label: 'Exposure', icon: 'sunny' },
          { id: 'whitebalance', label: 'WB', icon: 'color-palette' },
          { id: 'resolution', label: 'Resolution', icon: 'resize' },
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
        style={styles.autoButton}
        onPress={autoConfigure}
        disabled={isProcessing}
      >
        <LinearGradient
          colors={isProcessing ? ['#666', '#555'] : ['#2196F3', '#1976D2']}
          style={styles.autoButtonGradient}
        >
          <Ionicons 
            name={isProcessing ? "hourglass" : "refresh"} 
            size={16} 
            color="white" 
          />
          <Text style={styles.autoButtonText}>
            {isProcessing ? 'Configuring...' : 'Auto Configure'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.closeButton}
        onPress={onClose}
      >
        <LinearGradient
          colors={['#4CAF50', '#45a049']}
          style={styles.closeButtonGradient}
        >
          <Ionicons name="checkmark" size={16} color="white" />
          <Text style={styles.closeButtonText}>Done</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View style={[
          styles.panel,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim },
            ],
          },
        ]}>
          <LinearGradient
            colors={['rgba(0,0,0,0.9)', 'rgba(0,0,0,0.8)']}
            style={styles.panelGradient}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Camera Controls</Text>
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
    marginBottom: 8,
  },
  presetTags: {
    flexDirection: 'row',
    gap: 8,
  },
  presetTag: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '500',
    backgroundColor: 'rgba(76,175,80,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
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
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingVertical: 8,
  },
  switchLabel: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  resolutionInfo: {
    marginTop: 20,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
  },
  resolutionText: {
    color: 'white',
    fontSize: 14,
    marginBottom: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  autoButton: {
    flex: 1,
    marginRight: 8,
  },
  autoButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  autoButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  closeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default AdvancedCameraControlsComponent;
