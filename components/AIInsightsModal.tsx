// AI Insights Modal Component
// Displays AI-powered insights, trends, and recommendations

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AIInsights, generateInsights, DocumentData } from '../utils/aiFeatures';
import { DesignSystem, createGradientStyle, createTextStyle, createShadowStyle } from '../config/designSystem';

// const { width, height } = Dimensions.get('window');

interface AIInsightsModalProps {
  visible: boolean;
  onClose: () => void;
  documents: DocumentData[];
  onActionPress?: (action: string, data?: any) => void;
}

export default function AIInsightsModal({ 
  visible, 
  onClose, 
  documents, 
  onActionPress 
}: AIInsightsModalProps) {
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'recommendations' | 'productivity'>('overview');

  useEffect(() => {
    if (visible && documents.length > 0) {
      loadInsights();
    }
  }, [visible, documents]);

  const loadInsights = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const aiInsights = await generateInsights(documents);
      setInsights(aiInsights);
    } catch (err: any) {
      console.error('Failed to load AI insights:', err);
      setError(err.message || 'Failed to load insights');
    } finally {
      setIsLoading(false);
    }
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
      <Text style={styles.errorTitle}>Analysis Failed</Text>
      <Text style={styles.errorMessage}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={loadInsights}>
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
        { id: 'overview', label: 'Overview', icon: 'analytics' },
        { id: 'trends', label: 'Trends', icon: 'trending-up' },
        { id: 'recommendations', label: 'Tips', icon: 'bulb' },
        { id: 'productivity', label: 'Stats', icon: 'speedometer' }
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

  const renderOverview = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Document Summary</Text>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryText}>{insights?.documentSummary}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Findings</Text>
        {insights?.keyFindings.map((finding, index) => (
          <View key={index} style={styles.findingCard}>
            <Ionicons name="checkmark-circle" size={20} color={DesignSystem.colors.success} />
            <Text style={styles.findingText}>{finding}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Anomalies Detected</Text>
        {insights?.anomalies.map((anomaly, index) => (
          <View key={index} style={styles.anomalyCard}>
            <Ionicons 
              name={anomaly.severity === 'high' ? 'warning' : 'information-circle'} 
              size={20} 
              color={anomaly.severity === 'high' ? DesignSystem.colors.error : DesignSystem.colors.warning} 
            />
            <View style={styles.anomalyContent}>
              <Text style={styles.anomalyTitle}>{anomaly.description}</Text>
              {anomaly.suggestedFix && (
                <Text style={styles.anomalyFix}>{anomaly.suggestedFix}</Text>
              )}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderTrends = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Document Creation Trends</Text>
        {insights?.trends.map((trend, index) => (
          <View key={index} style={styles.trendCard}>
            <View style={styles.trendHeader}>
              <Text style={styles.trendTitle}>{trend.metric}</Text>
              <View style={[styles.trendBadge, { 
                backgroundColor: trend.trend === 'increasing' ? DesignSystem.colors.success : 
                               trend.trend === 'decreasing' ? DesignSystem.colors.error : 
                               DesignSystem.colors.warning 
              }]}>
                <Ionicons 
                  name={trend.trend === 'increasing' ? 'trending-up' : 
                        trend.trend === 'decreasing' ? 'trending-down' : 'remove'} 
                  size={16} 
                  color="white" 
                />
                <Text style={styles.trendBadgeText}>{trend.trend}</Text>
              </View>
            </View>
            <Text style={styles.trendDescription}>
              {trend.period} trend with {Math.round(trend.confidence * 100)}% confidence
            </Text>
            <View style={styles.trendData}>
              <Text style={styles.trendDataText}>
                {trend.data.length} data points
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderRecommendations = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI Recommendations</Text>
        {insights?.recommendations.map((recommendation, index) => (
          <View key={index} style={styles.recommendationCard}>
            <Ionicons name="bulb" size={20} color={DesignSystem.colors.warning} />
            <Text style={styles.recommendationText}>{recommendation}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderProductivity = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Productivity Metrics</Text>
        
        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Ionicons name="document" size={24} color={DesignSystem.colors.primary} />
            <Text style={styles.metricTitle}>Documents Processed</Text>
          </View>
          <Text style={styles.metricValue}>{insights?.productivity.documentsProcessed}</Text>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Ionicons name="time" size={24} color={DesignSystem.colors.primary} />
            <Text style={styles.metricTitle}>Average Processing Time</Text>
          </View>
          <Text style={styles.metricValue}>{insights?.productivity.averageProcessingTime}s</Text>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Ionicons name="speedometer" size={24} color={DesignSystem.colors.primary} />
            <Text style={styles.metricTitle}>Efficiency Score</Text>
          </View>
          <Text style={styles.metricValue}>{insights?.productivity.efficiencyScore}/100</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Most Used Categories</Text>
          {insights?.productivity.mostUsedCategories.map((category, index) => (
            <View key={index} style={styles.categoryCard}>
              <Text style={styles.categoryName}>{category.category}</Text>
              <Text style={styles.categoryCount}>{category.count} documents</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  const renderContent = () => {
    if (isLoading) return renderLoading();
    if (error) return renderError();
    if (!insights) return null;

    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'trends':
        return renderTrends();
      case 'recommendations':
        return renderRecommendations();
      case 'productivity':
        return renderProductivity();
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
          <Text style={styles.headerTitle}>AI Insights</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={loadInsights}>
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
    marginBottom: DesignSystem.spacing.md,
  },
  summaryCard: {
    backgroundColor: DesignSystem.colors.surface,
    borderRadius: DesignSystem.borderRadius.lg,
    padding: DesignSystem.spacing.md,
    ...createShadowStyle('sm'),
  },
  summaryText: {
    ...createTextStyle('base', 'normal'),
    color: DesignSystem.colors.textSecondary,
    lineHeight: DesignSystem.typography.lineHeights.relaxed * DesignSystem.typography.sizes.base,
  },
  findingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DesignSystem.colors.surface,
    borderRadius: DesignSystem.borderRadius.lg,
    padding: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.sm,
    ...createShadowStyle('sm'),
  },
  findingText: {
    ...createTextStyle('base', 'normal'),
    color: DesignSystem.colors.textSecondary,
    marginLeft: DesignSystem.spacing.sm,
    flex: 1,
  },
  anomalyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: DesignSystem.colors.surface,
    borderRadius: DesignSystem.borderRadius.lg,
    padding: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.sm,
    ...createShadowStyle('sm'),
  },
  anomalyContent: {
    flex: 1,
    marginLeft: DesignSystem.spacing.sm,
  },
  anomalyTitle: {
    ...createTextStyle('base', 'medium'),
    color: DesignSystem.colors.textPrimary,
    marginBottom: DesignSystem.spacing.xs,
  },
  anomalyFix: {
    ...createTextStyle('sm', 'normal'),
    color: DesignSystem.colors.textSecondary,
  },
  trendCard: {
    backgroundColor: DesignSystem.colors.surface,
    borderRadius: DesignSystem.borderRadius.lg,
    padding: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.sm,
    ...createShadowStyle('sm'),
  },
  trendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: DesignSystem.spacing.sm,
  },
  trendTitle: {
    ...createTextStyle('base', 'semibold'),
    color: DesignSystem.colors.textPrimary,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DesignSystem.spacing.sm,
    paddingVertical: DesignSystem.spacing.xs,
    borderRadius: DesignSystem.borderRadius.md,
  },
  trendBadgeText: {
    ...createTextStyle('xs', 'semibold'),
    color: 'white',
    marginLeft: DesignSystem.spacing.xs,
    textTransform: 'capitalize',
  },
  trendDescription: {
    ...createTextStyle('sm', 'normal'),
    color: DesignSystem.colors.textSecondary,
    marginBottom: DesignSystem.spacing.sm,
  },
  trendData: {
    alignItems: 'flex-end',
  },
  trendDataText: {
    ...createTextStyle('xs', 'normal'),
    color: DesignSystem.colors.textTertiary,
  },
  recommendationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: DesignSystem.colors.surface,
    borderRadius: DesignSystem.borderRadius.lg,
    padding: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.sm,
    ...createShadowStyle('sm'),
  },
  recommendationText: {
    ...createTextStyle('base', 'normal'),
    color: DesignSystem.colors.textSecondary,
    marginLeft: DesignSystem.spacing.sm,
    flex: 1,
  },
  metricCard: {
    backgroundColor: DesignSystem.colors.surface,
    borderRadius: DesignSystem.borderRadius.lg,
    padding: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.md,
    ...createShadowStyle('sm'),
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.sm,
  },
  metricTitle: {
    ...createTextStyle('base', 'semibold'),
    color: DesignSystem.colors.textPrimary,
    marginLeft: DesignSystem.spacing.sm,
  },
  metricValue: {
    ...createTextStyle('2xl', 'bold'),
    color: DesignSystem.colors.primary,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: DesignSystem.colors.surface,
    borderRadius: DesignSystem.borderRadius.lg,
    padding: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.sm,
    ...createShadowStyle('sm'),
  },
  categoryName: {
    ...createTextStyle('base', 'medium'),
    color: DesignSystem.colors.textPrimary,
    textTransform: 'capitalize',
  },
  categoryCount: {
    ...createTextStyle('sm', 'normal'),
    color: DesignSystem.colors.textSecondary,
  },
});