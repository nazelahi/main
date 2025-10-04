// Smart Organization Modal Component
// AI-powered document organization and folder management

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
import { SmartOrganization, organizeDocuments, DocumentData, OrganizationSuggestion, SmartFolder } from '../utils/aiFeatures';
import { DesignSystem, createGradientStyle, createTextStyle, createShadowStyle } from '../config/designSystem';

interface SmartOrganizationModalProps {
  visible: boolean;
  onClose: () => void;
  documents: DocumentData[];
  onApplySuggestion?: (suggestion: OrganizationSuggestion) => void;
  onMoveToFolder?: (documentId: string, folderId: string) => void;
}

export default function SmartOrganizationModal({ 
  visible, 
  onClose, 
  documents, 
  onApplySuggestion,
  onMoveToFolder 
}: SmartOrganizationModalProps) {
  const [organization, setOrganization] = useState<SmartOrganization | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'folders' | 'suggestions' | 'rules'>('folders');
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (visible && documents.length > 0) {
      loadOrganization();
    }
  }, [visible, documents]);

  const loadOrganization = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const smartOrg = await organizeDocuments(documents);
      setOrganization(smartOrg);
    } catch (err: any) {
      console.error('Failed to load organization:', err);
      setError(err.message || 'Failed to load organization');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplySuggestion = (suggestion: OrganizationSuggestion) => {
    Alert.alert(
      'Apply Suggestion',
      suggestion.description,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Apply', 
          onPress: () => {
            onApplySuggestion?.(suggestion);
            // Remove applied suggestion
            if (organization) {
              setOrganization({
                ...organization,
                suggestions: organization.suggestions.filter(s => s.id !== suggestion.id)
              });
            }
          }
        }
      ]
    );
  };

  const handleMoveToFolder = (documentId: string, folderId: string) => {
    onMoveToFolder?.(documentId, folderId);
    setSelectedDocuments(new Set());
  };

  const toggleDocumentSelection = (documentId: string) => {
    const newSelection = new Set(selectedDocuments);
    if (newSelection.has(documentId)) {
      newSelection.delete(documentId);
    } else {
      newSelection.add(documentId);
    }
    setSelectedDocuments(newSelection);
  };

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={DesignSystem.colors.primary} />
      <Text style={styles.loadingText}>Analyzing your documents...</Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle-outline" size={48} color={DesignSystem.colors.error} />
      <Text style={styles.errorTitle}>Organization Failed</Text>
      <Text style={styles.errorMessage}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={loadOrganization}>
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

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      {[
        { id: 'folders', label: 'Folders', icon: 'folder' },
        { id: 'suggestions', label: 'Suggestions', icon: 'bulb' },
        { id: 'rules', label: 'Rules', icon: 'settings' }
      ].map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[styles.tabButton, activeTab === tab.id && styles.tabButtonActive]}
          onPress={() => setActiveTab(tab.id as any)}
        >
          <Ionicons 
            name={tab.icon as any} 
            size={16} 
            color={activeTab === tab.id ? DesignSystem.colors.primary : DesignSystem.colors.textSecondary} 
          />
          <Text style={[styles.tabButtonText, activeTab === tab.id && styles.tabButtonTextActive]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderFolderCard = (folder: SmartFolder) => (
    <TouchableOpacity key={folder.id} style={styles.folderCard}>
      <View style={styles.folderHeader}>
        <View style={[styles.folderIcon, { backgroundColor: folder.color }]}>
          <Ionicons name={folder.icon as any} size={24} color="white" />
        </View>
        <View style={styles.folderInfo}>
          <Text style={styles.folderName}>{folder.name}</Text>
          <Text style={styles.folderDescription}>{folder.description}</Text>
        </View>
        <View style={styles.folderStats}>
          <Text style={styles.folderCount}>{folder.documentCount}</Text>
          <Text style={styles.folderCountLabel}>docs</Text>
        </View>
      </View>
      <View style={styles.folderCriteria}>
        {folder.criteria.keywords.slice(0, 3).map((keyword, index) => (
          <View key={index} style={styles.keywordTag}>
            <Text style={styles.keywordText}>{keyword}</Text>
          </View>
        ))}
        {folder.criteria.keywords.length > 3 && (
          <Text style={styles.moreKeywords}>+{folder.criteria.keywords.length - 3} more</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderFolders = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Smart Folders</Text>
        <Text style={styles.sectionDescription}>
          AI-organized folders based on document content and patterns
        </Text>
        {organization?.folders.map(renderFolderCard)}
      </View>
    </ScrollView>
  );

  const renderSuggestionCard = (suggestion: OrganizationSuggestion) => (
    <View key={suggestion.id} style={styles.suggestionCard}>
      <View style={styles.suggestionHeader}>
        <Ionicons 
          name={suggestion.type === 'move' ? 'arrow-forward' : 
                suggestion.type === 'merge' ? 'git-merge' :
                suggestion.type === 'rename' ? 'create' :
                suggestion.type === 'categorize' ? 'pricetag' : 'settings'} 
          size={20} 
          color={DesignSystem.colors.primary} 
        />
        <View style={styles.suggestionInfo}>
          <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
          <Text style={styles.suggestionDescription}>{suggestion.description}</Text>
        </View>
        <View style={styles.suggestionConfidence}>
          <Text style={styles.confidenceText}>{Math.round(suggestion.confidence * 100)}%</Text>
        </View>
      </View>
      <View style={styles.suggestionActions}>
        <TouchableOpacity 
          style={styles.applyButton}
          onPress={() => handleApplySuggestion(suggestion)}
        >
          <LinearGradient
            {...createGradientStyle(DesignSystem.colors.gradients.primary)}
            style={styles.applyButtonGradient}
          >
            <Ionicons name="checkmark" size={16} color="white" />
            <Text style={styles.applyButtonText}>Apply</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dismissButton}>
          <Ionicons name="close" size={16} color={DesignSystem.colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSuggestions = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI Suggestions</Text>
        <Text style={styles.sectionDescription}>
          Smart recommendations to improve your document organization
        </Text>
        {organization?.suggestions.map(renderSuggestionCard)}
        {organization?.suggestions.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={48} color={DesignSystem.colors.success} />
            <Text style={styles.emptyStateTitle}>All Organized!</Text>
            <Text style={styles.emptyStateDescription}>
              Your documents are well organized. Great job!
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );

  const renderRuleCard = (rule: any) => (
    <View key={rule.id} style={styles.ruleCard}>
      <View style={styles.ruleHeader}>
        <View style={styles.ruleInfo}>
          <Text style={styles.ruleName}>{rule.name}</Text>
          <Text style={styles.ruleDescription}>{rule.description}</Text>
        </View>
        <View style={[styles.ruleToggle, rule.enabled && styles.ruleToggleActive]}>
          <Ionicons 
            name={rule.enabled ? 'checkmark' : 'close'} 
            size={16} 
            color={rule.enabled ? 'white' : DesignSystem.colors.textSecondary} 
          />
        </View>
      </View>
      <View style={styles.ruleDetails}>
        <Text style={styles.rulePriority}>Priority: {rule.priority}</Text>
        <Text style={styles.ruleConditions}>
          {rule.conditions.length} condition{rule.conditions.length !== 1 ? 's' : ''}
        </Text>
      </View>
    </View>
  );

  const renderRules = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Organization Rules</Text>
        <Text style={styles.sectionDescription}>
          Automated rules for organizing documents
        </Text>
        {organization?.rules.map(renderRuleCard)}
      </View>
    </ScrollView>
  );

  const renderContent = () => {
    if (isLoading) return renderLoading();
    if (error) return renderError();
    if (!organization) return null;

    switch (activeTab) {
      case 'folders':
        return renderFolders();
      case 'suggestions':
        return renderSuggestions();
      case 'rules':
        return renderRules();
      default:
        return null;
    }
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
          <Text style={styles.headerTitle}>Smart Organization</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={loadOrganization}>
            <Ionicons name="refresh" size={24} color="white" />
          </TouchableOpacity>
        </LinearGradient>

        {renderTabs()}
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: DesignSystem.colors.surface,
    paddingVertical: DesignSystem.spacing.sm,
    ...createShadowStyle('sm'),
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DesignSystem.spacing.sm,
    paddingHorizontal: DesignSystem.spacing.sm,
  },
  tabButtonActive: {
    backgroundColor: `${DesignSystem.colors.primaryLight  }20`,
  },
  tabButtonText: {
    ...createTextStyle('sm', 'medium'),
    color: DesignSystem.colors.textSecondary,
    marginLeft: DesignSystem.spacing.xs,
  },
  tabButtonTextActive: {
    color: DesignSystem.colors.primary,
  },
  content: {
    flex: 1,
  },
  tabContent: {
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
    marginBottom: DesignSystem.spacing.sm,
  },
  sectionDescription: {
    ...createTextStyle('sm', 'normal'),
    color: DesignSystem.colors.textSecondary,
    marginBottom: DesignSystem.spacing.lg,
  },
  folderCard: {
    backgroundColor: DesignSystem.colors.surface,
    borderRadius: DesignSystem.borderRadius.lg,
    padding: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.md,
    ...createShadowStyle('sm'),
  },
  folderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.sm,
  },
  folderIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DesignSystem.spacing.md,
  },
  folderInfo: {
    flex: 1,
  },
  folderName: {
    ...createTextStyle('base', 'semibold'),
    color: DesignSystem.colors.textPrimary,
    marginBottom: DesignSystem.spacing.xs,
  },
  folderDescription: {
    ...createTextStyle('sm', 'normal'),
    color: DesignSystem.colors.textSecondary,
  },
  folderStats: {
    alignItems: 'center',
  },
  folderCount: {
    ...createTextStyle('lg', 'bold'),
    color: DesignSystem.colors.primary,
  },
  folderCountLabel: {
    ...createTextStyle('xs', 'normal'),
    color: DesignSystem.colors.textSecondary,
  },
  folderCriteria: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  keywordTag: {
    backgroundColor: `${DesignSystem.colors.primaryLight  }20`,
    borderRadius: DesignSystem.borderRadius.sm,
    paddingHorizontal: DesignSystem.spacing.sm,
    paddingVertical: DesignSystem.spacing.xs,
    marginRight: DesignSystem.spacing.xs,
    marginBottom: DesignSystem.spacing.xs,
  },
  keywordText: {
    ...createTextStyle('xs', 'medium'),
    color: DesignSystem.colors.primary,
  },
  moreKeywords: {
    ...createTextStyle('xs', 'normal'),
    color: DesignSystem.colors.textTertiary,
  },
  suggestionCard: {
    backgroundColor: DesignSystem.colors.surface,
    borderRadius: DesignSystem.borderRadius.lg,
    padding: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.md,
    ...createShadowStyle('sm'),
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: DesignSystem.spacing.sm,
  },
  suggestionInfo: {
    flex: 1,
    marginLeft: DesignSystem.spacing.sm,
  },
  suggestionTitle: {
    ...createTextStyle('base', 'semibold'),
    color: DesignSystem.colors.textPrimary,
    marginBottom: DesignSystem.spacing.xs,
  },
  suggestionDescription: {
    ...createTextStyle('sm', 'normal'),
    color: DesignSystem.colors.textSecondary,
  },
  suggestionConfidence: {
    alignItems: 'center',
  },
  confidenceText: {
    ...createTextStyle('sm', 'bold'),
    color: DesignSystem.colors.primary,
  },
  suggestionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  applyButton: {
    borderRadius: DesignSystem.borderRadius.md,
    overflow: 'hidden',
    marginRight: DesignSystem.spacing.sm,
  },
  applyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
  },
  applyButtonText: {
    ...createTextStyle('sm', 'semibold'),
    color: DesignSystem.colors.textInverse,
    marginLeft: DesignSystem.spacing.xs,
  },
  dismissButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: DesignSystem.colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleCard: {
    backgroundColor: DesignSystem.colors.surface,
    borderRadius: DesignSystem.borderRadius.lg,
    padding: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.md,
    ...createShadowStyle('sm'),
  },
  ruleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.sm,
  },
  ruleInfo: {
    flex: 1,
  },
  ruleName: {
    ...createTextStyle('base', 'semibold'),
    color: DesignSystem.colors.textPrimary,
    marginBottom: DesignSystem.spacing.xs,
  },
  ruleDescription: {
    ...createTextStyle('sm', 'normal'),
    color: DesignSystem.colors.textSecondary,
  },
  ruleToggle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: DesignSystem.colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleToggleActive: {
    backgroundColor: DesignSystem.colors.primary,
  },
  ruleDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rulePriority: {
    ...createTextStyle('xs', 'normal'),
    color: DesignSystem.colors.textSecondary,
  },
  ruleConditions: {
    ...createTextStyle('xs', 'normal'),
    color: DesignSystem.colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    padding: DesignSystem.spacing['4xl'],
  },
  emptyStateTitle: {
    ...createTextStyle('lg', 'bold'),
    color: DesignSystem.colors.textPrimary,
    marginTop: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.sm,
  },
  emptyStateDescription: {
    ...createTextStyle('base', 'normal'),
    color: DesignSystem.colors.textSecondary,
    textAlign: 'center',
  },
});