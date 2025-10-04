// import * as ImageManipulator from 'expo-image-manipulator';
import { DocumentProcessor } from './imageProcessing';

export interface DocumentType {
  id: string;
  name: string;
  confidence: number;
  characteristics: {
    hasText: boolean;
    hasImages: boolean;
    hasTables: boolean;
    isColor: boolean;
    isHandwritten: boolean;
  };
}

export interface EnhancementPreset {
  id: string;
  name: string;
  description: string;
  settings: {
    contrast: number;
    brightness: number;
    saturation: number;
    grayscale: number;
    sharpen: boolean;
    removeShadows: boolean;
    autoColorDetection: boolean;
  };
}

export interface EnhancementResult {
  originalUri: string;
  enhancedUri: string;
  documentType: DocumentType;
  appliedPreset: EnhancementPreset;
  qualityImprovement: number;
  processingTime: number;
}

export class IntelligentEnhancementEngine {
  private static instance: IntelligentEnhancementEngine;
  private enhancementHistory: EnhancementResult[] = [];
  private userPreferences: Map<string, number> = new Map();

  // Predefined enhancement presets
  private presets: EnhancementPreset[] = [
    {
      id: 'text_document',
      name: 'Text Document',
      description: 'Optimized for text-heavy documents',
      settings: {
        contrast: 1.4,
        brightness: 0.1,
        saturation: 0.8,
        grayscale: 0,
        sharpen: true,
        removeShadows: true,
        autoColorDetection: true
      }
    },
    {
      id: 'photo_document',
      name: 'Photo Document',
      description: 'Preserves colors and details for images',
      settings: {
        contrast: 1.1,
        brightness: 0.05,
        saturation: 1.1,
        grayscale: 0,
        sharpen: false,
        removeShadows: false,
        autoColorDetection: true
      }
    },
    {
      id: 'mixed_document',
      name: 'Mixed Content',
      description: 'Balanced enhancement for text and images',
      settings: {
        contrast: 1.2,
        brightness: 0.08,
        saturation: 1.0,
        grayscale: 0,
        sharpen: true,
        removeShadows: true,
        autoColorDetection: true
      }
    },
    {
      id: 'receipt',
      name: 'Receipt/Invoice',
      description: 'Optimized for receipts and financial documents',
      settings: {
        contrast: 1.5,
        brightness: 0.15,
        saturation: 0.9,
        grayscale: 0,
        sharpen: true,
        removeShadows: true,
        autoColorDetection: true
      }
    },
    {
      id: 'handwritten',
      name: 'Handwritten',
      description: 'Enhanced for handwritten text',
      settings: {
        contrast: 1.3,
        brightness: 0.12,
        saturation: 0.7,
        grayscale: 0,
        sharpen: true,
        removeShadows: true,
        autoColorDetection: true
      }
    },
    {
      id: 'business_card',
      name: 'Business Card',
      description: 'Optimized for contact cards',
      settings: {
        contrast: 1.2,
        brightness: 0.1,
        saturation: 1.2,
        grayscale: 0,
        sharpen: true,
        removeShadows: true,
        autoColorDetection: true
      }
    }
  ];

  static getInstance(): IntelligentEnhancementEngine {
    if (!IntelligentEnhancementEngine.instance) {
      IntelligentEnhancementEngine.instance = new IntelligentEnhancementEngine();
    }
    return IntelligentEnhancementEngine.instance;
  }

  /**
   * Intelligently enhance document based on content analysis
   */
  async enhanceDocument(imageUri: string, forcePreset?: string): Promise<EnhancementResult> {
    const startTime = Date.now();
    
    try {
      console.log('Starting intelligent enhancement...');
      
      // Analyze document content
      const documentType = await this.analyzeDocumentContent(imageUri);
      console.log('Document type detected:', documentType);

      // Select appropriate preset
      const preset = forcePreset 
        ? this.presets.find(p => p.id === forcePreset) || this.presets[0]
        : this.selectOptimalPreset(documentType);

      console.log('Selected preset:', preset.name);

      // Apply enhancement
      const enhancedUri = await this.applyEnhancement(imageUri, preset.settings);
      
      // Calculate quality improvement
      const qualityImprovement = await this.calculateQualityImprovement(imageUri, enhancedUri);
      
      const result: EnhancementResult = {
        originalUri: imageUri,
        enhancedUri,
        documentType,
        appliedPreset: preset,
        qualityImprovement,
        processingTime: Date.now() - startTime
      };

      // Store in history for learning
      this.enhancementHistory.push(result);
      if (this.enhancementHistory.length > 50) {
        this.enhancementHistory.shift();
      }

      // Update user preferences
      this.updateUserPreferences(documentType, preset);

      console.log('Intelligent enhancement completed:', {
        type: documentType.name,
        preset: preset.name,
        improvement: qualityImprovement
      });

      return result;
    } catch (error) {
      console.error('Intelligent enhancement failed:', error);
      throw new Error('Failed to enhance document intelligently');
    }
  }

