// Quick Export Modal Component
// Provides quick export options for single documents

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { DocumentData, exportDocuments, shareExport, saveExportToGallery } from '../utils/enhancedExport';
import { DesignSystem, createGradientStyle, createTextStyle } from '../config/designSystem';

interface QuickExportModalProps {
  visible: boolean;
  onClose: () => void;
  document: DocumentData;
  onExportComplete?: (result: { uri: string; filename: string; format: string }) => void;
}

const QUICK_EXPORT_FORMATS = [
  { format: 'pdf', name: 'PDF', icon: 'document-text', description: 'Best for sharing' },
  { format: 'docx', name: 'Word', icon: 'document', description: 'Editable document' },
  { format: 'txt', name: 'Text', icon: 'text', description: 'Plain text only' },
  { format: 'html', name: 'Web', icon: 'globe', description: 'Web page format' },
];

export default function QuickExportModal({ 
  visible, 
  onClose, 
  document, 
  onExportComplete 
}: QuickExportModalProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<string | null>(null);

  const handleQuickExport = async (format: string) => {
    if (isExporting) return;

    try {
      setIsExporting(true);
      setExportingFormat(format);

      const options = {
        format: format as any,
        quality: 'high' as const,
        includeImages: true,
        includeOCR: true,
        includeTables: true,
        includeEntities: true,
        includeMetadata: true,
        title: document.title || 'Scanned Document',
      };

      const result = await exportDocuments([document], options);

      // Show success options
      Alert.alert(
        'Export Complete',
        `${result.filename} has been created successfully.`,
        [
          {
            text: 'Share',
            onPress: async () => {
              try {
                await shareExport(result);
              } catch (error) {
                Alert.alert('Error', 'Failed to share document');
              }
            }
          },
          {
            text: 'Save to Gallery',
            onPress: async () => {
              try {
                await saveExportToGallery(result);
                Alert.alert('Success', 'Document saved to gallery');
              } catch (error) {
                Alert.alert('Error', 'Failed to save to gallery');
              }
            }
          },
          {
            text: 'Done',
            onPress: () => {
              onExportComplete?.(result);
              onClose();
            }
          }
        ]
      );

    } catch (error) {
      console.error('Quick export failed:', error);
      Alert.alert('Export Failed', 'Failed to export document. Please try again.');
    } finally {
      setIsExporting(false);
      setExportingFormat(null);
    }
  };

  const renderFormatOption = (format: typeof QUICK_EXPORT_FORMATS[0]) => {
    const isExporting = exportingFormat === format.format;
    
    return (
      <TouchableOpacity
        key={format.format}
        style={[styles.formatOption, isExporting && styles.exportingOption]}
        onPress={() => handleQuickExport(format.format)}
        disabled={isExporting}
      >
        <View style={styles.formatIcon}>
          {isExporting ? (
            <ActivityIndicator size="small" color={DesignSystem.colors.primary} />
          ) : (
            <Ionicons 
              name={format.icon as any} 
              size={24} 
              color={isExporting ? DesignSystem.colors.primary : DesignSystem.colors.textSecondary} 
            />
          )}
        </View>
        <View style={styles.formatInfo}>
          <Text style={[styles.formatName, isExporting && styles.exportingText]}>
            {format.name}
          </Text>
          <Text style={[styles.formatDescription, isExporting && styles.exportingText]}>
            {isExporting ? 'Exporting...' : format.description}
          </Text>
        </View>
        {isExporting && (
          <Ionicons name="hourglass" size={16} color={DesignSystem.colors.primary} />
        )}
      </TouchableOpacity>
    );
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
          <Text style={styles.headerTitle}>Quick Export</Text>
          <View style={styles.placeholder} />
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.documentInfo}>
            <Text style={styles.documentTitle}>
              {document.title || 'Untitled Document'}
            </Text>
            <Text style={styles.documentTimestamp}>
              Scanned: {new Date(document.timestamp).toLocaleString()}
            </Text>
          </View>

          <View style={styles.formatsContainer}>
            <Text style={styles.sectionTitle}>Choose Export Format</Text>
            {QUICK_EXPORT_FORMATS.map(renderFormatOption)}
          </View>

          <View style={styles.infoSection}>
            <View style={styles.infoItem}>
              <Ionicons name="information-circle" size={20} color={DesignSystem.colors.primary} />
              <Text style={styles.infoText}>
                All exports include OCR text and metadata
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="images" size={20} color={DesignSystem.colors.primary} />
              <Text style={styles.infoText}>
                Images are included in PDF and HTML formats
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            disabled={isExporting}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
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
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
    padding: DesignSystem.spacing.lg,
  },
  documentInfo: {
    backgroundColor: DesignSystem.colors.surface,
    borderRadius: DesignSystem.borderRadius.lg,
    padding: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.xl,
    ...DesignSystem.shadows.sm,
  },
  documentTitle: {
    ...createTextStyle('lg', 'semibold'),
    color: DesignSystem.colors.textPrimary,
    marginBottom: DesignSystem.spacing.xs,
  },
  documentTimestamp: {
    ...createTextStyle('sm', 'normal'),
    color: DesignSystem.colors.textSecondary,
  },
  formatsContainer: {
    marginBottom: DesignSystem.spacing.xl,
  },
  sectionTitle: {
    ...createTextStyle('lg', 'bold'),
    color: DesignSystem.colors.textPrimary,
    marginBottom: DesignSystem.spacing.md,
  },
  formatOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DesignSystem.colors.surface,
    borderRadius: DesignSystem.borderRadius.lg,
    padding: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.sm,
    borderWidth: 1,
    borderColor: DesignSystem.colors.border,
    ...DesignSystem.shadows.sm,
  },
  exportingOption: {
    borderColor: DesignSystem.colors.primary,
    backgroundColor: `${DesignSystem.colors.primaryLight  }10`,
  },
  formatIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: DesignSystem.colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DesignSystem.spacing.md,
  },
  formatInfo: {
    flex: 1,
  },
  formatName: {
    ...createTextStyle('base', 'semibold'),
    color: DesignSystem.colors.textPrimary,
    marginBottom: DesignSystem.spacing.xs,
  },
  formatDescription: {
    ...createTextStyle('sm', 'normal'),
    color: DesignSystem.colors.textSecondary,
  },
  exportingText: {
    color: DesignSystem.colors.primary,
  },
  infoSection: {
    backgroundColor: DesignSystem.colors.surfaceVariant,
    borderRadius: DesignSystem.borderRadius.lg,
    padding: DesignSystem.spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.sm,
  },
  infoText: {
    ...createTextStyle('sm', 'normal'),
    color: DesignSystem.colors.textSecondary,
    marginLeft: DesignSystem.spacing.sm,
    flex: 1,
  },
  footer: {
    padding: DesignSystem.spacing.lg,
    backgroundColor: DesignSystem.colors.surface,
    borderTopWidth: 1,
    borderTopColor: DesignSystem.colors.border,
  },
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DesignSystem.spacing.md,
  },
  cancelButtonText: {
    ...createTextStyle('base', 'medium'),
    color: DesignSystem.colors.textSecondary,
  },
});