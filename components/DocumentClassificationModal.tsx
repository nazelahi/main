// Document Classification Modal Component
// AI-powered document classification and suggested actions

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { DocumentClassification, classifyDocument, DocumentData, SuggestedAction } from '../utils/aiFeatures';
import { AdvancedOCRResult } from '../utils/advancedOCR';
import { DesignSystem, createGradientStyle, createTextStyle, createShadowStyle } from '../config/designSystem';

interface DocumentClassificationModalProps {
  visible: boolean;
  onClose: () => void;
  document: DocumentData;
  ocrResult?: AdvancedOCRResult;
  onActionPress?: (action: SuggestedAction) => void;
  onCategoryChange?: (category: string) => void;
}

export default function DocumentClassificationModal({ 
  visible, 
  onClose, 
  document, 
  ocrResult,
  onActionPress,
  onCategoryChange 
}: DocumentClassificationModalProps) {
  const [classification, setClassification] = useState<DocumentClassification | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  useEffect(() => {
    if (visible && document) {
      loadClassification();
    }
  }, [visible, document, ocrResult]);

  const loadClassification = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const classificationResult = await classifyDocument(document, ocrResult);
      setClassification(classificationResult);
    } catch (err: any) {
      console.error('Failed to classify document:', err);
      setError(err.message || 'Failed to classify document');
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionPress = (action: SuggestedAction) => {
    setSelectedAction(action.id);
    onActionPress?.(action);
    
    // Show confirmation
    Alert.alert(
      'Action Applied',
      `${action.title} has been applied to this document.`,
      [{ text: 'OK', onPress: () => setSelectedAction(null) }]
    );
  };

  const handleCategoryChange = (categoryId: string) => {
    onCategoryChange?.(categoryId);
    Alert.alert(
      'Category Updated',
      'Document category has been updated.',
      [{ text: 'OK' }]
    );
  };

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={DesignSystem.colors.primary} />
      <Text style={styles.loadingText}>Analyzing document...</Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle-outline" size={48} color={DesignSystem.colors.error} />
      <Text style={styles.errorTitle}>Classification Failed</Text>
      <Text style={styles.errorMessage}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={loadClassification}>
        <LinearGradient
          {...createGradientStyle(DesignSystem.colors.gradients.primary)}
          style={styles.retryButtonGradient}
        >
          <Ionicons name="refresh" size={20} color="white" />
          <Text style={styles.retryButtonText}>Try Again</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderClassification = () => {
    if (!classification) return null;

    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Category Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Document Category</Text>
          <View style={styles.categoryCard}>
            <View style={[styles.categoryIcon, { backgroundColor: classification.category.color }]}>
              <Ionicons name={classification.category.icon as any} size={24} color="white" />
            </View>
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryName}>{classification.category.name}</Text>
              <Text style={styles.categoryDescription}>{classification.category.description}</Text>
              <View style={styles.confidenceBar}>
                <View style={styles.confidenceBarBackground}>
                  <View 
                    style={[
                      styles.confidenceBarFill, 
                      { 
                        width: `${classification.confidence * 100}%`,
                        backgroundColor: classification.confidence > 0.7 ? DesignSystem.colors.success : 
                                       classification.confidence > 0.4 ? DesignSystem.colors.warning : 
                                       DesignSystem.colors.error
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.confidenceText}>
                  {Math.round(classification.confidence * 100)}% confidence
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Tags Section */}
        {classification.tags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Detected Tags</Text>
            <View style={styles.tagsContainer}>
              {classification.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Priority Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Priority Level</Text>
          <View style={styles.priorityCard}>
            <View style={[styles.priorityIcon, { 
              backgroundColor: classification.priority.level === 'urgent' ? DesignSystem.colors.error :
                              classification.priority.level === 'high' ? DesignSystem.colors.warning :
                              classification.priority.level === 'medium' ? DesignSystem.colors.primary :
                              DesignSystem.colors.textTertiary
            }]}>
              <Ionicons 
                name={classification.priority.level === 'urgent' ? 'warning' :
                      classification.priority.level === 'high' ? 'alert-circle' :
                      classification.priority.level === 'medium' ? 'information-circle' :
                      'checkmark-circle'} 
                size={20} 
                color="white" 
              />
            </View>
            <View style={styles.priorityInfo}>
              <Text style={styles.priorityLevel}>
                {classification.priority.level.charAt(0).toUpperCase() + classification.priority.level.slice(1)} Priority
              </Text>
              <Text style={styles.priorityScore}>
                Score: {Math.round(classification.priority.score * 100)}/100
              </Text>
              {classification.priority.reasons.length > 0 && (
                <View style={styles.priorityReasons}>
                  {classification.priority.reasons.map((reason, index) => (
                    <Text key={index} style={styles.priorityReason}>• {reason}</Text>
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Suggested Actions Section */}
        {classification.suggestedActions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Suggested Actions</Text>
            {classification.suggestedActions.map((action, index) => (
              <TouchableOpacity
                key={action.id}
                style={[
                  styles.actionCard,
                  selectedAction === action.id && styles.actionCardSelected
                ]}
                onPress={() => handleActionPress(action)}
                disabled={selectedAction === action.id}
              >
                <View style={styles.actionHeader}>
                  <Ionicons 
                    name={action.type === 'export' ? 'download' :
                          action.type === 'share' ? 'share' :
                          action.type === 'organize' ? 'folder' :
                          action.type === 'process' ? 'cog' :
                          'time'} 
                    size={20} 
                    color={DesignSystem.colors.primary} 
                  />
                  <View style={styles.actionInfo}>
                    <Text style={styles.actionTitle}>{action.title}</Text>
                    <Text style={styles.actionDescription}>{action.description}</Text>
                  </View>
                  <View style={styles.actionPriority}>
                    <Text style={styles.priorityText}>P{action.priority}</Text>
                  </View>
                </View>
                {selectedAction === action.id && (
                  <View style={styles.actionApplied}>
                    <Ionicons name="checkmark-circle" size={16} color={DesignSystem.colors.success} />
                    <Text style={styles.actionAppliedText}>Applied</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Category Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Change Category</Text>
          <Text style={styles.sectionDescription}>
            If the AI classification is incorrect, you can manually change the category.
          </Text>
          <View style={styles.categoryOptions}>
            {[
              { id: 'financial', name: 'Financial', icon: 'cash', color: '#4CAF50' },
              { id: 'legal', name: 'Legal', icon: 'document-text', color: '#2196F3' },
              { id: 'medical', name: 'Medical', icon: 'medical', color: '#F44336' },
              { id: 'business', name: 'Business', icon: 'briefcase', color: '#FF9800' },
              { id: 'academic', name: 'Academic', icon: 'school', color: '#9C27B0' },
              { id: 'personal', name: 'Personal', icon: 'person', color: '#607D8B' },
              { id: 'government', name: 'Government', icon: 'shield-checkmark', color: '#795548' },
              { id: 'other', name: 'Other', icon: 'document', color: '#9E9E9E' }
            ].map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryOption,
                  classification?.category.id === category.id && styles.categoryOptionSelected
                ]}
                onPress={() => handleCategoryChange(category.id)}
              >
                <View style={[styles.categoryOptionIcon, { backgroundColor: category.color }]}>
                  <Ionicons name={category.icon as any} size={16} color="white" />
                </View>
                <Text style={[
                  styles.categoryOptionText,
                  classification?.category.id === category.id && styles.categoryOptionTextSelected
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderContent = () => {
    if (isLoading) return renderLoading();
    if (error) return renderError();
    return renderClassification();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <LinearGradient
          {...createGradientStyle(DesignSystem.colors.gradients.primary)}
          style={styles.header}
        >
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Document Classification</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={loadClassification}>
            <Ionicons name="refresh" size={24} color="white" />
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.content}>
          {renderContent()}
        </View>
      </View>
    </Modal>
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
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...createTextStyle('xl', 'bold'),
    color: DesignSystem.colors.textInverse,
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: DesignSystem.spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...createTextStyle('base', 'medium'),
    color: DesignSystem.colors.textSecondary,
    marginTop: DesignSystem.spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: DesignSystem.spacing['4xl'],
  },
  errorTitle: {
    ...createTextStyle('xl', 'bold'),
    color: DesignSystem.colors.error,
    marginTop: DesignSystem.spacing.md,
  },
  errorMessage: {
    ...createTextStyle('base', 'normal'),
    color: DesignSystem.colors.textSecondary,
    textAlign: 'center',
    marginTop: DesignSystem.spacing.sm,
    marginBottom: DesignSystem.spacing.lg,
  },
  retryButton: {
    borderRadius: DesignSystem.borderRadius['2xl'],
    overflow: 'hidden',
  },
  retryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DesignSystem.spacing['3xl'],
    paddingVertical: DesignSystem.spacing.lg,
  },
  retryButtonText: {
    ...createTextStyle('base', 'semibold'),
    color: DesignSystem.colors.textInverse,
    marginLeft: DesignSystem.spacing.sm,
  },
  section: {
    marginBottom: DesignSystem.spacing.xl,
  },
  sectionTitle: {
    ...createTextStyle('lg', 'bold'),
    color: DesignSystem.colors.textPrimary,
    marginBottom: DesignSystem.spacing.md,
  },
  sectionDescription: {
    ...createTextStyle('sm', 'normal'),
    color: DesignSystem.colors.textSecondary,
    marginBottom: DesignSystem.spacing.md,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DesignSystem.colors.surface,
    borderRadius: DesignSystem.borderRadius.lg,
    padding: DesignSystem.spacing.md,
    ...createShadowStyle('sm'),
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DesignSystem.spacing.md,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    ...createTextStyle('lg', 'bold'),
    color: DesignSystem.colors.textPrimary,
    marginBottom: DesignSystem.spacing.xs,
  },
  categoryDescription: {
    ...createTextStyle('sm', 'normal'),
    color: DesignSystem.colors.textSecondary,
    marginBottom: DesignSystem.spacing.sm,
  },
  confidenceBar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confidenceBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: DesignSystem.colors.surfaceVariant,
    borderRadius: 4,
    marginRight: DesignSystem.spacing.sm,
  },
  confidenceBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  confidenceText: {
    ...createTextStyle('xs', 'medium'),
    color: DesignSystem.colors.textSecondary,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: `${DesignSystem.colors.primaryLight  }20`,
    borderRadius: DesignSystem.borderRadius.sm,
    paddingHorizontal: DesignSystem.spacing.sm,
    paddingVertical: DesignSystem.spacing.xs,
    marginRight: DesignSystem.spacing.sm,
    marginBottom: DesignSystem.spacing.sm,
  },
  tagText: {
    ...createTextStyle('xs', 'medium'),
    color: DesignSystem.colors.primary,
  },
  priorityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DesignSystem.colors.surface,
    borderRadius: DesignSystem.borderRadius.lg,
    padding: DesignSystem.spacing.md,
    ...createShadowStyle('sm'),
  },
  priorityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DesignSystem.spacing.md,
  },
  priorityInfo: {
    flex: 1,
  },
  priorityLevel: {
    ...createTextStyle('base', 'semibold'),
    color: DesignSystem.colors.textPrimary,
    marginBottom: DesignSystem.spacing.xs,
  },
  priorityScore: {
    ...createTextStyle('sm', 'normal'),
    color: DesignSystem.colors.textSecondary,
    marginBottom: DesignSystem.spacing.sm,
  },
  priorityReasons: {
    marginTop: DesignSystem.spacing.xs,
  },
  priorityReason: {
    ...createTextStyle('xs', 'normal'),
    color: DesignSystem.colors.textSecondary,
    marginBottom: DesignSystem.spacing.xs,
  },
  actionCard: {
    backgroundColor: DesignSystem.colors.surface,
    borderRadius: DesignSystem.borderRadius.lg,
    padding: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.sm,
    ...createShadowStyle('sm'),
  },
  actionCardSelected: {
    borderWidth: 2,
    borderColor: DesignSystem.colors.primary,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionInfo: {
    flex: 1,
    marginLeft: DesignSystem.spacing.sm,
  },
  actionTitle: {
    ...createTextStyle('base', 'semibold'),
    color: DesignSystem.colors.textPrimary,
    marginBottom: DesignSystem.spacing.xs,
  },
  actionDescription: {
    ...createTextStyle('sm', 'normal'),
    color: DesignSystem.colors.textSecondary,
  },
  actionPriority: {
    backgroundColor: `${DesignSystem.colors.primaryLight  }20`,
    borderRadius: DesignSystem.borderRadius.sm,
    paddingHorizontal: DesignSystem.spacing.sm,
    paddingVertical: DesignSystem.spacing.xs,
  },
  priorityText: {
    ...createTextStyle('xs', 'bold'),
    color: DesignSystem.colors.primary,
  },
  actionApplied: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: DesignSystem.spacing.sm,
    paddingTop: DesignSystem.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: DesignSystem.colors.borderLight,
  },
  actionAppliedText: {
    ...createTextStyle('sm', 'medium'),
    color: DesignSystem.colors.success,
    marginLeft: DesignSystem.spacing.xs,
  },
  categoryOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DesignSystem.colors.surface,
    borderRadius: DesignSystem.borderRadius.lg,
    padding: DesignSystem.spacing.sm,
    marginRight: DesignSystem.spacing.sm,
    marginBottom: DesignSystem.spacing.sm,
    borderWidth: 1,
    borderColor: DesignSystem.colors.border,
  },
  categoryOptionSelected: {
    borderColor: DesignSystem.colors.primary,
    backgroundColor: `${DesignSystem.colors.primaryLight  }10`,
  },
  categoryOptionIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DesignSystem.spacing.sm,
  },
  categoryOptionText: {
    ...createTextStyle('sm', 'medium'),
    color: DesignSystem.colors.textPrimary,
  },
  categoryOptionTextSelected: {
    color: DesignSystem.colors.primary,
  },
});