  /**
   * Analyze document content to determine type
   */
  private async analyzeDocumentContent(imageUri: string): Promise<DocumentType> {
    // Simulate content analysis
    await new Promise(resolve => setTimeout(resolve, 300));

    // Simulate AI analysis of document characteristics
    const hasText = Math.random() > 0.2; // 80% chance of having text
    const hasImages = Math.random() > 0.6; // 40% chance of having images
    const hasTables = Math.random() > 0.8; // 20% chance of having tables
    const isColor = Math.random() > 0.4; // 60% chance of being color
    const isHandwritten = Math.random() > 0.9; // 10% chance of being handwritten

    const characteristics = {
      hasText,
      hasImages,
      hasTables,
      isColor,
      isHandwritten
    };

    // Determine document type based on characteristics
    let documentType: DocumentType;

    if (isHandwritten) {
      documentType = {
        id: 'handwritten',
        name: 'Handwritten Document',
        confidence: 0.9,
        characteristics
      };
    } else if (hasImages && !hasText) {
      documentType = {
        id: 'photo',
        name: 'Photo Document',
        confidence: 0.85,
        characteristics
      };
    } else if (hasTables && hasText) {
      documentType = {
        id: 'receipt',
        name: 'Receipt/Invoice',
        confidence: 0.8,
        characteristics
      };
    } else if (hasText && !hasImages) {
      documentType = {
        id: 'text',
        name: 'Text Document',
        confidence: 0.9,
        characteristics
      };
    } else if (hasText && hasImages) {
      documentType = {
        id: 'mixed',
        name: 'Mixed Content',
        confidence: 0.75,
        characteristics
      };
    } else {
      documentType = {
        id: 'unknown',
        name: 'Unknown Document',
        confidence: 0.5,
        characteristics
      };
    }

    return documentType;
  }

  /**
   * Select optimal enhancement preset based on document type and user preferences
   */
  private selectOptimalPreset(documentType: DocumentType): EnhancementPreset {
    const { characteristics } = documentType;

    // Find presets that match document characteristics
    const matchingPresets = this.presets.filter(preset => {
      switch (preset.id) {
        case 'text_document':
          return characteristics.hasText && !characteristics.hasImages;
        case 'photo_document':
          return characteristics.hasImages && !characteristics.hasText;
        case 'mixed_document':
          return characteristics.hasText && characteristics.hasImages;
        case 'receipt':
          return characteristics.hasTables || documentType.name.includes('Receipt');
        case 'handwritten':
          return characteristics.isHandwritten;
        case 'business_card':
          return documentType.name.includes('Business Card');
        default:
          return false;
      }
    });

    if (matchingPresets.length === 0) {
      return this.presets[0]; // Default preset
    }

    // Apply user preferences if available
    const userPreferenceKey = `${documentType.id}_${characteristics.isColor ? 'color' : 'bw'}`;
    const userPreference = this.userPreferences.get(userPreferenceKey);

    if (userPreference && matchingPresets.length > 1) {
      // Sort by user preference
      matchingPresets.sort((a, b) => {
        const aScore = this.userPreferences.get(a.id) || 0;
        const bScore = this.userPreferences.get(b.id) || 0;
        return bScore - aScore;
      });
    }

    return matchingPresets[0];
  }

  /**
   * Apply enhancement using the selected preset
   */
  private async applyEnhancement(imageUri: string, settings: EnhancementPreset['settings']): Promise<string> {
    try {
      const enhancedUri = await DocumentProcessor.enhanceDocument(imageUri, settings);
      return enhancedUri;
    } catch (error) {
      console.error('Enhancement application failed:', error);
      throw error;
    }
  }

  /**
   * Calculate quality improvement score
   */
  private async calculateQualityImprovement(originalUri: string, enhancedUri: string): Promise<number> {
    // Simulate quality comparison
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Simulate quality improvement calculation
    const improvement = Math.random() * 0.4 + 0.1; // 0.1 to 0.5 improvement
    return Math.min(improvement, 1.0);
  }

  /**
   * Update user preferences based on enhancement results
   */
  private updateUserPreferences(documentType: DocumentType, preset: EnhancementPreset): void {
    const key = `${documentType.id}_${documentType.characteristics.isColor ? 'color' : 'bw'}`;
    const currentPreference = this.userPreferences.get(key) || 0;
    
    // Increase preference for this preset
    this.userPreferences.set(key, currentPreference + 1);
  }

  /**
   * Get available enhancement presets
   */
  getPresets(): EnhancementPreset[] {
    return [...this.presets];
  }

  /**
   * Get enhancement history
   */
  getEnhancementHistory(): EnhancementResult[] {
    return [...this.enhancementHistory];
  }

  /**
   * Get user preferences
   */
  getUserPreferences(): Map<string, number> {
    return new Map(this.userPreferences);
  }

  /**
   * Reset user preferences
   */
  resetUserPreferences(): void {
    this.userPreferences.clear();
  }

  /**
   * Get enhancement statistics
   */
  getEnhancementStats(): {
    totalEnhancements: number;
    averageImprovement: number;
    mostUsedPreset: string;
    documentTypeDistribution: Record<string, number>;
  } {
    const totalEnhancements = this.enhancementHistory.length;
    
    if (totalEnhancements === 0) {
      return {
        totalEnhancements: 0,
        averageImprovement: 0,
        mostUsedPreset: 'none',
        documentTypeDistribution: {}
      };
    }

    const averageImprovement = this.enhancementHistory.reduce(
      (sum, result) => sum + result.qualityImprovement, 0
    ) / totalEnhancements;

    const presetUsage = new Map<string, number>();
    const documentTypeDistribution: Record<string, number> = {};

    this.enhancementHistory.forEach(result => {
      // Count preset usage
      const presetCount = presetUsage.get(result.appliedPreset.id) || 0;
      presetUsage.set(result.appliedPreset.id, presetCount + 1);

      // Count document type distribution
      const typeCount = documentTypeDistribution[result.documentType.id] || 0;
      documentTypeDistribution[result.documentType.id] = typeCount + 1;
    });

    const mostUsedPreset = Array.from(presetUsage.entries())
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'none';

    return {
      totalEnhancements,
      averageImprovement,
      mostUsedPreset,
      documentTypeDistribution
    };
  }
}

export default IntelligentEnhancementEngine;