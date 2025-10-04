import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  FlatList,
  Dimensions,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { DOCUMENT_TYPES, DocumentType } from '../config/documentTypes';
import { DesignSystem, createGradientStyle, createTextStyle } from '../config/designSystem';

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2;

interface DocumentTypeSelectorProps {
  visible: boolean;
  onSelectType: (type: DocumentType) => void;
  onClose: () => void;
  selectedType?: DocumentType;
}

const DocumentTypeSelector: React.FC<DocumentTypeSelectorProps> = ({
  visible,
  onSelectType,
  onClose,
  selectedType,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(selectedType?.id || null);

  const handleSelect = (type: DocumentType) => {
    setSelectedId(type.id);
    onSelectType(type);
  };

  const renderDocumentType = ({ item: type }: { item: DocumentType }) => {
    const isSelected = selectedId === type.id;
    
    return (
      <TouchableOpacity
        style={[styles.typeCard, isSelected && styles.selectedCard]}
        onPress={() => handleSelect(type)}
        activeOpacity={0.8}
      >
        <View style={[styles.iconContainer, isSelected && styles.selectedIconContainer]}>
          <Ionicons 
            name={type.icon as any} 
            size={32} 
            color={isSelected ? DesignSystem.colors.textInverse : DesignSystem.colors.primary} 
          />
        </View>
        
        <Text style={[styles.typeName, isSelected && styles.selectedTypeName]}>
          {type.name}
        </Text>
        
        <Text style={[styles.typeDescription, isSelected && styles.selectedDescription]}>
          {type.description}
        </Text>
        
        {type.requiresBothSides && (
          <View style={styles.bothSidesBadge}>
            <Ionicons name="refresh" size={12} color={DesignSystem.colors.warning} />
            <Text style={styles.bothSidesText}>Both Sides</Text>
          </View>
        )}
        
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Ionicons name="checkmark-circle" size={20} color={DesignSystem.colors.accent} />
          </View>
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
        {/* Header */}
        <LinearGradient
          {...createGradientStyle(DesignSystem.colors.gradients.dark)}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>Select Document Type</Text>
            
            <View style={styles.placeholder} />
          </View>
        </LinearGradient>

        {/* Document Types Grid */}
        <FlatList
          data={DOCUMENT_TYPES}
          renderItem={renderDocumentType}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.typesGrid}
          showsVerticalScrollIndicator={false}
        />

        {/* Instructions */}
        {selectedId && (
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>Scanning Instructions:</Text>
            {getDocumentTypeById(selectedId)?.scanInstructions.map((instruction, index) => (
              <Text key={index} style={styles.instructionText}>
                • {instruction}
              </Text>
            ))}
          </View>
        )}

        {/* Continue Button */}
        {selectedId && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.continueButton}
              onPress={() => {
                const type = getDocumentTypeById(selectedId);
                if (type) {
                  onSelectType(type);
                }
              }}
            >
              <View style={styles.continueGradient}>
                <Ionicons name="camera" size={20} color="white" />
                <Text style={styles.continueText}>Start Scanning</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
};

const getDocumentTypeById = (id: string) => {
  return DOCUMENT_TYPES.find(type => type.id === id);
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...createTextStyle('xl', 'bold'),
    color: DesignSystem.colors.textInverse,
  },
  placeholder: {
    width: 40,
  },
  typesGrid: {
    padding: DesignSystem.spacing.xl,
    paddingBottom: DesignSystem.spacing.sm,
  },
  typeCard: {
    width: cardWidth,
    backgroundColor: DesignSystem.colors.surface,
    borderRadius: DesignSystem.borderRadius.lg,
    padding: DesignSystem.spacing.xl,
    margin: DesignSystem.spacing.sm,
    alignItems: 'center',
    ...DesignSystem.shadows.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    borderColor: DesignSystem.colors.primary,
    backgroundColor: DesignSystem.colors.surfaceVariant,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: DesignSystem.colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DesignSystem.spacing.md,
  },
  selectedIconContainer: {
    backgroundColor: DesignSystem.colors.primary,
  },
  typeName: {
    ...createTextStyle('base', 'semibold'),
    color: DesignSystem.colors.textPrimary,
    marginBottom: DesignSystem.spacing.xs,
    textAlign: 'center',
  },
  selectedTypeName: {
    color: DesignSystem.colors.primary,
  },
  typeDescription: {
    ...createTextStyle('xs', 'normal'),
    color: DesignSystem.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: DesignSystem.spacing.sm,
  },
  selectedDescription: {
    color: DesignSystem.colors.primary,
  },
  bothSidesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DesignSystem.colors.surfaceVariant,
    paddingHorizontal: DesignSystem.spacing.sm,
    paddingVertical: DesignSystem.spacing.xs,
    borderRadius: DesignSystem.borderRadius.md,
    marginTop: DesignSystem.spacing.xs,
  },
  bothSidesText: {
    ...createTextStyle('xs', 'medium'),
    color: DesignSystem.colors.warning,
    marginLeft: DesignSystem.spacing.xs,
  },
  selectedIndicator: {
    position: 'absolute',
    top: DesignSystem.spacing.sm,
    right: DesignSystem.spacing.sm,
  },
  instructionsContainer: {
    backgroundColor: DesignSystem.colors.surface,
    margin: DesignSystem.spacing.xl,
    padding: DesignSystem.spacing.lg,
    borderRadius: DesignSystem.borderRadius.lg,
    ...DesignSystem.shadows.md,
  },
  instructionsTitle: {
    ...createTextStyle('base', 'semibold'),
    color: DesignSystem.colors.textPrimary,
    marginBottom: DesignSystem.spacing.sm,
  },
  instructionText: {
    ...createTextStyle('sm', 'normal'),
    color: DesignSystem.colors.textSecondary,
    lineHeight: 20,
    marginBottom: DesignSystem.spacing.xs,
  },
  buttonContainer: {
    padding: DesignSystem.spacing.xl,
    paddingBottom: DesignSystem.spacing['4xl'],
  },
  continueButton: {
    borderRadius: DesignSystem.borderRadius.lg,
    backgroundColor: DesignSystem.colors.primary,
    ...DesignSystem.shadows.lg,
  },
  continueGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DesignSystem.spacing.lg,
    paddingHorizontal: DesignSystem.spacing['2xl'],
    borderRadius: DesignSystem.borderRadius.lg,
  },
  continueText: {
    ...createTextStyle('lg', 'semibold'),
    color: DesignSystem.colors.textInverse,
    marginLeft: DesignSystem.spacing.sm,
  },
});

export default DocumentTypeSelector;