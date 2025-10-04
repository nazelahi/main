import React, { useState } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ScannedDocument } from '../utils/pdfExport';
import { DocumentType } from '../config/documentTypes';

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2;

interface BatchManagerProps {
  visible: boolean;
  documents: ScannedDocument[];
  documentType: DocumentType;
  onClose: () => void;
  onExportPDF: (documents: ScannedDocument[]) => void;
  onDeleteDocument: (documentId: string) => void;
  onReorderDocuments: (documents: ScannedDocument[]) => void;
}

const BatchManager: React.FC<BatchManagerProps> = ({
  visible,
  documents,
  documentType,
  onClose,
  onExportPDF,
  onDeleteDocument,
  onReorderDocuments,
}) => {
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);

  const toggleSelection = (documentId: string) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
    }
    
    setSelectedDocuments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(documentId)) {
        newSet.delete(documentId);
      } else {
        newSet.add(documentId);
      }
      
      if (newSet.size === 0) {
        setIsSelectionMode(false);
      }
      
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedDocuments(new Set(documents.map(doc => doc.id)));
  };

  const clearSelection = () => {
    setSelectedDocuments(new Set());
    setIsSelectionMode(false);
  };

  const deleteSelected = () => {
    Alert.alert(
      'Delete Documents',
      `Are you sure you want to delete ${selectedDocuments.size} document(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            selectedDocuments.forEach(id => onDeleteDocument(id));
            clearSelection();
          }
        }
      ]
    );
  };

  const handleExportPDF = () => {
    const docsToExport = selectedDocuments.size > 0 
      ? documents.filter(doc => selectedDocuments.has(doc.id))
      : documents;
    
    onExportPDF(docsToExport);
    onClose();
  };

  const moveDocument = (fromIndex: number, toIndex: number) => {
    const newDocuments = [...documents];
    const [movedDoc] = newDocuments.splice(fromIndex, 1);
    newDocuments.splice(toIndex, 0, movedDoc);
    onReorderDocuments(newDocuments);
  };

  const renderDocument = ({ item: doc, index }: { item: ScannedDocument; index: number }) => {
    const isSelected = selectedDocuments.has(doc.id);
    
    return (
      <TouchableOpacity
        style={[styles.documentCard, isSelected && styles.selectedCard]}
        onPress={() => {
          if (isSelectionMode) {
            toggleSelection(doc.id);
          }
        }}
        onLongPress={() => toggleSelection(doc.id)}
        activeOpacity={0.8}
      >
        <Image source={{ uri: doc.uri }} style={styles.documentImage} />
        
        <View style={styles.documentInfo}>
          <Text style={styles.documentSide}>
            {doc.side === 'single' ? 'Document' : `${doc.side.charAt(0).toUpperCase() + doc.side.slice(1)} Side`}
          </Text>
          <Text style={styles.documentTime}>
            {new Date(doc.timestamp).toLocaleTimeString()}
          </Text>
        </View>
        
        {isSelected && (
          <View style={styles.selectionOverlay}>
            <View style={styles.selectionCheck}>
              <Ionicons name="checkmark" size={16} color="white" />
            </View>
          </View>
        )}
        
        <View style={styles.documentActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onDeleteDocument(doc.id)}
          >
            <Ionicons name="trash" size={16} color="#FF3B30" />
          </TouchableOpacity>
        </View>
        
        {index > 0 && (
          <TouchableOpacity
            style={styles.moveUpButton}
            onPress={() => moveDocument(index, index - 1)}
          >
            <Ionicons name="chevron-up" size={16} color="#007AFF" />
          </TouchableOpacity>
        )}
        
        {index < documents.length - 1 && (
          <TouchableOpacity
            style={styles.moveDownButton}
            onPress={() => moveDocument(index, index + 1)}
          >
            <Ionicons name="chevron-down" size={16} color="#007AFF" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="document-outline" size={64} color="#666" />
      <Text style={styles.emptyTitle}>No Documents</Text>
      <Text style={styles.emptySubtitle}>
        Start scanning to add documents to this batch
      </Text>
    </View>
  );

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
          colors={['#007AFF', '#0056CC']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.headerButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>{documentType.name} Batch</Text>
              <Text style={styles.headerSubtitle}>
                {documents.length} document{documents.length !== 1 ? 's' : ''}
              </Text>
            </View>
            
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
              <Ionicons 
                name={isSelectionMode ? "close" : "checkmark-circle"} 
                size={24} 
                color="white" 
              />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Selection Controls */}
        {isSelectionMode && (
          <View style={styles.selectionControls}>
            <TouchableOpacity style={styles.selectionButton} onPress={selectAll}>
              <Text style={styles.selectionButtonText}>Select All</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.selectionButton} onPress={clearSelection}>
              <Text style={styles.selectionButtonText}>Clear</Text>
            </TouchableOpacity>
            
            {selectedDocuments.size > 0 && (
              <TouchableOpacity 
                style={[styles.selectionButton, styles.deleteButton]} 
                onPress={deleteSelected}
              >
                <Text style={[styles.selectionButtonText, styles.deleteButtonText]}>
                  Delete ({selectedDocuments.size})
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Documents Grid */}
        <FlatList
          data={documents}
          renderItem={renderDocument}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.documentsGrid}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={() => setShowExportOptions(true)}
            disabled={documents.length === 0}
          >
            <LinearGradient
              colors={['#34C759', '#28A745']}
              style={styles.exportGradient}
            >
              <Ionicons name="document-text" size={20} color="white" />
              <Text style={styles.exportText}>
                Export PDF ({documents.length})
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Export Options Modal */}
        <Modal
          visible={showExportOptions}
          transparent
          animationType="fade"
          onRequestClose={() => setShowExportOptions(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Export Options</Text>
              
              <View style={styles.exportOption}>
                <Ionicons name="document-text" size={24} color="#007AFF" />
                <View style={styles.exportOptionText}>
                  <Text style={styles.exportOptionTitle}>Export as PDF</Text>
                  <Text style={styles.exportOptionDescription}>
                    {selectedDocuments.size > 0 
                      ? `Export ${selectedDocuments.size} selected documents`
                      : `Export all ${documents.length} documents`
                    }
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.exportOptionButton}
                  onPress={handleExportPDF}
                >
                  <Ionicons name="arrow-forward" size={20} color="#007AFF" />
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowExportOptions(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 2,
  },
  selectionControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  selectionButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  selectionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#ff3b30',
  },
  deleteButtonText: {
    color: 'white',
  },
  documentsGrid: {
    padding: 20,
    paddingBottom: 100,
  },
  documentCard: {
    width: cardWidth,
    backgroundColor: 'white',
    borderRadius: 16,
    margin: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  selectedCard: {
    borderWidth: 3,
    borderColor: '#007AFF',
  },
  documentImage: {
    width: '100%',
    height: cardWidth * 0.8,
    backgroundColor: '#f0f0f0',
  },
  documentInfo: {
    padding: 12,
  },
  documentSide: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  documentTime: {
    fontSize: 12,
    color: '#666',
  },
  selectionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,122,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionCheck: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentActions: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moveUpButton: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moveDownButton: {
    position: 'absolute',
    top: 48,
    left: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
  actionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e5ea',
  },
  exportButton: {
    borderRadius: 16,
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  exportGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  exportText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    minWidth: 300,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 20,
    textAlign: 'center',
  },
  exportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 16,
  },
  exportOptionText: {
    flex: 1,
    marginLeft: 12,
  },
  exportOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  exportOptionDescription: {
    fontSize: 14,
    color: '#666',
  },
  exportOptionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,122,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
});

export default BatchManager;