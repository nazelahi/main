# Document Type Dependent Scan Mode Implementation

## Overview

The scan mode selection (Single/Batch buttons) now only appears after a document type has been selected, creating a more logical flow where users first choose what type of document they want to scan, then choose how to scan it.

## 🚀 Changes Implemented

### **1. Conditional Scan Mode Display**
- **Before**: Scan mode buttons visible immediately
- **After**: Scan mode buttons only appear after document type selection

### **2. Logical Flow**
- **Step 1**: User selects document type (ID Card, Receipt, etc.)
- **Step 2**: Single/Batch buttons appear
- **Step 3**: User selects scan mode
- **Step 4**: Scanning begins

### **3. Pre-selected Document Type Support**
- **Before**: No handling for pre-selected document types
- **After**: Automatically shows scan mode if document type is pre-selected

## 🎯 UI Behavior

### **New Flow**

#### **Scenario 1: No Pre-selection**
1. **Scanner Opens**: Only document type selection visible
2. **User Selects Type**: Single/Batch buttons appear
3. **User Selects Mode**: Ready to scan

#### **Scenario 2: Pre-selected Document Type**
1. **Scanner Opens**: Both document type and scan mode visible
2. **User Selects Mode**: Ready to scan

### **Visual States**

#### **Initial State (No Document Type Selected)**
```
┌─────────────────────────────────────┐
│  [ID] [Receipt] [Contract] [Card]   │  ← Only document types visible
└─────────────────────────────────────┘
```

#### **After Document Type Selection**
```
┌─────────────────────────────────────┐
│  ┌─────────┐    ┌─────────┐        │
│  │ 📄 Single│    │ 📚 Batch │        │  ← Scan mode appears
│  └─────────┘    └─────────┘        │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  [ID] [Receipt] [Contract] [Card]   │  ← Document types still visible
└─────────────────────────────────────┘
```

## 🔧 Technical Implementation

### **State Management**
```typescript
// Unified scanning flow states
const [showScanModeSelection, setShowScanModeSelection] = useState(false);
const [selectedScanMode, setSelectedScanMode] = useState<'single' | 'batch' | null>(null);
const [showDocumentTypeSelection, setShowDocumentTypeSelection] = useState(true);
const [documentTypeSelected, setDocumentTypeSelected] = useState(false);
```

### **Document Type Selection Handler**
```typescript
const handleDocumentTypeSelection = (documentType: DocumentType) => {
  setCurrentDocumentType(documentType);
  setDocumentTypeSelected(true);  // Mark document type as selected
  setShowScanModeSelection(true); // Show scan mode buttons
};
```

### **Pre-selected Document Type Support**
```typescript
// Initialize scan mode selection if document type is pre-selected
useEffect(() => {
  if (selectedDocumentType) {
    setDocumentTypeSelected(true);
    setShowScanModeSelection(true);
  }
}, [selectedDocumentType]);
```

### **Conditional Rendering**
```jsx
{/* Compact Scan Mode Selection */}
{showScanModeSelection && documentTypeSelected && (
  <View style={styles.compactScanModeContainer}>
    {/* Scan mode buttons */}
  </View>
)}
```

## 📱 User Experience

### **Benefits**

#### **Logical Flow**
- **Natural Progression**: Type → Mode → Scan
- **Clear Purpose**: Users understand what they're selecting
- **Reduced Confusion**: No premature mode selection

#### **Cleaner Interface**
- **Focused UI**: Only relevant options shown
- **Less Overwhelming**: Fewer choices at once
- **Better Guidance**: Clear next steps

#### **Flexible Usage**
- **Pre-selection Support**: Works with pre-selected document types
- **Dynamic Updates**: UI updates based on selections
- **Consistent Behavior**: Same flow regardless of initialization

### **User Scenarios**

#### **Scenario 1: New User**
1. Opens scanner
2. Sees document types only
3. Selects "Receipt"
4. Single/Batch buttons appear
5. Selects "Single"
6. Ready to scan

#### **Scenario 2: Returning User**
1. Opens scanner with pre-selected "ID Card"
2. Sees both document types and scan mode buttons
3. Selects "Batch"
4. Ready to scan

#### **Scenario 3: Changing Document Type**
1. Has "Receipt" + "Single" selected
2. Changes to "Contract"
3. Scan mode buttons remain visible
4. Can change to "Batch" if desired

## 🎨 Visual Design

### **Layout Progression**

#### **Step 1: Document Type Selection Only**
```
┌─────────────────────────────────────┐
│                                     │
│           Camera Preview            │
│                                     │
│  [ID] [Receipt] [Contract] [Card]   │  ← Only document types
└─────────────────────────────────────┘
```

#### **Step 2: Both Selections Visible**
```
┌─────────────────────────────────────┐
│                                     │
│           Camera Preview            │
│                                     │
│  ┌─────────┐    ┌─────────┐        │  ← Scan mode appears
│  │ 📄 Single│    │ 📚 Batch │        │
│  └─────────┘    └─────────┘        │
│                                     │
│  [ID] [Receipt] [Contract] [Card]   │  ← Document types remain
└─────────────────────────────────────┘
```

### **Animation and Transitions**
- **Smooth Appearance**: Scan mode buttons fade in
- **Consistent Positioning**: Buttons appear in same location
- **Visual Feedback**: Clear indication of progression

## 🔄 State Transitions

### **State Flow Diagram**
```
Initial State
    ↓
Document Type Selected
    ↓
Scan Mode Buttons Appear
    ↓
Scan Mode Selected
    ↓
Ready to Scan
```

### **State Variables**
- `documentTypeSelected`: Tracks if document type has been chosen
- `showScanModeSelection`: Controls scan mode button visibility
- `selectedScanMode`: Tracks selected scan mode
- `currentDocumentType`: Tracks selected document type

## 🚀 Usage Examples

### **Basic Usage**
```typescript
// No pre-selection - user chooses document type first
<UnifiedCameraScanner
  visible={showScanner}
  onDocumentScanned={handleDocumentScanned}
  onBatchComplete={handleBatchComplete}
  onClose={() => setShowScanner(false)}
/>
```

### **With Pre-selected Document Type**
```typescript
// Pre-selected document type - scan mode appears immediately
<UnifiedCameraScanner
  visible={showScanner}
  selectedDocumentType={DOCUMENT_TYPES.find(t => t.id === 'receipt')}
  onDocumentScanned={handleDocumentScanned}
  onBatchComplete={handleBatchComplete}
  onClose={() => setShowScanner(false)}
/>
```

## ✅ Benefits

### **User Experience**
- **Logical Flow**: Natural progression from type to mode
- **Reduced Cognitive Load**: Fewer choices at once
- **Clear Guidance**: Obvious next steps
- **Flexible Usage**: Works with or without pre-selection

### **Technical Benefits**
- **Cleaner State Management**: Clear dependencies between states
- **Better Performance**: Only renders necessary UI elements
- **Easier Testing**: Clear state transitions to test
- **Maintainable Code**: Logical flow in code matches user flow

## 🎉 Conclusion

The document type dependent scan mode implementation provides:

- **Better User Flow**: Logical progression from document type to scan mode
- **Cleaner Interface**: Only relevant options shown at each step
- **Flexible Usage**: Supports both pre-selected and user-selected document types
- **Improved UX**: Reduces confusion and guides users naturally

The implementation creates a more intuitive scanning experience where users first decide what they want to scan, then how they want to scan it, making the process more logical and user-friendly.
