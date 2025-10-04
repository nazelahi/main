import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  FlatList,
  Image,
  Dimensions,
  Alert,
  Modal,
  Animated,
  StatusBar,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
// import * as MediaLibrary from 'expo-media-library';
// import * as FileSystem from 'expo-file-system';
import { DocumentStorage, StoredDocument } from '../utils/documentStorage';
import { DesignSystem, createGradientStyle, createTextStyle, createShadowStyle } from '../config/designSystem';

const { width } = Dimensions.get('window');
const itemWidth = (width - 60) / 2;

interface DocumentListProps {
  images: string[];
  onBack: () => void;
  onImagePress: (imageUri: string) => void;
  onDocumentsDeleted?: (deletedUris: string[]) => void;
}

const DocumentList: React.FC<DocumentListProps> = ({ images, onBack, onImagePress, onDocumentsDeleted }) => {
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [scaleAnim] = useState(new Animated.Value(0.9));
  
  // Floating animation refs
  const floatingAnim1 = useRef(new Animated.Value(0)).current;
  const floatingAnim2 = useRef(new Animated.Value(0)).current;
  const floatingAnim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
  }, []);

  const toggleSelection = (imageUri: string) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
    }
    
    setSelectedImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(imageUri)) {
        newSet.delete(imageUri);
      } else {
        newSet.add(imageUri);
      }
      
      if (newSet.size === 0) {
        setIsSelectionMode(false);
      }
      
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedImages(new Set(images));
  };

  const clearSelection = () => {
    setSelectedImages(new Set());
    setIsSelectionMode(false);
  };

  const deleteSelected = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      // Get all stored documents to find the ones to delete
      const allDocuments = await DocumentStorage.getAllDocuments();
      const documentsToDelete = allDocuments.filter(doc => 
        selectedImages.has(doc.uri)
      );
      
      if (documentsToDelete.length === 0) {
        Alert.alert('Error', 'No documents found to delete');
        return;
      }

      // Delete documents from persistent storage
      const deletePromises = documentsToDelete.map(doc => 
        DocumentStorage.deleteDocument(doc.id)
      );
      
      const results = await Promise.all(deletePromises);
      const successCount = results.filter(Boolean).length;
      
      if (successCount > 0) {
        Alert.alert('Success', `${successCount} document(s) deleted successfully`);
        
        // Notify parent component about deleted documents
        if (onDocumentsDeleted) {
          onDocumentsDeleted(Array.from(selectedImages));
        }
      } else {
        Alert.alert('Error', 'Failed to delete documents');
      }
      
      setSelectedImages(new Set());
      setIsSelectionMode(false);
    } catch (error) {
      console.error('Error deleting documents:', error);
      Alert.alert('Error', 'Failed to delete documents');
    } finally {
      setShowDeleteModal(false);
    }
  };

  const shareDocument = async (imageUri: string) => {
    // In a real app, you would implement sharing functionality
    Alert.alert('Share', 'Sharing functionality would be implemented here');
  };

  const renderDocumentItem = ({ item: imageUri, index }: { item: string; index: number }) => {
    const isSelected = selectedImages.has(imageUri);
    
    return (
      <Animated.View
        style={[
          styles.documentItem,
          isSelected && styles.documentItemSelected,
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
          style={styles.documentItemContent}
          onPress={() => {
            if (isSelectionMode) {
              toggleSelection(imageUri);
            } else {
              onImagePress(imageUri);
            }
          }}
          onLongPress={() => toggleSelection(imageUri)}
          activeOpacity={0.7}
        >
          <View style={styles.documentImageContainer}>
            <Image source={{ uri: imageUri }} style={styles.documentImage} />
            <View style={styles.documentGradientOverlay} />
          </View>
          
          {isSelected && (
            <BlurView intensity={20} style={styles.selectionOverlay}>
              <View style={styles.selectionCheck}>
                <Ionicons name="checkmark" size={18} color="white" />
              </View>
            </BlurView>
          )}
          
          <BlurView intensity={15} style={styles.documentActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => shareDocument(imageUri)}
            >
              <View style={styles.actionButtonContent}>
                <Ionicons name="share" size={14} color="rgba(255,255,255,0.9)" />
              </View>
            </TouchableOpacity>
          </BlurView>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <LinearGradient
        {...createGradientStyle(DesignSystem.colors.gradients.primary)}
        style={styles.emptyStateIcon}
      >
        <Ionicons name="document-outline" size={48} color="white" />
      </LinearGradient>
      <Text style={styles.emptyStateTitle}>No Documents Yet</Text>
      <Text style={styles.emptyStateSubtitle}>
        Start scanning documents to see them here
      </Text>
    </View>
  );

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
        {/* Header */}
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
            <View style={styles.headerControls}>
              <TouchableOpacity style={styles.headerButton} onPress={onBack}>
                <BlurView intensity={20} style={styles.headerButtonBlur}>
                  <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.9)" />
                </BlurView>
              </TouchableOpacity>
              
              <Text style={styles.headerTitle}>
                {isSelectionMode ? `${selectedImages.size} selected` : 'Documents'}
              </Text>
              
              {images.length > 0 && (
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={() => {
                    if (isSelectionMode) {
                      clearSelection();
                    } else {
                      setIsSelectionMode(true);
                    }
                  }}
                >
                  <BlurView intensity={20} style={styles.headerButtonBlur}>
                    <Ionicons 
                      name={isSelectionMode ? "close" : "checkmark-circle"} 
                      size={20} 
                      color="rgba(255,255,255,0.9)" 
                    />
                  </BlurView>
                </TouchableOpacity>
              )}
            </View>
          </BlurView>
        </Animated.View>

        {/* Selection Controls */}
        {isSelectionMode && (
          <Animated.View
            style={[
              styles.selectionControls,
              {
                transform: [
                  {
                    translateY: slideAnim,
                  },
                ],
              },
            ]}
          >
            <BlurView intensity={20} style={styles.selectionControlsBlur}>
              <TouchableOpacity style={styles.selectionButton} onPress={selectAll}>
                <BlurView intensity={15} style={styles.selectionButtonBlur}>
                  <Text style={styles.selectionButtonText}>Select All</Text>
                </BlurView>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.selectionButton} onPress={clearSelection}>
                <BlurView intensity={15} style={styles.selectionButtonBlur}>
                  <Text style={styles.selectionButtonText}>Clear</Text>
                </BlurView>
              </TouchableOpacity>
              
              {selectedImages.size > 0 && (
                <TouchableOpacity 
                  style={styles.selectionButton} 
                  onPress={deleteSelected}
                >
                  <BlurView intensity={15} style={styles.selectionButtonBlur}>
                    <Text style={styles.selectionButtonText}>
                      Delete ({selectedImages.size})
                    </Text>
                  </BlurView>
                </TouchableOpacity>
              )}
            </BlurView>
          </Animated.View>
        )}

        {/* Document Grid */}
        <FlatList
          data={images}
          renderItem={renderDocumentItem}
          keyExtractor={(item, index) => `${item}-${index}`}
          numColumns={2}
          contentContainerStyle={styles.documentGrid}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      </Animated.View>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Documents</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete {selectedImages.size} document(s)? This action cannot be undone.
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmDelete}
              >
                <Text style={styles.confirmButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DesignSystem.spacing.xl,
    paddingVertical: DesignSystem.spacing.xl,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  headerButtonBlur: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: {
    ...createTextStyle('lg', 'bold'),
    color: DesignSystem.colors.textInverse,
  },
  selectionControls: {
    paddingHorizontal: DesignSystem.spacing.xl,
    paddingVertical: DesignSystem.spacing.lg,
    marginTop: -10,
    marginBottom: DesignSystem.spacing.lg,
  },
  selectionControlsBlur: {
    borderRadius: DesignSystem.borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  selectionButton: {
    flex: 1,
    marginHorizontal: DesignSystem.spacing.xs,
    borderRadius: DesignSystem.borderRadius.lg,
    overflow: 'hidden',
  },
  selectionButtonBlur: {
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingVertical: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  selectionButtonText: {
    ...createTextStyle('sm', 'medium'),
    color: DesignSystem.colors.textInverse,
  },
  documentGrid: {
    padding: DesignSystem.spacing.xl,
    paddingTop: 0,
  },
  documentItem: {
    width: itemWidth,
    height: itemWidth * 1.4,
    margin: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borderRadius.lg,
    overflow: 'hidden',
  },
  documentItemContent: {
    flex: 1,
    borderRadius: DesignSystem.borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  documentItemSelected: {
    borderWidth: 2,
    borderColor: DesignSystem.colors.accent,
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
  selectionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentActions: {
    position: 'absolute',
    top: DesignSystem.spacing.sm,
    right: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borderRadius.md,
    overflow: 'hidden',
  },
  actionButton: {
    borderRadius: DesignSystem.borderRadius.md,
    overflow: 'hidden',
  },
  actionButtonContent: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DesignSystem.spacing.xl,
  },
  emptyStateTitle: {
    ...createTextStyle('xl', 'bold'),
    color: DesignSystem.colors.textInverse,
    marginBottom: DesignSystem.spacing.sm,
  },
  emptyStateSubtitle: {
    ...createTextStyle('base', 'normal'),
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: DesignSystem.borderRadius['2xl'],
    padding: DesignSystem.spacing.xl,
    margin: DesignSystem.spacing.xl,
    minWidth: 300,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    ...createShadowStyle('xl'),
  },
  modalTitle: {
    ...createTextStyle('lg', 'bold'),
    color: DesignSystem.colors.textInverse,
    marginBottom: DesignSystem.spacing.sm,
  },
  modalMessage: {
    ...createTextStyle('base', 'normal'),
    color: 'rgba(255,255,255,0.8)',
    marginBottom: DesignSystem.spacing.xl,
    lineHeight: DesignSystem.typography.lineHeights.relaxed * DesignSystem.typography.sizes.base,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modalButton: {
    paddingHorizontal: DesignSystem.spacing.xl,
    paddingVertical: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borderRadius.lg,
    minWidth: 80,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  cancelButtonText: {
    ...createTextStyle('sm', 'medium'),
    color: DesignSystem.colors.textInverse,
  },
  confirmButton: {
    backgroundColor: DesignSystem.colors.error,
  },
  confirmButtonText: {
    ...createTextStyle('sm', 'medium'),
    color: DesignSystem.colors.textInverse,
  },
});

export default DocumentList;