export interface DocumentClassificationResult {
  documentType: string;
  confidence: number;
  subcategory?: string;
  features: {
    hasText: boolean;
    hasLogo: boolean;
    hasSignature: boolean;
    hasTable: boolean;
    hasBarcode: boolean;
    hasPhoto: boolean;
    textDensity: number;
    colorComplexity: number;
    layoutType: 'formal' | 'informal' | 'structured' | 'mixed';
  };
  metadata: {
    language: string;
    dateDetected: boolean;
    amountDetected: boolean;
    companyDetected: boolean;
    personalInfoDetected: boolean;
  };
  tags: string[];
  suggestions: string[];
}

export interface ClassificationModel {
  name: string;
  version: string;
  accuracy: number;
  supportedTypes: string[];
}

export class AIDocumentClassification {
  private static instance: AIDocumentClassification;
  private models: Map<string, ClassificationModel> = new Map();
  private isInitialized = false;

  static getInstance(): AIDocumentClassification {
    if (!AIDocumentClassification.instance) {
      AIDocumentClassification.instance = new AIDocumentClassification();
    }
    return AIDocumentClassification.instance;
  }

  private constructor() {
    this.initializeModels();
  }

  private initializeModels() {
    // Initialize classification models for different document types
    this.models.set('receipt', {
      name: 'Receipt Classifier',
      version: '1.2.0',
      accuracy: 0.94,
      supportedTypes: ['receipt', 'invoice', 'bill', 'payment_confirmation']
    });

    this.models.set('contract', {
      name: 'Contract Classifier',
      version: '1.1.0',
      accuracy: 0.91,
      supportedTypes: ['contract', 'agreement', 'legal_document', 'terms_conditions']
    });

    this.models.set('business_card', {
      name: 'Business Card Classifier',
      version: '1.3.0',
      accuracy: 0.96,
      supportedTypes: ['business_card', 'contact_card', 'name_card']
    });

    this.models.set('id_card', {
      name: 'ID Card Classifier',
      version: '1.0.0',
      accuracy: 0.93,
      supportedTypes: ['id_card', 'driver_license', 'passport', 'student_id']
    });

    this.models.set('letter', {
      name: 'Letter Classifier',
      version: '1.1.0',
      accuracy: 0.89,
      supportedTypes: ['letter', 'memo', 'correspondence', 'email_printout']
    });

    this.models.set('certificate', {
      name: 'Certificate Classifier',
      version: '1.0.0',
      accuracy: 0.92,
      supportedTypes: ['certificate', 'diploma', 'award', 'achievement']
    });

    this.isInitialized = true;
    console.log('AI Document Classification models initialized');
  }

  async classifyDocument(imageUri: string, options: {
    enableSubclassification?: boolean;
    extractMetadata?: boolean;
    generateTags?: boolean;
    confidenceThreshold?: number;
  } = {}): Promise<DocumentClassificationResult> {
    try {
      const {
        enableSubclassification = true,
        extractMetadata = true,
        generateTags = true,
        confidenceThreshold = 0.7
      } = options;

      // Simulate document analysis
      const analysis = await this.analyzeDocument(imageUri);
      
      // Classify document type
      const classification = this.performClassification(analysis);
      
      // Extract features
      const features = this.extractFeatures(analysis);
      
      // Extract metadata if enabled
      const metadata = extractMetadata ? this.extractMetadata(analysis) : {
        language: 'en',
        dateDetected: false,
        amountDetected: false,
        companyDetected: false,
        personalInfoDetected: false
      };

      // Generate tags if enabled
      const tags = generateTags ? this.generateTags(classification, features, metadata) : [];

      // Generate suggestions
      const suggestions = this.generateSuggestions(classification, features, metadata);

      // Check confidence threshold
      if (classification.confidence < confidenceThreshold) {
        return {
          documentType: 'unknown',
          confidence: classification.confidence,
          features,
          metadata,
          tags: ['unclassified'],
          suggestions: ['Document type could not be determined with high confidence. Please try again with better image quality.']
        };
      }

      return {
        documentType: classification.documentType,
        confidence: classification.confidence,
        subcategory: enableSubclassification ? classification.subcategory : undefined,
        features,
        metadata,
        tags,
        suggestions
      };

    } catch (error) {
      console.error('Document classification failed:', error);
      return {
        documentType: 'unknown',
        confidence: 0,
        features: {
          hasText: false,
          hasLogo: false,
          hasSignature: false,
          hasTable: false,
          hasBarcode: false,
          hasPhoto: false,
          textDensity: 0,
          colorComplexity: 0,
          layoutType: 'mixed'
        },
        metadata: {
          language: 'en',
          dateDetected: false,
          amountDetected: false,
          companyDetected: false,
          personalInfoDetected: false
        },
        tags: ['error'],
        suggestions: ['Classification failed. Please try again.']
      };
    }
  }

