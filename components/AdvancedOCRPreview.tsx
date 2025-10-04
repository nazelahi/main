// Advanced OCR Preview Component
// Displays handwriting detection, table extraction, and document structure analysis

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AdvancedOCREngine, createAdvancedOCREngine, AdvancedOCRResult, Table, ExtractedEntity } from '../utils/advancedOCR';
import { DesignSystem, createGradientStyle, createTextStyle } from '../config/designSystem';

// const { width } = Dimensions.get('window');

interface AdvancedOCRPreviewProps {
  imageUri: string;
  onBack: () => void;
  onSave?: (result: AdvancedOCRResult) => void;
}

export default function AdvancedOCRPreview({ imageUri, onBack, onSave }: AdvancedOCRPreviewProps) {
  const [result, setResult] = useState<AdvancedOCRResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'text' | 'handwriting' | 'tables' | 'entities' | 'structure'>('text');
  const [ocrEngine, setOcrEngine] = useState<AdvancedOCREngine | null>(null);

  useEffect(() => {
    initializeOCR();
    return () => {
      if (ocrEngine) {
        ocrEngine.terminate();
      }
    };
  }, []);

  useEffect(() => {
    if (ocrEngine && imageUri) {
      processDocument();
    }
  }, [ocrEngine, imageUri]);

  const initializeOCR = async () => {
    try {
      const engine = createAdvancedOCREngine({
        provider: 'google', // Using Google Cloud Vision for real OCR
        apiKey: process.env.OCR_API_KEY || 'YOUR_GOOGLE_VISION_API_KEY'
      });
      await engine.initialize();
      setOcrEngine(engine);
    } catch (error) {
      console.error('Failed to initialize OCR engine:', error);
      Alert.alert('Error', 'Failed to initialize OCR engine');
    }
  };

  const processDocument = async () => {
    if (!ocrEngine) return;

    try {
      setIsProcessing(true);
      const ocrResult = await ocrEngine.processDocument(imageUri);
      setResult(ocrResult);
    } catch (error) {
      console.error('OCR processing failed:', error);
      Alert.alert('Error', 'Failed to process document with advanced OCR');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = () => {
    if (result && onSave) {
      onSave(result);
    }
  };

  const renderTextTab = () => {
    if (!result) return null;

    return (
      <View style={styles.tabContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Extracted Text</Text>
          <Text style={styles.textContent}>{result.text}</Text>
        </View>
        
        <View style={styles.metadataRow}>
          <View style={styles.metadataItem}>
            <Text style={styles.metadataLabel}>Confidence</Text>
            <Text style={styles.metadataValue}>{(result.confidence * 100).toFixed(1)}%</Text>
          </View>
          <View style={styles.metadataItem}>
            <Text style={styles.metadataLabel}>Language</Text>
            <Text style={styles.metadataValue}>{result.language}</Text>
          </View>
          <View style={styles.metadataItem}>
            <Text style={styles.metadataLabel}>Processing Time</Text>
            <Text style={styles.metadataValue}>{result.processingTime}ms</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderHandwritingTab = () => {
    if (!result?.handwriting) return null;

    const handwriting = result.handwriting;

    return (
      <View style={styles.tabContent}>
        <View style={styles.section}>
          <View style={styles.handwritingHeader}>
            <Text style={styles.sectionTitle}>Handwriting Detection</Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: handwriting.isHandwritten ? DesignSystem.colors.success : DesignSystem.colors.textTertiary }
            ]}>
              <Text style={styles.statusText}>
                {handwriting.isHandwritten ? 'Handwritten' : 'Typed'}
              </Text>
            </View>
          </View>
          
          {handwriting.text && (
            <View style={styles.handwritingContent}>
              <Text style={styles.handwritingLabel}>Detected Handwriting:</Text>
              <Text style={styles.handwritingText}>{handwriting.text}</Text>
            </View>
          )}
          
          <View style={styles.metadataRow}>
            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>Confidence</Text>
              <Text style={styles.metadataValue}>{(handwriting.confidence * 100).toFixed(1)}%</Text>
            </View>
            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>Language</Text>
              <Text style={styles.metadataValue}>{handwriting.language}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderTablesTab = () => {
    if (!result?.tables?.tables || result.tables.tables.length === 0) {
      return (
        <View style={styles.tabContent}>
          <View style={styles.emptyState}>
            <Ionicons name="grid-outline" size={48} color={DesignSystem.colors.textTertiary} />
            <Text style={styles.emptyStateText}>No tables detected</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.tabContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Tables ({result.tables.tables.length})
          </Text>
          <Text style={styles.sectionSubtitle}>
            Confidence: {(result.tables.confidence * 100).toFixed(1)}%
          </Text>
        </View>

        {result.tables.tables.map((table, index) => (
          <View key={table.id} style={styles.tableContainer}>
            <Text style={styles.tableTitle}>Table {index + 1}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.table}>
                {table.rows.map((row, rowIndex) => (
                  <View key={rowIndex} style={styles.tableRow}>
                    {row.cells.map((cell, cellIndex) => (
                      <View key={cellIndex} style={styles.tableCell}>
                        <Text style={styles.tableCellText}>{cell.text}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        ))}
      </View>
    );
  };

  const renderEntitiesTab = () => {
    if (!result?.entities || result.entities.length === 0) {
      return (
        <View style={styles.tabContent}>
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color={DesignSystem.colors.textTertiary} />
            <Text style={styles.emptyStateText}>No entities detected</Text>
          </View>
        </View>
      );
    }

    const groupedEntities = result.entities.reduce((acc, entity) => {
      if (!acc[entity.type]) {
        acc[entity.type] = [];
      }
      acc[entity.type].push(entity);
      return acc;
    }, {} as Record<string, ExtractedEntity[]>);

    return (
      <View style={styles.tabContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Extracted Entities ({result.entities.length})
          </Text>
        </View>

        {Object.entries(groupedEntities).map(([type, entities]) => (
          <View key={type} style={styles.entityGroup}>
            <Text style={styles.entityTypeTitle}>
              {type.charAt(0).toUpperCase() + type.slice(1)} ({entities.length})
            </Text>
            <View style={styles.entityList}>
              {entities.map((entity, index) => (
                <View key={index} style={styles.entityItem}>
                  <Text style={styles.entityValue}>{entity.value}</Text>
                  <Text style={styles.entityConfidence}>
                    {(entity.confidence * 100).toFixed(0)}%
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderStructureTab = () => {
    if (!result?.structure) return null;

    const structure = result.structure;

    return (
      <View style={styles.tabContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Document Structure</Text>
          <Text style={styles.sectionSubtitle}>
            Confidence: {(structure.confidence * 100).toFixed(1)}%
          </Text>
        </View>

        {structure.title && (
          <View style={styles.structureSection}>
            <Text style={styles.structureLabel}>Title:</Text>
            <Text style={styles.structureValue}>{structure.title}</Text>
          </View>
        )}

        {structure.headers.length > 0 && (
          <View style={styles.structureSection}>
            <Text style={styles.structureLabel}>Headers ({structure.headers.length}):</Text>
            {structure.headers.map((header, index) => (
              <Text key={index} style={[styles.structureValue, { marginLeft: header.level * 10 }]}>
                H{header.level}: {header.text}
              </Text>
            ))}
          </View>
        )}

        {structure.lists.length > 0 && (
          <View style={styles.structureSection}>
            <Text style={styles.structureLabel}>Lists ({structure.lists.length}):</Text>
            {structure.lists.slice(0, 5).map((item, index) => (
              <Text key={index} style={[styles.structureValue, { marginLeft: item.level * 10 }]}>
                {item.type === 'numbered' ? '1.' : '•'} {item.text}
              </Text>
            ))}
            {structure.lists.length > 5 && (
              <Text style={styles.structureValue}>... and {structure.lists.length - 5} more items</Text>
            )}
          </View>
        )}

        <View style={styles.structureSection}>
          <Text style={styles.structureLabel}>Paragraphs ({structure.paragraphs.length}):</Text>
          {structure.paragraphs.slice(0, 3).map((paragraph, index) => (
            <Text key={index} style={styles.structureValue}>
              {paragraph.substring(0, 100)}...
            </Text>
          ))}
          {structure.paragraphs.length > 3 && (
            <Text style={styles.structureValue}>... and {structure.paragraphs.length - 3} more paragraphs</Text>
          )}
        </View>
      </View>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'text':
        return renderTextTab();
      case 'handwriting':
        return renderHandwritingTab();
      case 'tables':
        return renderTablesTab();
      case 'entities':
        return renderEntitiesTab();
      case 'structure':
        return renderStructureTab();
      default:
        return renderTextTab();
    }
  };

  if (isProcessing) {
    return (
      <View style={styles.container}>
        <LinearGradient
          {...createGradientStyle(DesignSystem.colors.gradients.primary)}
          style={styles.loadingContainer}
        >
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color="white" />
            <Text style={styles.loadingText}>Processing document with advanced OCR...</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        {...createGradientStyle(DesignSystem.colors.gradients.primary)}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Advanced OCR</Text>
        {onSave && (
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Ionicons name="save" size={24} color="white" />
          </TouchableOpacity>
        )}
      </LinearGradient>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.tabBar}
        contentContainerStyle={styles.tabBarContent}
      >
        {[
          { key: 'text', label: 'Text', icon: 'document-text' },
          { key: 'handwriting', label: 'Handwriting', icon: 'create' },
          { key: 'tables', label: 'Tables', icon: 'grid' },
          { key: 'entities', label: 'Entities', icon: 'search' },
          { key: 'structure', label: 'Structure', icon: 'list' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tabButton,
              activeTab === tab.key && styles.activeTabButton
            ]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <LinearGradient
              colors={
                activeTab === tab.key 
                  ? ['#10B981', '#059669']
                  : ['#F1F5F9', '#E2E8F0']
              }
              style={styles.tabButtonGradient}
            >
              <Ionicons
                name={tab.icon as any}
                size={18}
                color={activeTab === tab.key ? 'white' : DesignSystem.colors.textSecondary}
              />
              <Text style={[
                styles.tabButtonText,
                activeTab === tab.key && styles.activeTabButtonText
              ]}>
                {tab.label}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderTabContent()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingTop: DesignSystem.spacing['2xl'],
    paddingBottom: DesignSystem.spacing.lg,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: {
    ...createTextStyle('xl', 'bold'),
    color: DesignSystem.colors.textInverse,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  saveButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  tabBar: {
    backgroundColor: DesignSystem.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border,
  },
  tabBarContent: {
    paddingHorizontal: DesignSystem.spacing.sm,
    paddingVertical: DesignSystem.spacing.sm,
  },
  tabButton: {
    marginRight: DesignSystem.spacing.sm,
    borderRadius: 20,
    overflow: 'hidden',
    minWidth: 85,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  activeTabButton: {
    elevation: 8,
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  tabButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.lg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tabButtonText: {
    ...createTextStyle('xs', 'bold'),
    color: DesignSystem.colors.textSecondary,
    marginLeft: DesignSystem.spacing.xs,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  activeTabButtonText: {
    color: 'white',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: DesignSystem.spacing.lg,
  },
  section: {
    marginBottom: DesignSystem.spacing.xl,
  },
  sectionTitle: {
    ...createTextStyle('lg', 'bold'),
    color: DesignSystem.colors.textPrimary,
    marginBottom: DesignSystem.spacing.sm,
  },
  sectionSubtitle: {
    ...createTextStyle('sm', 'normal'),
    color: DesignSystem.colors.textSecondary,
    marginBottom: DesignSystem.spacing.md,
  },
  textContent: {
    ...createTextStyle('base', 'normal'),
    color: DesignSystem.colors.textPrimary,
    lineHeight: DesignSystem.typography.lineHeights.relaxed * DesignSystem.typography.sizes.base,
    backgroundColor: DesignSystem.colors.surfaceVariant,
    padding: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borderRadius.lg,
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: DesignSystem.colors.surface,
    padding: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borderRadius.lg,
    ...DesignSystem.shadows.sm,
  },
  metadataItem: {
    alignItems: 'center',
  },
  metadataLabel: {
    ...createTextStyle('xs', 'medium'),
    color: DesignSystem.colors.textSecondary,
    marginBottom: DesignSystem.spacing.xs,
  },
  metadataValue: {
    ...createTextStyle('sm', 'bold'),
    color: DesignSystem.colors.textPrimary,
  },
  handwritingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: DesignSystem.spacing.md,
  },
  statusBadge: {
    paddingHorizontal: DesignSystem.spacing.sm,
    paddingVertical: DesignSystem.spacing.xs,
    borderRadius: DesignSystem.borderRadius.full,
  },
  statusText: {
    ...createTextStyle('xs', 'bold'),
    color: 'white',
  },
  handwritingContent: {
    backgroundColor: DesignSystem.colors.surfaceVariant,
    padding: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borderRadius.lg,
    marginBottom: DesignSystem.spacing.md,
  },
  handwritingLabel: {
    ...createTextStyle('sm', 'medium'),
    color: DesignSystem.colors.textSecondary,
    marginBottom: DesignSystem.spacing.xs,
  },
  handwritingText: {
    ...createTextStyle('base', 'normal'),
    color: DesignSystem.colors.textPrimary,
    fontStyle: 'italic',
  },
  tableContainer: {
    marginBottom: DesignSystem.spacing.lg,
  },
  tableTitle: {
    ...createTextStyle('base', 'bold'),
    color: DesignSystem.colors.textPrimary,
    marginBottom: DesignSystem.spacing.sm,
  },
  table: {
    backgroundColor: DesignSystem.colors.surface,
    borderRadius: DesignSystem.borderRadius.lg,
    ...DesignSystem.shadows.sm,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border,
  },
  tableCell: {
    padding: DesignSystem.spacing.sm,
    minWidth: 100,
    borderRightWidth: 1,
    borderRightColor: DesignSystem.colors.border,
  },
  tableCellText: {
    ...createTextStyle('sm', 'normal'),
    color: DesignSystem.colors.textPrimary,
  },
  entityGroup: {
    marginBottom: DesignSystem.spacing.lg,
  },
  entityTypeTitle: {
    ...createTextStyle('base', 'bold'),
    color: DesignSystem.colors.textPrimary,
    marginBottom: DesignSystem.spacing.sm,
  },
  entityList: {
    backgroundColor: DesignSystem.colors.surface,
    borderRadius: DesignSystem.borderRadius.lg,
    padding: DesignSystem.spacing.sm,
    ...DesignSystem.shadows.sm,
  },
  entityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: DesignSystem.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.borderLight,
  },
  entityValue: {
    ...createTextStyle('sm', 'normal'),
    color: DesignSystem.colors.textPrimary,
    flex: 1,
  },
  entityConfidence: {
    ...createTextStyle('xs', 'medium'),
    color: DesignSystem.colors.textSecondary,
    marginLeft: DesignSystem.spacing.sm,
  },
  structureSection: {
    marginBottom: DesignSystem.spacing.lg,
  },
  structureLabel: {
    ...createTextStyle('sm', 'bold'),
    color: DesignSystem.colors.textSecondary,
    marginBottom: DesignSystem.spacing.xs,
  },
  structureValue: {
    ...createTextStyle('sm', 'normal'),
    color: DesignSystem.colors.textPrimary,
    marginBottom: DesignSystem.spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DesignSystem.spacing['4xl'],
  },
  emptyStateText: {
    ...createTextStyle('base', 'normal'),
    color: DesignSystem.colors.textTertiary,
    marginTop: DesignSystem.spacing.md,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingText: {
    ...createTextStyle('base', 'normal'),
    color: DesignSystem.colors.textInverse,
    marginTop: DesignSystem.spacing.lg,
    textAlign: 'center',
  },
});