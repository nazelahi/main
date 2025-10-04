import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
  Animated,
  ScrollView,
  TextInput,
  Alert,
  Vibration,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AdvancedOCR, OCRResult, SearchablePDFOptions } from '../utils/advancedOCR';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SearchablePDFGeneratorProps {
  visible: boolean;
  imageUri: string;
  ocrResult: OCRResult | null;
  onPDFGenerated: (pdfUri: string) => void;
  onClose: () => void;
  defaultOptions?: Partial<SearchablePDFOptions>;
}

const SearchablePDFGenerator: React.FC<SearchablePDFGeneratorProps> = ({
  visible,
  imageUri,
  ocrResult,
  onPDFGenerated,
  onClose,
  defaultOptions = {},
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfOptions, setPdfOptions] = useState<SearchablePDFOptions>({
    includeText: true,
    includeImages: true,
    compressionLevel: 6,
    metadata: {
      title: 'Scanned Document',
      author: 'Document Scanner',
      subject: 'OCR Generated PDF',
      keywords: ['OCR', 'Scanned', 'Searchable'],
    },
    textLayer: {
      font: 'Arial',
      fontSize: 12,
      color: '#000000',
    },
    ...defaultOptions,
  });
  const [customMetadata, setCustomMetadata] = useState({
    title: pdfOptions.metadata.title,
    author: pdfOptions.metadata.author,
    subject: pdfOptions.metadata.subject,
    keywords: pdfOptions.metadata.keywords.join(', '),
  });

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // Services
  const ocrService = useRef(AdvancedOCR.getInstance()).current;

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

  const generatePDF = async () => {
    if (!ocrResult) {
      Alert.alert('Error', 'No OCR result available for PDF generation');
      return;
    }

    try {
      setIsGenerating(true);
      console.log('Generating searchable PDF...');

      // Update metadata with custom values
      const updatedOptions = {
        ...pdfOptions,
        metadata: {
          ...pdfOptions.metadata,
          title: customMetadata.title,
          author: customMetadata.author,
          subject: customMetadata.subject,
          keywords: customMetadata.keywords.split(',').map(k => k.trim()).filter(k => k),
        },
      };

      const pdfUri = await ocrService.generateSearchablePDF(imageUri, ocrResult, updatedOptions);
      
      // Haptic feedback
      Vibration.vibrate(100);
      
      // Notify parent component
      onPDFGenerated(pdfUri);
      
      console.log('Searchable PDF generated successfully');
    } catch (error) {
      console.error('PDF generation failed:', error);
      Alert.alert('Error', 'Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const updatePdfOption = (key: keyof SearchablePDFOptions, value: any) => {
    setPdfOptions(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const updateMetadata = (key: keyof typeof customMetadata, value: string) => {
    setCustomMetadata(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const updateTextLayer = (key: keyof SearchablePDFOptions['textLayer'], value: any) => {
    setPdfOptions(prev => ({
      ...prev,
      textLayer: {
        ...prev.textLayer,
        [key]: value,
      },
    }));
  };

  const renderSlider = (label: string, value: number, min: number, max: number, onValueChange: (value: number) => void) => (
    <View style={styles.sliderContainer}>
      <Text style={styles.sliderLabel}>{label}</Text>
      <View style={styles.sliderTrack}>
        <View 
          style={[
            styles.sliderFill,
            { 
              width: `${((value - min) / (max - min)) * 100}%` 
            }
          ]} 
        />
        <View 
          style={[
            styles.sliderThumb,
            { 
              left: `${((value - min) / (max - min)) * 100}%` 
            }
          ]} 
        />
      </View>
      <Text style={styles.sliderValue}>{value}</Text>
    </View>
  );

  const renderSwitch = (label: string, value: boolean, onValueChange: (value: boolean) => void) => (
    <View style={styles.switchContainer}>
      <Text style={styles.switchLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#767577', true: '#4CAF50' }}
        thumbColor={value ? '#fff' : '#f4f3f4'}
      />
    </View>
  );

  const renderTextInput = (label: string, value: string, onChangeText: (text: string) => void, multiline = false) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.textInput, multiline && styles.multilineInput]}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        placeholder={`Enter ${label.toLowerCase()}...`}
        placeholderTextColor="rgba(255,255,255,0.5)"
      />
    </View>
  );

  const renderFontSelector = () => (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorLabel}>Font Family</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {['Arial', 'Times New Roman', 'Courier New', 'Helvetica', 'Georgia'].map((font) => (
          <TouchableOpacity
            key={font}
            style={[
              styles.fontButton,
              pdfOptions.textLayer.font === font && styles.selectedFontButton,
            ]}
            onPress={() => updateTextLayer('font', font)}
          >
            <Text style={styles.fontButtonText}>{font}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderColorSelector = () => (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorLabel}>Text Color</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {[
          { name: 'Black', value: '#000000' },
          { name: 'Dark Gray', value: '#333333' },
          { name: 'Blue', value: '#0000FF' },
          { name: 'Red', value: '#FF0000' },
          { name: 'Green', value: '#008000' },
        ].map((color) => (
          <TouchableOpacity
            key={color.value}
            style={[
              styles.colorButton,
              pdfOptions.textLayer.color === color.value && styles.selectedColorButton,
            ]}
            onPress={() => updateTextLayer('color', color.value)}
          >
            <View style={[styles.colorPreview, { backgroundColor: color.value }]} />
            <Text style={styles.colorButtonText}>{color.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
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
              <Text style={styles.title}>Searchable PDF Generator</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* PDF Options */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>PDF Options</Text>
                
                {renderSwitch('Include Text Layer', pdfOptions.includeText, (value) => updatePdfOption('includeText', value))}
                {renderSwitch('Include Images', pdfOptions.includeImages, (value) => updatePdfOption('includeImages', value))}
                
                {renderSlider(
                  'Compression Level',
                  pdfOptions.compressionLevel,
                  0,
                  9,
                  (value) => updatePdfOption('compressionLevel', value)
                )}
              </View>

              {/* Metadata */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Document Metadata</Text>
                
                {renderTextInput('Title', customMetadata.title, (value) => updateMetadata('title', value))}
                {renderTextInput('Author', customMetadata.author, (value) => updateMetadata('author', value))}
                {renderTextInput('Subject', customMetadata.subject, (value) => updateMetadata('subject', value))}
                {renderTextInput('Keywords', customMetadata.keywords, (value) => updateMetadata('keywords', value))}
              </View>

              {/* Text Layer Settings */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Text Layer Settings</Text>
                
                {renderFontSelector()}
                {renderColorSelector()}
                
                {renderSlider(
                  'Font Size',
                  pdfOptions.textLayer.fontSize,
                  8,
                  24,
                  (value) => updateTextLayer('fontSize', value)
                )}
              </View>

              {/* OCR Preview */}
              {ocrResult && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>OCR Preview</Text>
                  <View style={styles.previewContainer}>
                    <Text style={styles.previewText} numberOfLines={5}>
                      {ocrResult.text}
                    </Text>
                    <View style={styles.previewStats}>
                      <Text style={styles.previewStat}>
                        {ocrResult.totalWords} words • {ocrResult.totalLines} lines
                      </Text>
                      <Text style={styles.previewStat}>
                        {Math.round(ocrResult.confidence * 100)}% confidence
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Action Buttons */}
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
                style={styles.generateButton}
                onPress={generatePDF}
                disabled={isGenerating || !ocrResult}
              >
                <LinearGradient
                  colors={
                    isGenerating || !ocrResult
                      ? ['#666', '#555']
                      : ['#4CAF50', '#45a049']
                  }
                  style={styles.generateButtonGradient}
                >
                  <Ionicons 
                    name={isGenerating ? "hourglass" : "document-text"} 
                    size={16} 
                    color="white" 
                  />
                  <Text style={styles.generateButtonText}>
                    {isGenerating ? 'Generating...' : 'Generate PDF'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
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
    marginBottom: 16,
  },
  sliderContainer: {
    marginBottom: 20,
  },
  sliderLabel: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
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
  sliderValue: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    marginTop: 4,
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
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 12,
    color: 'white',
    fontSize: 14,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  selectorContainer: {
    marginBottom: 20,
  },
  selectorLabel: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  fontButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  selectedFontButton: {
    backgroundColor: 'rgba(76,175,80,0.3)',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  fontButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  colorButton: {
    alignItems: 'center',
    marginRight: 12,
  },
  selectedColorButton: {
    opacity: 0.8,
  },
  colorPreview: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginBottom: 4,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  colorButtonText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '500',
  },
  previewContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 16,
  },
  previewText: {
    color: 'white',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  previewStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  previewStat: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
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
  generateButton: {
    flex: 1,
    marginLeft: 8,
  },
  generateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  generateButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default SearchablePDFGenerator;
