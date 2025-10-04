import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  FlatList,
  Image,
  Dimensions,
  ScrollView,
  Animated,
  StatusBar,
  Platform,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
// // // import * as MediaLibrary from 'expo-media-library';
import DocumentTypeSelector from './DocumentTypeSelector';
import BatchManager from './BatchManager';
import { DocumentType, DOCUMENT_TYPES } from '../config/documentTypes';
import { ScannedDocument, exportBatchAsPDF, sharePDF } from '../utils/pdfExport';
import { DesignSystem, createGradientStyle, createTextStyle } from '../config/designSystem';
import ExportOptionsModal from './ExportOptionsModal';
import AIInsightsModal from './AIInsightsModal';
import SmartOrganizationModal from './SmartOrganizationModal';
import { DocumentData } from '../utils/enhancedExport';
// // import { generateInsights, organizeDocuments } from '../utils/aiFeatures';

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2;

interface HomeScreenProps {
  scannedImages: string[];
  onStartScan?: () => void;
  onViewDocuments: () => void;
  onImagePress: (imageUri: string) => void;
  onBatchComplete: (documents: ScannedDocument[]) => void;
  onSmartScan: () => void;
  onQuickScan?: () => void;
  onBatchScan?: () => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({
  scannedImages,
  onStartScan,
  onViewDocuments,
  onImagePress,
  onBatchComplete,
  onSmartScan,
  onQuickScan,
  onBatchScan,
}) => {
  const [recentDocuments, setRecentDocuments] = useState<string[]>([]);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [scaleAnim] = useState(new Animated.Value(0.9));
  const [showDocumentTypeSelector, setShowDocumentTypeSelector] = useState(false);
  const [showBatchManager, setShowBatchManager] = useState(false);
  const [scannerMode, setScannerMode] = useState<'quick' | 'batch' | 'smart'>('quick');
  const [selectedDocumentType, setSelectedDocumentType] = useState<DocumentType | null>(null);
  const [currentBatch, setCurrentBatch] = useState<ScannedDocument[]>([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [showSmartOrganization, setShowSmartOrganization] = useState(false);
  const [showScanModeSelector, setShowScanModeSelector] = useState(false);
  
  // Animation refs for floating elements
  const floatingAnim1 = useRef(new Animated.Value(0)).current;
  const floatingAnim2 = useRef(new Animated.Value(0)).current;
  const floatingAnim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Get the 6 most recent documents
    setRecentDocuments(scannedImages.slice(0, 6));
    
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Floating animations
    const createFloatingAnimation = (animValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration: 3000 + delay * 1000,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 3000 + delay * 1000,
            useNativeDriver: true,
          }),
        ])
      );
    };

    createFloatingAnimation(floatingAnim1, 0).start();
    createFloatingAnimation(floatingAnim2, 1).start();
    createFloatingAnimation(floatingAnim3, 2).start();
  }, [currentBatch]);

  const renderDocumentCard = ({ item: imageUri, index }: { item: string; index: number }) => (
    <Animated.View
      style={[
        styles.documentCard,
        {
          transform: [
            {
              translateY: floatingAnim1.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -5],
              }),
            },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.documentCardContent}
        onPress={() => onImagePress(imageUri)}
        activeOpacity={0.7}
      >
        <View style={styles.documentImageContainer}>
          <Image source={{ uri: imageUri }} style={styles.documentImage} />
          <View style={styles.documentGradientOverlay} />
        </View>
        
        <BlurView intensity={20} style={styles.documentBlurOverlay}>
          <View style={styles.documentInfo}>
            <Text style={styles.documentTitle}>Doc {index + 1}</Text>
            <Text style={styles.documentDate}>Just now</Text>
          </View>
          <View style={styles.documentActionButton}>
            <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.8)" />
          </View>
        </BlurView>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderDocumentListItem = ({ item: imageUri, index }: { item: string; index: number }) => (
    <Animated.View
      style={[
        styles.documentListItem,
        {
          transform: [
            {
              translateY: floatingAnim1.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -3],
              }),
            },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.documentListItemContent}
        onPress={() => onImagePress(imageUri)}
        activeOpacity={0.7}
      >
        <View style={styles.documentListImageContainer}>
          <Image source={{ uri: imageUri }} style={styles.documentListImage} />
        </View>
        
        <View style={styles.documentListInfo}>
          <Text style={styles.documentListTitle}>Document {index + 1}</Text>
          <Text style={styles.documentListDate}>Scanned just now</Text>
        </View>
        
        <View style={styles.documentListAction}>
          <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.6)" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderEmptyState = () => (
    <Animated.View
      style={[
        styles.emptyState,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: slideAnim,
            },
            {
              scale: scaleAnim,
            },
          ],
        },
      ]}
    >
      <View style={styles.emptyStateContent}>
        <Animated.View
          style={[
            styles.emptyIconContainer,
            {
              transform: [
                {
                  scale: floatingAnim2.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.1],
                  }),
                },
              ],
            },
          ]}
        >
          <Ionicons name="scan-outline" size={48} color="rgba(255,255,255,0.8)" />
        </Animated.View>
        
        <Text style={styles.emptyTitle}>Ready to Scan?</Text>
        <Text style={styles.emptySubtitle}>
          Transform your documents into digital files with our smart scanning technology
        </Text>
        
        <TouchableOpacity style={styles.emptyActionButton} onPress={handleUnifiedScan}>
          <BlurView intensity={20} style={styles.emptyActionBlur}>
            <LinearGradient
              {...createGradientStyle(DesignSystem.colors.gradients.primary)}
              style={styles.emptyActionGradient}
            >
              <Ionicons name="scan" size={20} color="rgba(255,255,255,0.9)" />
              <Text style={styles.emptyActionText}>Start Scanning</Text>
            </LinearGradient>
          </BlurView>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const getDocumentStats = () => {
    const totalDocs = scannedImages.length;
    const recentDocs = recentDocuments.length;
    return { totalDocs, recentDocs };
  };

  const handleUnifiedScan = () => {
    setShowScanModeSelector(true);
  };

  const handleScanModeSelected = (mode: 'quick' | 'batch' | 'smart') => {
    setScannerMode(mode);
    setShowScanModeSelector(false);
    
    if (mode === 'quick' && onQuickScan) {
      onQuickScan();
    } else if (mode === 'batch' && onBatchScan) {
      onBatchScan();
    } else if (mode === 'smart' && onSmartScan) {
      onSmartScan();
    } else if (mode === 'batch') {
      // Fallback: show document type selector first
      setShowDocumentTypeSelector(true);
    }
  };

  const handleDocumentTypeSelected = (type: DocumentType) => {
    setSelectedDocumentType(type);
    setShowDocumentTypeSelector(false);
    // After selecting document type, trigger batch scan
    if (onBatchScan) {
      onBatchScan();
    }
  };

  const handleBatchComplete = (documents: ScannedDocument[]) => {
    setCurrentBatch(documents);
    setShowBatchManager(true);
  };

  const handleExportPDF = async (documents: ScannedDocument[]) => {
    try {
      if (!selectedDocumentType) return;
      
      const { pdfUri, filename } = await exportBatchAsPDF(
        documents,
        selectedDocumentType.name,
        { quality: 'high' }
      );
      
      await sharePDF(pdfUri, filename);
      onBatchComplete(documents);
      setShowBatchManager(false);
      setCurrentBatch([]);
      setSelectedDocumentType(null);
    } catch (error) {
      console.error('PDF export failed:', error);
    }
  };

  const handleDeleteDocument = (documentId: string) => {
    setCurrentBatch(prev => prev.filter(doc => doc.id !== documentId));
  };

  const handleReorderDocuments = (documents: ScannedDocument[]) => {
    setCurrentBatch(documents);
  };

  const convertToDocumentData = (documents: ScannedDocument[]): DocumentData[] => {
    return documents.map(doc => ({
      id: doc.id,
      uri: doc.uri,
      title: doc.side === 'single' ? 'Scanned Document' : `${doc.side} Side`,
      timestamp: doc.timestamp,
      metadata: {
        fileSize: 0,
        dimensions: { width: 1200, height: 1600 },
        quality: 0.8
      }
    }));
  };

  // const handleExportAll = () => {
  //   const allDocuments = convertToDocumentData(currentBatch);
  //   setShowExportModal(true);
  // };

  const handleAIInsights = () => {
    setShowAIInsights(true);
  };

  const handleSmartOrganization = () => {
    setShowSmartOrganization(true);
  };

  const stats = getDocumentStats();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Background Gradient */}
      <LinearGradient
        {...createGradientStyle(DesignSystem.colors.gradients.primary)}
        style={styles.backgroundGradient}
      />
      
      {/* Floating Background Elements */}
      <Animated.View
        style={[
          styles.floatingElement1,
          {
            transform: [
              {
                translateY: floatingAnim1.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -20],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.floatingElement2,
          {
            transform: [
              {
                translateY: floatingAnim2.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -15],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.floatingElement3,
          {
            transform: [
              {
                translateY: floatingAnim3.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -25],
                }),
              },
            ],
          },
        ]}
      />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
          {/* Modern Header */}
          <Animated.View
            style={[
              styles.header,
              {
                transform: [
                  {
                    translateY: slideAnim,
                  },
                ],
              },
            ]}
          >
            <BlurView intensity={30} style={styles.headerBlur}>
              <View style={styles.headerContent}>
                <View style={styles.headerText}>
                  <Text style={styles.appTitle}>DocScan Pro</Text>
                  <Text style={styles.appSubtitle}>AI-powered document scanning</Text>
                </View>
                <Animated.View
                  style={[
                    styles.headerIcon,
                    {
                      transform: [
                        {
                          scale: floatingAnim1.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 1.05],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <Ionicons name="scan" size={28} color="rgba(255,255,255,0.8)" />
                </Animated.View>
              </View>
            </BlurView>
          </Animated.View>

          {/* Modern Stats Cards */}
          <Animated.View
            style={[
              styles.statsContainer,
              {
                transform: [
                  {
                    translateY: slideAnim,
                  },
                ],
              },
            ]}
          >
            <BlurView intensity={20} style={styles.statCard}>
              <View style={styles.statContent}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="document-text" size={24} color="rgba(255,255,255,0.7)" />
                </View>
                <View style={styles.statInfo}>
                  <Text style={styles.statNumber}>{stats.totalDocs}</Text>
                  <Text style={styles.statLabel}>Documents</Text>
                </View>
              </View>
            </BlurView>
            
            <BlurView intensity={20} style={styles.statCard}>
              <View style={styles.statContent}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="time" size={24} color="rgba(255,255,255,0.7)" />
                </View>
                <View style={styles.statInfo}>
                  <Text style={styles.statNumber}>{stats.recentDocs}</Text>
                  <Text style={styles.statLabel}>Recent</Text>
                </View>
              </View>
            </BlurView>
          </Animated.View>

          {/* Modern Action Buttons */}
          <Animated.View
            style={[
              styles.actionsContainer,
              {
                transform: [
                  {
                    translateY: slideAnim,
                  },
                ],
              },
            ]}
          >
            {/* Unified Scan Button */}
            <TouchableOpacity style={styles.unifiedScanAction} onPress={handleUnifiedScan}>
              <BlurView intensity={25} style={styles.actionButtonBlur}>
                <View style={styles.unifiedScanGradient}>
                  <View style={styles.actionIconContainer}>
                    <Ionicons name="scan" size={28} color="rgba(255,255,255,0.9)" />
                  </View>
                  <View style={styles.actionTextContainer}>
                    <Text style={styles.unifiedScanText}>Scan Documents</Text>
                    <Text style={styles.actionSubtext}>Quick • Batch • Smart scanning</Text>
                  </View>
                  <View style={styles.chevronContainer}>
                    <Ionicons name="chevron-down" size={20} color="rgba(255,255,255,0.7)" />
                  </View>
                </View>
              </BlurView>
            </TouchableOpacity>
            
            {scannedImages.length > 0 && (
              <TouchableOpacity style={styles.secondaryAction} onPress={onViewDocuments}>
                <BlurView intensity={20} style={styles.secondaryActionBlur}>
                  <View style={styles.secondaryActionContent}>
                    <Ionicons name="folder-open" size={20} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.secondaryActionText}>View All Documents</Text>
                    <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.7)" />
                  </View>
                </BlurView>
              </TouchableOpacity>
            )}

            {/* AI Features */}
            {scannedImages.length > 0 && (
              <View style={styles.aiFeaturesContainer}>
                <TouchableOpacity style={styles.aiFeatureButton} onPress={handleAIInsights}>
                  <BlurView intensity={20} style={styles.aiFeatureBlur}>
                    <View style={styles.aiFeatureContent}>
                      <Ionicons name="analytics" size={20} color="rgba(255,255,255,0.8)" />
                      <Text style={styles.aiFeatureText}>AI Insights</Text>
                    </View>
                  </BlurView>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.aiFeatureButton} onPress={handleSmartOrganization}>
                  <BlurView intensity={20} style={styles.aiFeatureBlur}>
                    <View style={styles.aiFeatureContent}>
                      <Ionicons name="sparkles" size={20} color="rgba(255,255,255,0.8)" />
                      <Text style={styles.aiFeatureText}>Smart Organize</Text>
                    </View>
                  </BlurView>
                </TouchableOpacity>
              </View>
            )}

          </Animated.View>

          {/* Recent Documents Section */}
          {scannedImages.length > 0 && (
            <Animated.View
              style={[
                styles.recentSection,
                {
                  transform: [
                    {
                      translateY: slideAnim,
                    },
                  ],
                },
              ]}
            >
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Documents</Text>
                <TouchableOpacity onPress={onViewDocuments} style={styles.viewAllButton}>
                  <Text style={styles.viewAllText}>View All</Text>
                  <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.8)" />
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={recentDocuments}
                renderItem={renderDocumentListItem}
                keyExtractor={(item, index) => `${item}-${index}`}
                scrollEnabled={false}
                contentContainerStyle={styles.documentList}
                showsVerticalScrollIndicator={false}
              />
            </Animated.View>
          )}

          {/* Empty State */}
          {scannedImages.length === 0 && (
            <Animated.View
              style={[
                styles.emptyStateContainer,
                {
                  transform: [
                    {
                      translateY: slideAnim,
                    },
                  ],
                },
              ]}
            >
              {renderEmptyState()}
            </Animated.View>
          )}

          {/* Modern Features Section */}
          <Animated.View
            style={[
              styles.featuresSection,
              {
                transform: [
                  {
                    translateY: slideAnim,
                  },
                ],
              },
            ]}
          >
            <Text style={styles.featuresTitle}>Why Choose DocScan Pro?</Text>
            <View style={styles.featuresGrid}>
              <BlurView intensity={15} style={styles.featureItem}>
                <View style={styles.featureIconContainer}>
                  <Ionicons name="scan" size={24} color="rgba(255,255,255,0.7)" />
                </View>
                <Text style={styles.featureTitle}>AI-Powered</Text>
                <Text style={styles.featureDescription}>
                  Smart document detection and enhancement
                </Text>
              </BlurView>
              
              <BlurView intensity={15} style={styles.featureItem}>
                <View style={styles.featureIconContainer}>
                  <Ionicons name="cloud" size={24} color="rgba(255,255,255,0.7)" />
                </View>
                <Text style={styles.featureTitle}>Cloud Sync</Text>
                <Text style={styles.featureDescription}>
                  Access your documents from anywhere
                </Text>
              </BlurView>
              
              <BlurView intensity={15} style={styles.featureItem}>
                <View style={styles.featureIconContainer}>
                  <Ionicons name="search" size={24} color="rgba(255,255,255,0.7)" />
                </View>
                <Text style={styles.featureTitle}>OCR Search</Text>
                <Text style={styles.featureDescription}>
                  Search through document text content
                </Text>
              </BlurView>
              
              <BlurView intensity={15} style={styles.featureItem}>
                <View style={styles.featureIconContainer}>
                  <Ionicons name="share" size={24} color="rgba(255,255,255,0.7)" />
                </View>
                <Text style={styles.featureTitle}>Easy Share</Text>
                <Text style={styles.featureDescription}>
                  Share documents instantly with others
                </Text>
              </BlurView>
            </View>
          </Animated.View>
        </ScrollView>
      </Animated.View>

      {/* Scan Mode Selector Modal */}
      <Modal
        visible={showScanModeSelector}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowScanModeSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.scanModeSelector}>
            <View style={styles.selectorHeader}>
              <Text style={styles.selectorTitle}>Choose Scan Mode</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowScanModeSelector(false)}
              >
                <Ionicons name="close" size={24} color="rgba(255,255,255,0.8)" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modeOptions}>
              <TouchableOpacity 
                style={styles.modeOption}
                onPress={() => handleScanModeSelected('quick')}
              >
                <View style={styles.modeIconContainer}>
                  <Ionicons name="camera" size={24} color="#007AFF" />
                </View>
                <View style={styles.modeInfo}>
                  <Text style={styles.modeTitle}>Quick Scan</Text>
                  <Text style={styles.modeDescription}>Single document scanning</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modeOption}
                onPress={() => handleScanModeSelected('batch')}
              >
                <View style={styles.modeIconContainer}>
                  <Ionicons name="scan" size={24} color="#34C759" />
                </View>
                <View style={styles.modeInfo}>
                  <Text style={styles.modeTitle}>Batch Scan</Text>
                  <Text style={styles.modeDescription}>Multiple documents at once</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modeOption}
                onPress={() => handleScanModeSelected('smart')}
              >
                <View style={styles.modeIconContainer}>
                  <Ionicons name="sparkles" size={24} color="#FF9500" />
                </View>
                <View style={styles.modeInfo}>
                  <Text style={styles.modeTitle}>Smart Scan</Text>
                  <Text style={styles.modeDescription}>AI-powered intelligent scanning</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Document Type Selector Modal */}
      <DocumentTypeSelector
        visible={showDocumentTypeSelector}
        onSelectType={handleDocumentTypeSelected}
        onClose={() => setShowDocumentTypeSelector(false)}
      />


      {/* Batch Manager Modal */}
      {selectedDocumentType && (
        <BatchManager
          visible={showBatchManager}
          documents={currentBatch}
          documentType={selectedDocumentType}
          onClose={() => {
            setShowBatchManager(false);
            setCurrentBatch([]);
            setSelectedDocumentType(null);
          }}
          onExportPDF={handleExportPDF}
          onDeleteDocument={handleDeleteDocument}
          onReorderDocuments={handleReorderDocuments}
        />
      )}

      {/* Export Options Modal */}
      <ExportOptionsModal
        visible={showExportModal}
        onClose={() => setShowExportModal(false)}
        documents={convertToDocumentData(currentBatch)}
        onExportComplete={(result) => {
          console.log('Export completed:', result);
          setShowExportModal(false);
        }}
      />

      {/* AI Insights Modal */}
      <AIInsightsModal
        visible={showAIInsights}
        onClose={() => setShowAIInsights(false)}
        documents={convertToDocumentData(currentBatch)}
        onActionPress={(action, data) => {
          console.log('AI action pressed:', action, data);
        }}
      />

      {/* Smart Organization Modal */}
      <SmartOrganizationModal
        visible={showSmartOrganization}
        onClose={() => setShowSmartOrganization(false)}
        documents={convertToDocumentData(currentBatch)}
        onApplySuggestion={(suggestion) => {
          console.log('Organization suggestion applied:', suggestion);
        }}
        onMoveToFolder={(documentId, folderId) => {
          console.log('Document moved to folder:', documentId, folderId);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  floatingElement1: {
    position: 'absolute',
    top: 100,
    right: 30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  floatingElement2: {
    position: 'absolute',
    top: 200,
    left: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  floatingElement3: {
    position: 'absolute',
    top: 300,
    right: 50,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 30,
    paddingHorizontal: 0,
  },
  headerBlur: {
    borderBottomLeftRadius: DesignSystem.borderRadius['2xl'],
    borderBottomRightRadius: DesignSystem.borderRadius['2xl'],
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderTopWidth: 0,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DesignSystem.spacing.xl,
    paddingVertical: DesignSystem.spacing.xl,
  },
  headerText: {
    flex: 1,
  },
  welcomeText: {
    ...createTextStyle('sm', 'normal'),
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  appTitle: {
    ...createTextStyle('3xl', 'bold'),
    color: DesignSystem.colors.textInverse,
    marginBottom: 6,
  },
  appSubtitle: {
    ...createTextStyle('base', 'normal'),
    color: 'rgba(255,255,255,0.9)',
    lineHeight: DesignSystem.typography.lineHeights.normal * DesignSystem.typography.sizes.base,
  },
  headerIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: DesignSystem.spacing.xl,
    marginTop: -10,
    marginBottom: DesignSystem.spacing.lg,
  },
  statCard: {
    flex: 1,
    borderRadius: DesignSystem.borderRadius.lg,
    marginHorizontal: DesignSystem.spacing.xs,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  statContent: {
    padding: DesignSystem.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DesignSystem.spacing.md,
  },
  statInfo: {
    flex: 1,
  },
  statNumber: {
    ...createTextStyle('lg', 'bold'),
    color: DesignSystem.colors.textInverse,
    marginBottom: 2,
  },
  statLabel: {
    ...createTextStyle('xs', 'medium'),
    color: 'rgba(255,255,255,0.8)',
  },
  actionsContainer: {
    paddingHorizontal: DesignSystem.spacing.xl,
    marginBottom: DesignSystem.spacing.lg,
  },
  actionRow: {
    flexDirection: 'row',
    marginBottom: DesignSystem.spacing.md,
  },
  primaryAction: {
    flex: 1,
    borderRadius: DesignSystem.borderRadius.lg,
    marginRight: DesignSystem.spacing.sm,
    overflow: 'hidden',
  },
  batchAction: {
    flex: 1,
    borderRadius: DesignSystem.borderRadius.lg,
    marginLeft: DesignSystem.spacing.sm,
    overflow: 'hidden',
  },
  actionButtonBlur: {
    borderRadius: DesignSystem.borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: 'rgba(99,102,241,0.8)', // Primary color with opacity
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.9)',
  },
  actionButtonGradient: {
    padding: DesignSystem.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DesignSystem.spacing.md,
  },
  actionTextContainer: {
    flex: 1,
  },
  primaryActionText: {
    ...createTextStyle('base', 'bold'),
    color: DesignSystem.colors.textInverse,
    marginBottom: 2,
  },
  batchActionText: {
    ...createTextStyle('base', 'bold'),
    color: DesignSystem.colors.textInverse,
    marginBottom: 2,
  },
  actionSubtext: {
    ...createTextStyle('xs', 'normal'),
    color: 'rgba(255,255,255,0.8)',
  },
  secondaryAction: {
    borderRadius: DesignSystem.borderRadius.lg,
    marginTop: DesignSystem.spacing.sm,
    overflow: 'hidden',
  },
  secondaryActionBlur: {
    borderRadius: DesignSystem.borderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  secondaryActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DesignSystem.spacing.md,
  },
  secondaryActionText: {
    ...createTextStyle('base', 'semibold'),
    color: DesignSystem.colors.textInverse,
    marginLeft: DesignSystem.spacing.sm,
    flex: 1,
  },
  recentSection: {
    paddingHorizontal: DesignSystem.spacing.xl,
    marginBottom: DesignSystem.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: DesignSystem.spacing.lg,
  },
  sectionTitle: {
    ...createTextStyle('xl', 'bold'),
    color: DesignSystem.colors.textInverse,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    ...createTextStyle('base', 'semibold'),
    color: DesignSystem.colors.textInverse,
    marginRight: DesignSystem.spacing.xs,
  },
  documentGrid: {
    paddingBottom: DesignSystem.spacing.sm,
  },
  documentList: {
    paddingBottom: DesignSystem.spacing.sm,
  },
  documentCard: {
    width: cardWidth,
    height: cardWidth * 1.1,
    margin: DesignSystem.spacing.xs,
    borderRadius: DesignSystem.borderRadius.lg,
    overflow: 'hidden',
  },
  documentCardContent: {
    flex: 1,
    borderRadius: DesignSystem.borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  documentImageContainer: {
    flex: 1,
    position: 'relative',
  },
  documentImage: {
    width: '100%',
    height: '100%',
    backgroundColor: DesignSystem.colors.surfaceVariant,
  },
  documentGradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  documentBlurOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DesignSystem.spacing.md,
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    ...createTextStyle('sm', 'bold'),
    color: DesignSystem.colors.textInverse,
    marginBottom: 2,
  },
  documentDate: {
    ...createTextStyle('xs', 'normal'),
    color: 'rgba(255,255,255,0.8)',
  },
  documentActionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateContainer: {
    paddingHorizontal: DesignSystem.spacing.xl,
    marginBottom: DesignSystem.spacing.xl,
  },
  emptyState: {
    borderRadius: DesignSystem.borderRadius['2xl'],
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  emptyStateContent: {
    padding: DesignSystem.spacing['2xl'],
    alignItems: 'center',
  },
  emptyIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DesignSystem.spacing.lg,
  },
  emptyTitle: {
    ...createTextStyle('xl', 'bold'),
    color: DesignSystem.colors.textInverse,
    marginBottom: DesignSystem.spacing.sm,
  },
  emptySubtitle: {
    ...createTextStyle('sm', 'normal'),
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: DesignSystem.typography.lineHeights.relaxed * DesignSystem.typography.sizes.sm,
    marginBottom: DesignSystem.spacing.lg,
  },
  emptyActionButton: {
    borderRadius: DesignSystem.borderRadius['2xl'],
    overflow: 'hidden',
  },
  emptyActionBlur: {
    borderRadius: DesignSystem.borderRadius['2xl'],
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  emptyActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: DesignSystem.spacing.lg,
    paddingHorizontal: DesignSystem.spacing['2xl'],
  },
  emptyActionText: {
    ...createTextStyle('lg', 'bold'),
    color: DesignSystem.colors.textInverse,
    marginLeft: DesignSystem.spacing.sm,
  },
  featuresSection: {
    paddingHorizontal: DesignSystem.spacing.xl,
    paddingBottom: DesignSystem.spacing.xl,
  },
  featuresTitle: {
    ...createTextStyle('xl', 'bold'),
    color: DesignSystem.colors.textInverse,
    marginBottom: DesignSystem.spacing.lg,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureItem: {
    width: (width - 60) / 2,
    borderRadius: DesignSystem.borderRadius.lg,
    padding: DesignSystem.spacing.lg,
    marginBottom: DesignSystem.spacing.md,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  featureIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DesignSystem.spacing.sm,
  },
  featureTitle: {
    ...createTextStyle('base', 'bold'),
    color: DesignSystem.colors.textInverse,
    marginBottom: DesignSystem.spacing.xs,
    textAlign: 'center',
  },
  featureDescription: {
    ...createTextStyle('xs', 'normal'),
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: DesignSystem.typography.lineHeights.normal * DesignSystem.typography.sizes.xs,
  },
  smartScanAction: {
    marginTop: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borderRadius.lg,
    overflow: 'hidden',
  },
  smartScanGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DesignSystem.spacing.lg,
    backgroundColor: 'rgba(102,126,234,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(102,126,234,0.3)',
  },
  smartScanText: {
    ...createTextStyle('lg', 'bold'),
    color: 'white',
    marginLeft: DesignSystem.spacing.sm,
  },
  aiFeaturesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: DesignSystem.spacing.md,
    gap: DesignSystem.spacing.sm,
  },
  aiFeatureButton: {
    flex: 1,
    borderRadius: DesignSystem.borderRadius.lg,
    overflow: 'hidden',
  },
  aiFeatureBlur: {
    borderRadius: DesignSystem.borderRadius.lg,
    overflow: 'hidden',
  },
  aiFeatureContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  aiFeatureText: {
    ...createTextStyle('sm', 'semibold'),
    color: 'rgba(255,255,255,0.9)',
    marginLeft: DesignSystem.spacing.sm,
  },
  // Unified Scan Button Styles
  unifiedScanAction: {
    borderRadius: DesignSystem.borderRadius.lg,
    overflow: 'hidden',
    marginBottom: DesignSystem.spacing.md,
  },
  unifiedScanGradient: {
    padding: DesignSystem.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99,102,241,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,1)',
  },
  unifiedScanText: {
    ...createTextStyle('lg', 'bold'),
    color: DesignSystem.colors.textInverse,
    marginBottom: 4,
  },
  chevronContainer: {
    marginLeft: DesignSystem.spacing.sm,
  },
  // Scan Mode Selector Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: DesignSystem.spacing.xl,
  },
  scanModeSelector: {
    backgroundColor: 'rgba(30,30,30,0.95)',
    borderRadius: DesignSystem.borderRadius.xl,
    padding: DesignSystem.spacing.lg,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  selectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.lg,
    paddingBottom: DesignSystem.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  selectorTitle: {
    ...createTextStyle('lg', 'bold'),
    color: DesignSystem.colors.textInverse,
  },
  closeButton: {
    padding: DesignSystem.spacing.sm,
  },
  modeOptions: {
    gap: DesignSystem.spacing.sm,
  },
  modeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DesignSystem.spacing.md,
  },
  modeInfo: {
    flex: 1,
  },
  modeTitle: {
    ...createTextStyle('base', 'semibold'),
    color: DesignSystem.colors.textInverse,
    marginBottom: 2,
  },
  modeDescription: {
    ...createTextStyle('sm', 'normal'),
    color: 'rgba(255,255,255,0.7)',
  },
  // Document List Item Styles
  documentListItem: {
    marginBottom: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borderRadius.lg,
    overflow: 'hidden',
  },
  documentListItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DesignSystem.spacing.md,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: DesignSystem.borderRadius.lg,
  },
  documentListImageContainer: {
    width: 60,
    height: 80,
    borderRadius: DesignSystem.borderRadius.md,
    overflow: 'hidden',
    marginRight: DesignSystem.spacing.md,
  },
  documentListImage: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  documentListInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  documentListTitle: {
    ...createTextStyle('base', 'semibold'),
    color: DesignSystem.colors.textInverse,
    marginBottom: 4,
  },
  documentListDate: {
    ...createTextStyle('sm', 'normal'),
    color: 'rgba(255,255,255,0.7)',
  },
  documentListAction: {
    padding: DesignSystem.spacing.sm,
  },
});

export default HomeScreen;