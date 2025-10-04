# Theme Consistency Fixes

## HomeScreen Theme Pattern Analysis

The HomeScreen uses a modern, glass morphism theme with these key elements:

### Core Theme Elements:
1. **Dark gradient background** - `DesignSystem.colors.gradients.primary`
2. **Glass morphism effects** - `BlurView` with `intensity={20-30}`
3. **Floating animations** - Smooth, subtle movements
4. **Consistent colors** - White text on dark backgrounds with transparency
5. **Modern cards** - Rounded corners, subtle borders, glass effects
6. **Consistent spacing** - Using `DesignSystem.spacing`
7. **Typography** - Using `createTextStyle` helper
8. **Gradient overlays** - Throughout the interface

## Screens That Need Theme Updates:

### 1. DocumentList.tsx
**Current Issues:**
- Basic LinearGradient without glass effects
- Missing BlurView overlays
- No floating animations
- Inconsistent card styling

**Required Fixes:**
- Add glass morphism effects to cards
- Implement floating background elements
- Add BlurView overlays for modern look
- Update button styling to match HomeScreen

### 2. ImagePreview.tsx
**Current Issues:**
- Uses SafeAreaView instead of custom header
- Missing glass morphism effects
- No floating background elements
- Inconsistent button styling

**Required Fixes:**
- Replace SafeAreaView with custom header
- Add glass morphism effects
- Implement floating animations
- Update modal presentation

### 3. DocumentScanner.tsx
**Current Issues:**
- Camera-focused UI without glass effects
- Missing floating animations
- Inconsistent control styling
- No glass morphism overlays

**Required Fixes:**
- Add glass morphism overlays for controls
- Implement floating background elements
- Update control button styling
- Add BlurView effects

### 4. UnifiedScanner.tsx
**Current Issues:**
- Similar to DocumentScanner
- Missing glass morphism
- No floating elements
- Inconsistent theming

**Required Fixes:**
- Add glass morphism effects
- Implement floating animations
- Update control styling
- Add BlurView overlays

### 5. SmartScanner.tsx
**Current Issues:**
- Missing glass effects
- No floating animations
- Inconsistent styling

**Required Fixes:**
- Add glass morphism effects
- Implement floating animations
- Update UI elements styling

### 6. BatchScanner.tsx
**Current Issues:**
- Missing glass morphism
- No floating elements
- Inconsistent theming

**Required Fixes:**
- Add glass morphism effects
- Implement floating animations
- Update styling consistency

### 7. ExportOptionsModal.tsx
**Current Issues:**
- Basic modal styling
- Missing glass effects
- No floating animations
- Inconsistent button designs

**Required Fixes:**
- Add glass morphism effects
- Implement floating background elements
- Update button styling
- Add BlurView overlays

### 8. AIInsightsModal.tsx
**Current Issues:**
- Missing glass morphism
- No floating elements
- Inconsistent card styling

**Required Fixes:**
- Add glass morphism effects
- Implement floating animations
- Update card styling
- Add BlurView overlays

### 9. DocumentTypeSelector.tsx
**Current Issues:**
- Basic modal presentation
- Missing glass effects
- No floating animations

**Required Fixes:**
- Add glass morphism effects
- Implement floating animations
- Update modal presentation
- Add BlurView overlays

## Implementation Priority:

### High Priority (Core Screens):
1. DocumentList.tsx
2. ImagePreview.tsx
3. DocumentScanner.tsx
4. UnifiedScanner.tsx

### Medium Priority (Scanner Variants):
5. SmartScanner.tsx
6. BatchScanner.tsx

### Low Priority (Modals):
7. ExportOptionsModal.tsx
8. AIInsightsModal.tsx
9. DocumentTypeSelector.tsx

## Common Fixes Needed:

1. **Add floating background elements** to all screens
2. **Implement glass morphism** with BlurView components
3. **Update button styling** to match HomeScreen pattern
4. **Add consistent animations** throughout
5. **Update color scheme** to match HomeScreen
6. **Implement consistent spacing** using DesignSystem
7. **Add gradient overlays** where appropriate
8. **Update typography** to use createTextStyle helper
