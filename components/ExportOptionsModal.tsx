// Export Options Modal Component
// Provides comprehensive export options for different formats

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ExportOptions, DocumentData, exportDocuments, shareExport, saveExportToGallery, getSupportedFormats } from '../utils/enhancedExport';
import { DesignSystem, createGradientStyle, createTextStyle } from '../config/designSystem';

interface ExportOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  documents: DocumentData[];
  onExportComplete?: (result: { uri: string; filename: string; format: string }) => void;
}

export default function ExportOptionsModal({ 
  visible, 
  onClose, 
  documents, 
  onExportComplete 
}: ExportOptionsModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<string>('pdf');
  const [isExporting, setIsExporting] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    quality: 'high',
    includeImages: true,
    includeOCR: true,
    includeTables: true,
    includeEntities: true,
    includeMetadata: true,
    title: 'Scanned Documents',
  });
  const [customTitle, setCustomTitle] = useState('Scanned Documents');

  const supportedFormats = getSupportedFormats();

  const handleFormatSelect = (format: string) => {
    setSelectedFormat(format);
    setExportOptions(prev => ({ ...prev, format: format as any }));
  };

  const handleOptionToggle = (option: keyof ExportOptions) => {
    setExportOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  const handleQualityChange = (quality: 'low' | 'medium' | 'high') => {
    setExportOptions(prev => ({ ...prev, quality }));
  };

  const handleExport = async () => {
    if (isExporting) return;

    try {
      setIsExporting(true);

      const finalOptions: ExportOptions = {
        ...exportOptions,
        title: customTitle.trim() || 'Scanned Documents',
        filename: `${customTitle.trim() || 'scanned_documents'}_${new Date().toISOString().split('T')[0]}`,
      };

      const result = await exportDocuments(documents, finalOptions);

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
      console.error('Export failed:', error);
      Alert.alert('Export Failed', 'Failed to export documents. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const renderFormatOption = (format: { format: string; name: string; mimeType: string }) => {
    const isSelected = selectedFormat === format.format;
    
    return (
      <TouchableOpacity
        key={format.format}
        style={[styles.formatOption, isSelected && styles.selectedFormatOption]}
        onPress={() => handleFormatSelect(format.format)}
      >
        <View style={styles.formatIcon}>
          <Ionicons 
            name={getFormatIcon(format.format)} 
            size={24} 
            color={isSelected ? DesignSystem.colors.primary : DesignSystem.colors.textSecondary} 
          />
        </View>
        <View style={styles.formatInfo}>
          <Text style={[styles.formatName, isSelected && styles.selectedFormatName]}>
            {format.name}
          </Text>
          <Text style={styles.formatType}>{format.format.toUpperCase()}</Text>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={20} color={DesignSystem.colors.primary} />
        )}
      </TouchableOpacity>
    );
  };

  const getFormatIcon = (format: string): any => {
    switch (format) {
      case 'pdf': return 'document-text';
      case 'docx': return 'document';
      case 'xlsx': return 'grid';
      case 'pptx': return 'easel';
      case 'txt': return 'text';
      case 'csv': return 'list';
      case 'json': return 'code';
      case 'html': return 'globe';
      default: return 'document';
    }
  };

  const renderQualityOption = (quality: 'low' | 'medium' | 'high', label: string) => {
    const isSelected = exportOptions.quality === quality;
    
    return (
      <TouchableOpacity
        key={quality}
        style={[styles.qualityOption, isSelected && styles.selectedQualityOption]}
        onPress={() => handleQualityChange(quality)}
      >
        <Text style={[styles.qualityLabel, isSelected && styles.selectedQualityLabel]}>
          {label}
        </Text>
        {isSelected && (
          <Ionicons name="checkmark" size={16} color={DesignSystem.colors.primary} />
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
          <Text style={styles.headerTitle}>Export Options</Text>
          <View style={styles.placeholder} />
        </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Document Count */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Exporting {documents.length} Document{documents.length !== 1 ? 's' : ''}
            </Text>
          </View>

          {/* Custom Title */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Document Title</Text>
            <TextInput
              style={styles.titleInput}
              value={customTitle}
              onChangeText={setCustomTitle}
              placeholder="Enter document title"
              placeholderTextColor={DesignSystem.colors.textTertiary}
            />
          </View>

          {/* Format Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Export Format</Text>
            <View style={styles.formatsContainer}>
              {supportedFormats.map(renderFormatOption)}
            </View>
          </View>

          {/* Quality Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quality</Text>
            <View style={styles.qualityContainer}>
              {renderQualityOption('low', 'Low (Fast)')}
              {renderQualityOption('medium', 'Medium (Balanced)')}
              {renderQualityOption('high', 'High (Best)')}
            </View>
          </View>

          {/* Export Options */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Include in Export</Text>
            
            <View style={styles.optionRow}>
              <View style={styles.optionInfo}>
                <Text style={styles.optionTitle}>Images</Text>
                <Text style={styles.optionDescription}>Include scanned document images</Text>
              </View>
              <Switch
                value={exportOptions.includeImages}
                onValueChange={() => handleOptionToggle('includeImages')}
                trackColor={{ false: DesignSystem.colors.border, true: DesignSystem.colors.primaryLight }}
                thumbColor={exportOptions.includeImages ? DesignSystem.colors.primary : DesignSystem.colors.textTertiary}
              />
            </View>

            <View style={styles.optionRow}>
              <View style={styles.optionInfo}>
                <Text style={styles.optionTitle}>OCR Text</Text>
                <Text style={styles.optionDescription}>Include extracted text from documents</Text>
              </View>
              <Switch
                value={exportOptions.includeOCR}
                onValueChange={() => handleOptionToggle('includeOCR')}
                trackColor={{ false: DesignSystem.colors.border, true: DesignSystem.colors.primaryLight }}
                thumbColor={exportOptions.includeOCR ? DesignSystem.colors.primary : DesignSystem.colors.textTertiary}
              />
            </View>

            <View style={styles.optionRow}>
              <View style={styles.optionInfo}>
                <Text style={styles.optionTitle}>Tables</Text>
                <Text style={styles.optionDescription}>Include extracted tables (if available)</Text>
              </View>
              <Switch
                value={exportOptions.includeTables}
                onValueChange={() => handleOptionToggle('includeTables')}
                trackColor={{ false: DesignSystem.colors.border, true: DesignSystem.colors.primaryLight }}
                thumbColor={exportOptions.includeTables ? DesignSystem.colors.primary : DesignSystem.colors.textTertiary}
              />
            </View>

            <View style={styles.optionRow}>
              <View style={styles.optionInfo}>
                <Text style={styles.optionTitle}>Entities</Text>
                <Text style={styles.optionDescription}>Include extracted entities (names, dates, etc.)</Text>
              </View>
              <Switch
                value={exportOptions.includeEntities}
                onValueChange={() => handleOptionToggle('includeEntities')}
                trackColor={{ false: DesignSystem.colors.border, true: DesignSystem.colors.primaryLight }}
                thumbColor={exportOptions.includeEntities ? DesignSystem.colors.primary : DesignSystem.colors.textTertiary}
              />
            </View>

            <View style={styles.optionRow}>
              <View style={styles.optionInfo}>
                <Text style={styles.optionTitle}>Metadata</Text>
                <Text style={styles.optionDescription}>Include document metadata and timestamps</Text>
              </View>
              <Switch
                value={exportOptions.includeMetadata}
                onValueChange={() => handleOptionToggle('includeMetadata')}
                trackColor={{ false: DesignSystem.colors.border, true: DesignSystem.colors.primaryLight }}
                thumbColor={exportOptions.includeMetadata ? DesignSystem.colors.primary : DesignSystem.colors.textTertiary}
              />
            </View>
          </View>
        </ScrollView>

        {/* Export Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.exportButton, isExporting && styles.exportButtonDisabled]}
            onPress={handleExport}
            disabled={isExporting}
          >
            <LinearGradient
              {...createGradientStyle(DesignSystem.colors.gradients.primary)}
              style={styles.exportButtonGradient}
            >
              {isExporting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="download" size={20} color="white" />
              )}
              <Text style={styles.exportButtonText}>
                {isExporting ? 'Exporting...' : 'Export Documents'}
              </Text>
            </LinearGradient>
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
  section: {
    marginBottom: DesignSystem.spacing.xl,
  },
  sectionTitle: {
    ...createTextStyle('lg', 'bold'),
    color: DesignSystem.colors.textPrimary,
    marginBottom: DesignSystem.spacing.md,
  },
  titleInput: {
    ...createTextStyle('base', 'normal'),
    backgroundColor: DesignSystem.colors.surface,
    borderRadius: DesignSystem.borderRadius.lg,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
    borderWidth: 1,
    borderColor: DesignSystem.colors.border,
    color: DesignSystem.colors.textPrimary,
  },
  formatsContainer: {
    gap: DesignSystem.spacing.sm,
  },
  formatOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DesignSystem.colors.surface,
    borderRadius: DesignSystem.borderRadius.lg,
    padding: DesignSystem.spacing.md,
    borderWidth: 1,
    borderColor: DesignSystem.colors.border,
  },
  selectedFormatOption: {
    borderColor: DesignSystem.colors.primary,
    backgroundColor: `${DesignSystem.colors.primaryLight  }10`,
  },
  formatIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  selectedFormatName: {
    color: DesignSystem.colors.primary,
  },
  formatType: {
    ...createTextStyle('sm', 'normal'),
    color: DesignSystem.colors.textSecondary,
  },
  qualityContainer: {
    flexDirection: 'row',
    gap: DesignSystem.spacing.sm,
  },
  qualityOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignSystem.colors.surface,
    borderRadius: DesignSystem.borderRadius.lg,
    paddingVertical: DesignSystem.spacing.sm,
    paddingHorizontal: DesignSystem.spacing.md,
    borderWidth: 1,
    borderColor: DesignSystem.colors.border,
  },
  selectedQualityOption: {
    borderColor: DesignSystem.colors.primary,
    backgroundColor: `${DesignSystem.colors.primaryLight  }10`,
  },
  qualityLabel: {
    ...createTextStyle('sm', 'medium'),
    color: DesignSystem.colors.textPrimary,
  },
  selectedQualityLabel: {
    color: DesignSystem.colors.primary,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: DesignSystem.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.borderLight,
  },
  optionInfo: {
    flex: 1,
    marginRight: DesignSystem.spacing.md,
  },
  optionTitle: {
    ...createTextStyle('base', 'medium'),
    color: DesignSystem.colors.textPrimary,
    marginBottom: DesignSystem.spacing.xs,
  },
  optionDescription: {
    ...createTextStyle('sm', 'normal'),
    color: DesignSystem.colors.textSecondary,
  },
  footer: {
    padding: DesignSystem.spacing.lg,
    backgroundColor: DesignSystem.colors.surface,
    borderTopWidth: 1,
    borderTopColor: DesignSystem.colors.border,
  },
  exportButton: {
    borderRadius: DesignSystem.borderRadius.lg,
    overflow: 'hidden',
  },
  exportButtonDisabled: {
    opacity: 0.6,
  },
  exportButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.lg,
  },
  exportButtonText: {
    ...createTextStyle('base', 'semibold'),
    color: DesignSystem.colors.textInverse,
    marginLeft: DesignSystem.spacing.sm,
  },
});