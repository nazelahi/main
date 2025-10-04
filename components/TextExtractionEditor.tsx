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
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AdvancedOCR, TextBlock, OCRResult, LanguageSupport } from '../utils/advancedOCR';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface TextExtractionEditorProps {
  visible: boolean;
  imageUri: string;
  onTextExtracted: (result: OCRResult) => void;
  onClose: () => void;
  language?: string;
  enableEditing?: boolean;
  showSuggestions?: boolean;
}

interface TextSuggestion {
  id: string;
  original: string;
  suggestion: string;
  confidence: number;
  type: 'correction' | 'alternative' | 'completion';
}

const TextExtractionEditor: React.FC<TextExtractionEditorProps> = ({
  visible,
  imageUri,
  onTextExtracted,
  onClose,
  language = 'en',
  enableEditing = true,
  showSuggestions = true,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [editableText, setEditableText] = useState('');
  const [suggestions, setSuggestions] = useState<TextSuggestion[]>([]);
  const [selectedTextBlock, setSelectedTextBlock] = useState<TextBlock | null>(null);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [availableLanguages, setAvailableLanguages] = useState<LanguageSupport[]>([]);
  const [currentLanguage, setCurrentLanguage] = useState(language);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // Services
  const ocrService = useRef(AdvancedOCR.getInstance()).current;

  useEffect(() => {
    if (visible && imageUri) {
      startAnimations();
      loadLanguages();
      extractText();
    } else {
      stopAnimations();
    }

    return () => {
      stopAnimations();
    };
  }, [visible, imageUri]);

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

  const loadLanguages = () => {
    const languages = ocrService.getSupportedLanguages();
    setAvailableLanguages(languages);
  };

  const extractText = async () => {
    try {
      setIsProcessing(true);
      console.log('Extracting text...');

      const result = await ocrService.extractText(imageUri, {
        language: currentLanguage,
        enableHandwriting: true,
      });

      setOcrResult({
        text: result.text,
        textBlocks: result.textBlocks,
        confidence: 0.85,
        language: currentLanguage,
        processingTime: 1000,
        imageWidth: SCREEN_WIDTH,
        imageHeight: SCREEN_HEIGHT,
        totalWords: result.text.split(' ').length,
        totalLines: result.text.split('\n').length,
        isHandwriting: false,
        metadata: {
          timestamp: Date.now(),
          imageUri,
          ocrEngine: 'google',
          version: '1.0.0',
        },
      });

      setEditableText(result.editableText);
      generateSuggestions(result.editableText);

      console.log('Text extraction completed');
    } catch (error) {
      console.error('Text extraction failed:', error);
      Alert.alert('Error', 'Failed to extract text from image');
    } finally {
      setIsProcessing(false);
    }
  };

  const generateSuggestions = (text: string) => {
    const words = text.split(' ');
    const textSuggestions: TextSuggestion[] = [];

    words.forEach((word, index) => {
      if (word.length > 2) {
        // Generate correction suggestions
        const corrections = generateCorrections(word);
        corrections.forEach((correction, i) => {
          textSuggestions.push({
            id: `correction_${index}_${i}`,
            original: word,
            suggestion: correction,
            confidence: 0.8,
            type: 'correction',
          });
        });

        // Generate alternative suggestions
        const alternatives = generateAlternatives(word);
        alternatives.forEach((alternative, i) => {
          textSuggestions.push({
            id: `alternative_${index}_${i}`,
            original: word,
            suggestion: alternative,
            confidence: 0.6,
            type: 'alternative',
          });
        });
      }
    });

    setSuggestions(textSuggestions.slice(0, 20)); // Limit to 20 suggestions
  };

  const generateCorrections = (word: string): string[] => {
    const corrections: string[] = [];
    
    // Common OCR error corrections
    const errorMap: { [key: string]: string[] } = {
      '0': ['O', 'o'],
      '1': ['I', 'l'],
      '5': ['S', 's'],
      '8': ['B', 'b'],
      '6': ['G', 'g'],
    };

    Object.entries(errorMap).forEach(([error, corrections]) => {
      if (word.includes(error)) {
        corrections.forEach(correction => {
          corrections.push(word.replace(error, correction));
        });
      }
    });

    return corrections;
  };

  const generateAlternatives = (word: string): string[] => {
    // Simple alternative generation based on common words
    const alternatives: string[] = [];
    
    if (word.length > 3) {
      // Add common variations
      alternatives.push(word.toLowerCase());
      alternatives.push(word.toUpperCase());
      alternatives.push(word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
    }

    return alternatives;
  };

  const applySuggestion = (suggestion: TextSuggestion) => {
    const newText = editableText.replace(suggestion.original, suggestion.suggestion);
    setEditableText(newText);
    
    // Remove applied suggestion
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    
    Vibration.vibrate(50);
  };

  const handleLanguageChange = async (newLanguage: string) => {
    setCurrentLanguage(newLanguage);
    setShowLanguageSelector(false);
    
    // Re-extract text with new language
    await extractText();
  };

  const saveExtractedText = () => {
    if (ocrResult) {
      const updatedResult = {
        ...ocrResult,
        text: editableText,
      };
      
      onTextExtracted(updatedResult);
      Vibration.vibrate(100);
    }
  };

  const renderTextBlock = (block: TextBlock, index: number) => (
    <TouchableOpacity
      key={block.id}
      style={[
        styles.textBlock,
        selectedTextBlock?.id === block.id && styles.selectedTextBlock,
      ]}
      onPress={() => setSelectedTextBlock(block)}
    >
      <LinearGradient
        colors={
          selectedTextBlock?.id === block.id
            ? ['rgba(33,150,243,0.8)', 'rgba(3,169,244,0.6)']
            : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']
        }
        style={styles.textBlockGradient}
      >
        <Text style={styles.textBlockText}>{block.text}</Text>
        <View style={styles.textBlockInfo}>
          <Text style={styles.confidenceText}>
            {Math.round(block.confidence * 100)}%
          </Text>
          {block.isHandwriting && (
            <Ionicons name="create" size={12} color="rgba(255,255,255,0.7)" />
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderSuggestion = (suggestion: TextSuggestion) => (
    <TouchableOpacity
      key={suggestion.id}
      style={styles.suggestionItem}
      onPress={() => applySuggestion(suggestion)}
    >
      <LinearGradient
        colors={['rgba(76,175,80,0.8)', 'rgba(139,195,74,0.6)']}
        style={styles.suggestionGradient}
      >
        <View style={styles.suggestionContent}>
          <Text style={styles.suggestionOriginal}>{suggestion.original}</Text>
          <Ionicons name="arrow-forward" size={16} color="white" />
          <Text style={styles.suggestionText}>{suggestion.suggestion}</Text>
        </View>
        <Text style={styles.suggestionType}>
          {suggestion.type.charAt(0).toUpperCase() + suggestion.type.slice(1)}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );

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
                currentLanguage === lang.code && styles.selectedLanguageItem,
              ]}
              onPress={() => handleLanguageChange(lang.code)}
            >
              <Text style={styles.languageName}>{lang.name}</Text>
              <Text style={styles.languageNativeName}>{lang.nativeName}</Text>
              {currentLanguage === lang.code && (
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

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <Animated.View style={[
        styles.overlay,
        { opacity: fadeAnim }
      ]}>
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
              <Text style={styles.title}>Text Extraction & Editing</Text>
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

            {isProcessing ? (
              <View style={styles.loadingContainer}>
                <Ionicons name="hourglass" size={48} color="rgba(255,255,255,0.7)" />
                <Text style={styles.loadingText}>Extracting text...</Text>
              </View>
            ) : (
              <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Text Blocks */}
                {ocrResult && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Detected Text Blocks</Text>
                    <View style={styles.textBlocksContainer}>
                      {ocrResult.textBlocks.map((block, index) => renderTextBlock(block, index))}
                    </View>
                  </View>
                )}

                {/* Editable Text */}
                {enableEditing && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Editable Text</Text>
                    <TextInput
                      style={styles.textInput}
                      value={editableText}
                      onChangeText={setEditableText}
                      multiline
                      placeholder="Edit extracted text here..."
                      placeholderTextColor="rgba(255,255,255,0.5)"
                    />
                  </View>
                )}

                {/* Suggestions */}
                {showSuggestions && suggestions.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Suggestions</Text>
                    <FlatList
                      data={suggestions}
                      renderItem={({ item }) => renderSuggestion(item)}
                      keyExtractor={(item) => item.id}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.suggestionsList}
                    />
                  </View>
                )}

                {/* OCR Statistics */}
                {ocrResult && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>OCR Statistics</Text>
                    <View style={styles.statsContainer}>
                      <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Confidence</Text>
                        <Text style={styles.statValue}>
                          {Math.round(ocrResult.confidence * 100)}%
                        </Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Words</Text>
                        <Text style={styles.statValue}>{ocrResult.totalWords}</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Lines</Text>
                        <Text style={styles.statValue}>{ocrResult.totalLines}</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Language</Text>
                        <Text style={styles.statValue}>{ocrResult.language}</Text>
                      </View>
                    </View>
                  </View>
                )}
              </ScrollView>
            )}

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
                style={styles.saveButton}
                onPress={saveExtractedText}
                disabled={!ocrResult}
              >
                <LinearGradient
                  colors={
                    !ocrResult
                      ? ['#666', '#555']
                      : ['#4CAF50', '#45a049']
                  }
                  style={styles.saveButtonGradient}
                >
                  <Ionicons name="checkmark" size={16} color="white" />
                  <Text style={styles.saveButtonText}>Save Text</Text>
                </LinearGradient>
              </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 16,
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
  textBlocksContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  textBlock: {
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  selectedTextBlock: {
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  textBlockGradient: {
    padding: 12,
    minWidth: 100,
  },
  textBlockText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  textBlockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  confidenceText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 16,
    color: 'white',
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  suggestionsList: {
    paddingRight: 16,
  },
  suggestionItem: {
    marginRight: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  suggestionGradient: {
    padding: 12,
    minWidth: 120,
  },
  suggestionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  suggestionOriginal: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8,
  },
  suggestionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  suggestionType: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    flex: 1,
    minWidth: 80,
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
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

export default TextExtractionEditor;