  private async analyzeDocument(imageUri: string): Promise<any> {
    // Simulate document analysis
    return {
      textRegions: Math.floor(Math.random() * 20) + 5,
      logoRegions: Math.floor(Math.random() * 3),
      signatureRegions: Math.floor(Math.random() * 2),
      tableRegions: Math.floor(Math.random() * 5),
      barcodeRegions: Math.floor(Math.random() * 2),
      photoRegions: Math.floor(Math.random() * 3),
      textDensity: Math.random(),
      colorComplexity: Math.random(),
      layoutComplexity: Math.random(),
      aspectRatio: 0.7 + Math.random() * 0.6, // 0.7 to 1.3
      size: Math.random() * 1000000 + 100000, // 100KB to 1.1MB
      dominantColors: this.generateDominantColors(),
      textContent: this.simulateTextExtraction(),
      structuralElements: this.simulateStructuralElements()
    };
  }

  private generateDominantColors(): string[] {
    const colors = ['#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
    const numColors = Math.floor(Math.random() * 4) + 2; // 2-5 colors
    return colors.slice(0, numColors);
  }

  private simulateTextExtraction(): string {
    const textSamples = [
      'INVOICE #12345\nDate: 2024-01-15\nAmount: $99.99\nThank you for your business!',
      'John Smith\nSoftware Engineer\njohn@company.com\n+1 (555) 123-4567',
      'CONTRACT AGREEMENT\nThis agreement is made between...\nSignature: _____________',
      'RECEIPT\nStore: ABC Market\nDate: 01/15/2024\nTotal: $25.67\nThank you!',
      'CERTIFICATE OF COMPLETION\nThis certifies that...\nAwarded on: January 15, 2024'
    ];
    return textSamples[Math.floor(Math.random() * textSamples.length)];
  }

  private simulateStructuralElements(): string[] {
    const elements = ['header', 'footer', 'logo', 'signature', 'table', 'barcode', 'photo', 'watermark'];
    const numElements = Math.floor(Math.random() * 4) + 2;
    return elements.slice(0, numElements);
  }

  private performClassification(analysis: any): { documentType: string; subcategory?: string; confidence: number } {
    // Simulate classification based on analysis
    const documentTypes = [
      { type: 'receipt', subcategory: 'retail_receipt', confidence: 0.92 },
      { type: 'business_card', subcategory: 'professional_card', confidence: 0.95 },
      { type: 'contract', subcategory: 'legal_agreement', confidence: 0.88 },
      { type: 'id_card', subcategory: 'driver_license', confidence: 0.94 },
      { type: 'letter', subcategory: 'formal_letter', confidence: 0.87 },
      { type: 'certificate', subcategory: 'achievement_certificate', confidence: 0.91 }
    ];

    // Weight the selection based on analysis features
    let selectedType = documentTypes[Math.floor(Math.random() * documentTypes.length)];
    
    // Adjust confidence based on analysis quality
    const qualityFactor = analysis.textDensity * 0.3 + analysis.colorComplexity * 0.2 + 0.5;
    selectedType.confidence = Math.min(0.99, selectedType.confidence * qualityFactor);

    return selectedType;
  }

  private extractFeatures(analysis: any) {
    return {
      hasText: analysis.textRegions > 0,
      hasLogo: analysis.logoRegions > 0,
      hasSignature: analysis.signatureRegions > 0,
      hasTable: analysis.tableRegions > 0,
      hasBarcode: analysis.barcodeRegions > 0,
      hasPhoto: analysis.photoRegions > 0,
      textDensity: analysis.textDensity,
      colorComplexity: analysis.colorComplexity,
      layoutType: this.determineLayoutType(analysis)
    };
  }

  private determineLayoutType(analysis: any): 'formal' | 'informal' | 'structured' | 'mixed' {
    if (analysis.tableRegions > 3) return 'structured';
    if (analysis.layoutComplexity > 0.7) return 'mixed';
    if (analysis.textDensity > 0.8) return 'formal';
    return 'informal';
  }

  private extractMetadata(analysis: any) {
    const text = analysis.textContent.toLowerCase();
    
    return {
      language: this.detectLanguage(text),
      dateDetected: this.detectDate(text),
      amountDetected: this.detectAmount(text),
      companyDetected: this.detectCompany(text),
      personalInfoDetected: this.detectPersonalInfo(text)
    };
  }

  private detectLanguage(text: string): string {
    // Simple language detection based on common words
    const englishWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const spanishWords = ['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se', 'no', 'te'];
    const frenchWords = ['le', 'la', 'de', 'et', 'à', 'un', 'il', 'que', 'ne', 'se', 'ce', 'pas'];
    
    const englishCount = englishWords.filter(word => text.includes(word)).length;
    const spanishCount = spanishWords.filter(word => text.includes(word)).length;
    const frenchCount = frenchWords.filter(word => text.includes(word)).length;
    
    if (spanishCount > englishCount && spanishCount > frenchCount) return 'es';
    if (frenchCount > englishCount && frenchCount > spanishCount) return 'fr';
    return 'en';
  }

  private detectDate(text: string): boolean {
    const datePatterns = [
      /\d{1,2}\/\d{1,2}\/\d{4}/, // MM/DD/YYYY
      /\d{4}-\d{1,2}-\d{1,2}/,   // YYYY-MM-DD
      /\d{1,2}-\d{1,2}-\d{4}/,   // MM-DD-YYYY
      /january|february|march|april|may|june|july|august|september|october|november|december/i
    ];
    
    return datePatterns.some(pattern => pattern.test(text));
  }

  private detectAmount(text: string): boolean {
    const amountPatterns = [
      /\$\d+\.?\d*/,
      /€\d+\.?\d*/,
      /£\d+\.?\d*/,
      /total\s*:?\s*\$?\d+\.?\d*/i,
      /amount\s*:?\s*\$?\d+\.?\d*/i
    ];
    
    return amountPatterns.some(pattern => pattern.test(text));
  }

  private detectCompany(text: string): boolean {
    const companyKeywords = [
      'inc', 'corp', 'llc', 'ltd', 'company', 'corporation', 'enterprises',
      'solutions', 'services', 'group', 'associates', 'partners'
    ];
    
    return companyKeywords.some(keyword => text.includes(keyword));
  }

  private detectPersonalInfo(text: string): boolean {
    const personalPatterns = [
      /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/, // Name pattern
      /\b\d{3}-\d{2}-\d{4}\b/,         // SSN pattern
      /\b\d{3}-\d{3}-\d{4}\b/,         // Phone pattern
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/ // Email pattern
    ];
    
    return personalPatterns.some(pattern => pattern.test(text));
  }

  private generateTags(classification: any, features: any, metadata: any): string[] {
    const tags: string[] = [];
    
    // Document type tags
    tags.push(classification.documentType);
    if (classification.subcategory) {
      tags.push(classification.subcategory);
    }
    
    // Feature-based tags
    if (features.hasLogo) tags.push('has-logo');
    if (features.hasSignature) tags.push('signed');
    if (features.hasTable) tags.push('tabular');
    if (features.hasBarcode) tags.push('barcode');
    if (features.hasPhoto) tags.push('photo');
    
    // Metadata-based tags
    if (metadata.dateDetected) tags.push('dated');
    if (metadata.amountDetected) tags.push('financial');
    if (metadata.companyDetected) tags.push('business');
    if (metadata.personalInfoDetected) tags.push('personal');
    
    // Layout tags
    tags.push(features.layoutType);
    
    // Quality tags
    if (features.textDensity > 0.8) tags.push('text-heavy');
    if (features.colorComplexity > 0.7) tags.push('colorful');
    
    return [...new Set(tags)]; // Remove duplicates
  }

  private generateSuggestions(classification: any, features: any, metadata: any): string[] {
    const suggestions: string[] = [];
    
    if (classification.confidence < 0.8) {
      suggestions.push('Document type detected with moderate confidence. Consider manual verification.');
    }
    
    if (features.textDensity < 0.3) {
      suggestions.push('Document appears to have minimal text. Ensure all text is clearly visible.');
    }
    
    if (features.colorComplexity > 0.8) {
      suggestions.push('Document has complex colors. Consider converting to grayscale for better text recognition.');
    }
    
    if (metadata.personalInfoDetected) {
      suggestions.push('Document contains personal information. Ensure secure storage and handling.');
    }
    
    if (features.hasSignature) {
      suggestions.push('Document contains signatures. Consider legal implications of digital storage.');
    }
    
    return suggestions;
  }

  async batchClassify(images: string[], options: any = {}): Promise<DocumentClassificationResult[]> {
    const results: DocumentClassificationResult[] = [];
    
    for (const imageUri of images) {
      try {
        const result = await this.classifyDocument(imageUri, options);
        results.push(result);
      } catch (error) {
        console.error(`Failed to classify image: ${imageUri}`, error);
        results.push({
          documentType: 'unknown',
          confidence: 0,
          features: {
            hasText: false,
            hasLogo: false,
            hasSignature: false,
            hasTable: false,
            hasBarcode: false,
            hasPhoto: false,
            textDensity: 0,
            colorComplexity: 0,
            layoutType: 'mixed'
          },
          metadata: {
            language: 'en',
            dateDetected: false,
            amountDetected: false,
            companyDetected: false,
            personalInfoDetected: false
          },
          tags: ['error'],
          suggestions: ['Classification failed']
        });
      }
    }
    
    return results;
  }

  getSupportedDocumentTypes(): string[] {
    return Array.from(this.models.keys());
  }

  getModelInfo(documentType: string): ClassificationModel | null {
    return this.models.get(documentType) || null;
  }

  isModelReady(): boolean {
    return this.isInitialized;
  }
}
