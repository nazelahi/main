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
import { AdvancedOCR, OCRResult, LanguageSupport } from '../utils/advancedOCR';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface HandwritingRecognitionProps {
  visible: boolean;
  imageUri: string;
  onHandwritingRecognized: (result: OCRResult) => void;
  onClose: () => void;
  language?: string;
  enableRealTime?: boolean;
}

const HandwritingRecognition: React.FC<HandwritingRecognitionProps> = ({
  visible,
  imageUri,
  onHandwritingRecognized,
  onClose,
  language = 'en',
  enableRealTime = false,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(enableRealTime);
  const [handwritingResult, setHandwritingResult] = useState<OCRResult | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [processingTime, setProcessingTime] = useState(0);
  const [availableLanguages, setAvailableLanguages] = useState<LanguageSupport[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Services
  const ocrService = useRef(AdvancedOCR.getInstance()).current;

  useEffect(() => {
    if (visible && imageUri) {
      startAnimations();
      loadLanguages();
      if (isRealTimeEnabled) {
        startRealTimeRecognition();
      }
    } else {
      stopAnimations();
      stopRealTimeRecognition();
    }

    return () => {
      stopAnimations();
      stopRealTimeRecognition();
    };
  }, [visible, imageUri, isRealTimeEnabled]);

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

    // Start pulsing animation
    startPulseAnimation();
  };

  const stopAnimations = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(50);
    scaleAnim.setValue(0.9);
    pulseAnim.stopAnimation();
  };

  const startPulseAnimation = () => {
    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (isProcessing) {
          pulse();
        }
      });
    };
    pulse();
  };

  const loadLanguages = () => {
    const languages = ocrService.getSupportedLanguages();
    setAvailableLanguages(languages);
  };

  const startRealTimeRecognition = () => {
    // Simulate real-time handwriting recognition
    const interval = setInterval(async () => {
      if (isRealTimeEnabled && imageUri) {
        await performHandwritingRecognition();
      }
    }, 2000);

    return () => clearInterval(interval);
  };

  const stopRealTimeRecognition = () => {
    // Stop real-time recognition
  };

  const performHandwritingRecognition = async () => {
    try {
      setIsProcessing(true);
      console.log('Recognizing handwriting...');

      const startTime = Date.now();
      
      const result = await ocrService.recognizeHandwriting(imageUri, {
        language: selectedLanguage,
        enableHandwriting: true,
      });

      const processingTime = Date.now() - startTime;
      
      setHandwritingResult(result);
      setConfidence(result.confidence);
      setProcessingTime(processingTime);

      // Haptic feedback for successful recognition
      Vibration.vibrate(100);

      console.log('Handwriting recognition completed:', {
        confidence: result.confidence,
        processingTime: processingTime,
        textLength: result.text.length
      });
    } catch (error) {
      console.error('Handwriting recognition failed:', error);
      Alert.alert('Error', 'Failed to recognize handwriting. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLanguageChange = (newLanguage: string) => {
    setSelectedLanguage(newLanguage);
    setShowLanguageSelector(false);
  };

  const saveResult = () => {
    if (handwritingResult) {
      onHandwritingRecognized(handwritingResult);
      Vibration.vibrate(100);
    }
  };

  const renderLanguageSelector = () => (
    <Animated.View style={[
      styles.languageSelector,
      {
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      },
    ]}>
      <LinearGradient
        colors={['rgba(0,0,0,0.9)', 'rgba(0,0,0,0.8)']}
        style={styles.languageSelectorGradient}
      >
        <Text style={styles.languageSelectorTitle}>Select Language</Text>
        <ScrollView style={styles.languageList} showsVerticalScrollIndicator={false}>
          {availableLanguages.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.languageItem,
                selectedLanguage === lang.code && styles.selectedLanguageItem,
              ]}
              onPress={() => handleLanguageChange(lang.code)}
            >
              <Text style={styles.languageName}>{lang.name}</Text>
              <Text style={styles.languageNativeName}>{lang.nativeName}</Text>
              {selectedLanguage === lang.code && (
                <Ionicons name="checkmark" size={20} color="#4CAF50" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity
          style={styles.closeLanguageSelector}
          onPress={() => setShowLanguageSelector(false)}
        >
          <Text style={styles.closeLanguageSelectorText}>Close</Text>
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );

  const renderHandwritingPreview = () => {
    if (!handwritingResult) return null;

    return (
      <Animated.View style={[
        styles.previewContainer,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}>
        <LinearGradient
          colors={['rgba(76,175,80,0.8)', 'rgba(139,195,74,0.6)']}
          style={styles.previewGradient}
        >
          <View style={styles.previewHeader}>
            <Ionicons name="create" size={24} color="white" />
            <Text style={styles.previewTitle}>Handwriting Recognized</Text>
          </View>
          <ScrollView style={styles.previewTextContainer} showsVerticalScrollIndicator={false}>
            <Text style={styles.previewText}>{handwritingResult.text}</Text>
          </ScrollView>
          <View style={styles.previewStats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Confidence</Text>
              <Text style={styles.statValue}>{Math.round(confidence * 100)}%</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Processing Time</Text>
              <Text style={styles.statValue}>{processingTime}ms</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Words</Text>
              <Text style={styles.statValue}>{handwritingResult.totalWords}</Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

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
              <Text style={styles.title}>Handwriting Recognition</Text>
              <View style={styles.headerButtons}>
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={() => setShowLanguageSelector(true)}
                >
                  <Ionicons name="language" size={20} color="white" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.headerButton} onPress={onClose}>
                  <Ionicons name="close" size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Content */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Recognition Status */}
              <View style={styles.section}>
                <View style={styles.statusContainer}>
                  <Animated.View style={[
                    styles.statusIndicator,
                    {
                      transform: [{ scale: pulseAnim }],
                    },
                  ]}>
                    <Ionicons 
                      name={isProcessing ? "create" : "create-outline"} 
                      size={24} 
                      color={isProcessing ? "#4CAF50" : "#FF9800"} 
                    />
                  </Animated.View>
                  <View style={styles.statusText}>
                    <Text style={styles.statusTitle}>
                      {isProcessing ? 'Recognizing Handwriting...' : 'Ready to Recognize'}
                    </Text>
                    <Text style={styles.statusSubtitle}>
                      Language: {selectedLanguage.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Real-time Toggle */}
              <View style={styles.section}>
                <View style={styles.switchContainer}>
                  <Text style={styles.switchLabel}>Real-time Recognition</Text>
                  <Switch
                    value={isRealTimeEnabled}
                    onValueChange={setIsRealTimeEnabled}
                    trackColor={{ false: '#767577', true: '#4CAF50' }}
                    thumbColor={isRealTimeEnabled ? '#fff' : '#f4f3f4'}
                  />
                </View>
              </View>

              {/* Handwriting Preview */}
              {renderHandwritingPreview()}

              {/* Recognition Tips */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recognition Tips</Text>
                <View style={styles.tipsContainer}>
                  <View style={styles.tipItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                    <Text style={styles.tipText}>Ensure good lighting for better recognition</Text>
                  </View>
                  <View style={styles.tipItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                    <Text style={styles.tipText}>Write clearly and legibly</Text>
                  </View>
                  <View style={styles.tipItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                    <Text style={styles.tipText}>Keep the camera steady</Text>
                  </View>
                  <View style={styles.tipItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                    <Text style={styles.tipText}>Select the correct language</Text>
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.recognizeButton}
                onPress={performHandwritingRecognition}
                disabled={isProcessing}
              >
                <LinearGradient
                  colors={
                    isProcessing
                      ? ['#666', '#555']
                      : ['#4CAF50', '#45a049']
                  }
                  style={styles.recognizeButtonGradient}
                >
                  <Ionicons 
                    name={isProcessing ? "hourglass" : "create"} 
                    size={16} 
                    color="white" 
                  />
                  <Text style={styles.recognizeButtonText}>
                    {isProcessing ? 'Recognizing...' : 'Recognize Handwriting'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {handwritingResult && (
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={saveResult}
                >
                  <LinearGradient
                    colors={['#2196F3', '#1976D2']}
                    style={styles.saveButtonGradient}
                  >
                    <Ionicons name="checkmark" size={16} color="white" />
                    <Text style={styles.saveButtonText}>Save Result</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          </LinearGradient>
        </Animated.View>
      </Animated.View>

      {/* Language Selector */}
      {showLanguageSelector && renderLanguageSelector()}
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
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  content: {
    flex: 1,
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
  },
  statusIndicator: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  statusText: {
    flex: 1,
  },
  statusTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
  },
  switchLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  previewContainer: {
    marginBottom: 16,
  },
  previewGradient: {
    borderRadius: 12,
    padding: 16,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  previewTextContainer: {
    maxHeight: 120,
    marginBottom: 12,
  },
  previewText: {
    color: 'white',
    fontSize: 14,
    lineHeight: 20,
  },
  previewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tipsContainer: {
    gap: 8,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
  },
  tipText: {
    color: 'white',
    fontSize: 14,
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recognizeButton: {
    flex: 1,
    marginRight: 8,
  },
  recognizeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  recognizeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  saveButton: {
    flex: 1,
    marginLeft: 8,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  languageSelector: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1001,
  },
  languageSelectorGradient: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  languageSelectorTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  languageList: {
    maxHeight: SCREEN_HEIGHT * 0.6,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
  },
  selectedLanguageItem: {
    backgroundColor: 'rgba(76,175,80,0.3)',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  languageName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  languageNativeName: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  closeLanguageSelector: {
    marginTop: 20,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    alignItems: 'center',
  },
  closeLanguageSelectorText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HandwritingRecognition;
