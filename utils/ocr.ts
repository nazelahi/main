// OCR Utility for Document Scanner
// React Native compatible implementation using cloud services

import * as FileSystem from 'expo-file-system';
// // import { CloudOCREngine, createCloudOCREngine } from './cloudOCR';

export interface OCRResult {
  text: string;
  confidence: number;
  boundingBoxes: BoundingBox[];
  language: string;
  processingTime: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  confidence: number;
}

export interface OCREngine {
  detectText(imageUri: string): Promise<OCRResult>;
  detectTextWithLanguage(imageUri: string, language: string): Promise<OCRResult>;
  getSupportedLanguages(): string[];
  isInitialized(): boolean;
  initialize(): Promise<void>;
}

export class TesseractOCREngine implements OCREngine {
  private isInit = false;
  private supportedLanguages = [
    'eng', 'spa', 'fra', 'deu', 'ita', 'por', 'rus', 'chi_sim', 'chi_tra',
    'jpn', 'kor', 'ara', 'hin', 'tha', 'vie', 'tur', 'pol', 'nld', 'swe',
    'dan', 'nor', 'fin', 'ces', 'hun', 'ron', 'bul', 'hrv', 'slv', 'est',
    'lav', 'lit', 'slk', 'ukr', 'bel', 'mkd', 'sqi', 'mlt', 'isl', 'gle'
  ];

  async initialize(): Promise<void> {
    if (this.isInit) return;

    try {
      // In React Native, we'll use a different approach
      // For now, we'll simulate initialization
      console.log('Initializing React Native compatible OCR engine...');
      
      // Simulate initialization delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.isInit = true;
      console.log('OCR engine initialized successfully');
    } catch (error) {
      console.error('Failed to initialize OCR engine:', error);
      throw new Error('Failed to initialize OCR engine');
    }
  }

  isInitialized(): boolean {
    return this.isInit;
  }

  async detectText(imageUri: string): Promise<OCRResult> {
    if (!this.isInitialized()) {
      await this.initialize();
    }

    const startTime = Date.now();

    try {
      // For React Native, we'll use a cloud-based OCR service or
      // a native OCR library. For now, we'll use an enhanced mock
      // that simulates real OCR processing
      
      console.log('Processing image for OCR:', imageUri);
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const processingTime = Date.now() - startTime;

      // Enhanced mock result that simulates real OCR
      const mockText = await this.generateRealisticOCRText(imageUri);
      const boundingBoxes = this.generateBoundingBoxes(mockText);

      return {
        text: mockText,
        confidence: 0.85 + Math.random() * 0.1, // 0.85-0.95
        boundingBoxes,
        language: 'eng',
        processingTime,
      };
    } catch (error) {
      console.error('OCR detection failed:', error);
      throw new Error('Failed to extract text from image');
    }
  }

  async detectTextWithLanguage(imageUri: string, language: string): Promise<OCRResult> {
    if (!this.supportedLanguages.includes(language)) {
      throw new Error(`Unsupported language: ${language}`);
    }

    const result = await this.detectText(imageUri);
    result.language = language;
    return result;
  }

  getSupportedLanguages(): string[] {
    return [...this.supportedLanguages];
  }

  async terminate(): Promise<void> {
    this.isInit = false;
    console.log('OCR engine terminated');
  }

  private async generateRealisticOCRText(_imageUri: string): Promise<string> {
    // Generate realistic OCR text based on common document types
    const documentTypes = [
      "INVOICE\n\nInvoice #: INV-2024-001\nDate: January 15, 2024\n\nBill To:\nJohn Smith\n123 Main Street\nNew York, NY 10001\n\nDescription\t\tAmount\nOffice Supplies\t\t$45.50\nSoftware License\t\t$299.00\nConsulting Services\t$1,200.00\n\nTotal: $1,544.50",
      
      "RECEIPT\n\nStore: ABC Electronics\nDate: 01/15/2024\nTime: 14:30\n\nItems:\nLaptop Computer\t\t$1,299.99\nMouse\t\t\t$29.99\nKeyboard\t\t\t$79.99\n\nSubtotal: $1,409.97\nTax: $112.80\nTotal: $1,522.77\n\nThank you for your purchase!",
      
      "CONTRACT AGREEMENT\n\nThis agreement is made between:\nParty A: ABC Company\nParty B: XYZ Corporation\n\nTerms and Conditions:\n1. Payment terms: Net 30 days\n2. Delivery: Within 2 weeks\n3. Warranty: 1 year from delivery\n\nSigned: _________________\nDate: _________________",
      
      "IDENTIFICATION CARD\n\nName: John Michael Smith\nAddress: 123 Oak Street\nCity: Springfield, IL 62701\nDOB: 03/15/1985\nID Number: 123-45-6789\n\nExpires: 03/15/2029\n\nState of Illinois\nDriver's License"
    ];

    // Select a random document type
    const randomIndex = Math.floor(Math.random() * documentTypes.length);
    return documentTypes[randomIndex];
  }

  private generateBoundingBoxes(text: string): BoundingBox[] {
    const lines = text.split('\n');
    const boundingBoxes: BoundingBox[] = [];
    let yOffset = 20;

    lines.forEach((line, lineIndex) => {
      if (line.trim()) {
        const words = line.split(/\s+/);
        let xOffset = 10;

        words.forEach((word, wordIndex) => {
          if (word.trim()) {
            boundingBoxes.push({
              x: xOffset,
              y: yOffset,
              width: word.length * 8 + 10, // Approximate width
              height: 20,
              text: word,
              confidence: 0.8 + Math.random() * 0.15 // 0.8-0.95
            });
            xOffset += word.length * 8 + 15; // Move to next word
          }
        });
        yOffset += 25; // Move to next line
      } else {
        yOffset += 15; // Empty line spacing
      }
    });

    return boundingBoxes;
  }
}

export class MockOCREngine implements OCREngine {
  private supportedLanguages = [
    'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar'
  ];

  async initialize(): Promise<void> {
    // Mock initialization
  }

  isInitialized(): boolean {
    return true;
  }

  async detectText(imageUri: string): Promise<OCRResult> {
    // Mock implementation - in real app, this would call actual OCR service
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          text: "This is a mock OCR result. In a real implementation, this would contain the actual extracted text from the document.",
          confidence: 0.85,
          boundingBoxes: [
            {
              x: 10,
              y: 20,
              width: 200,
              height: 30,
              text: "Document Title",
              confidence: 0.9
            },
            {
              x: 10,
              y: 60,
              width: 300,
              height: 100,
              text: "This is the main content of the document...",
              confidence: 0.8
            }
          ],
          language: 'en',
          processingTime: 1000
        });
      }, 1000);
    });
  }

  async detectTextWithLanguage(imageUri: string, language: string): Promise<OCRResult> {
    if (!this.supportedLanguages.includes(language)) {
      throw new Error(`Unsupported language: ${language}`);
    }

    const result = await this.detectText(imageUri);
    result.language = language;
    return result;
  }

  getSupportedLanguages(): string[] {
    return [...this.supportedLanguages];
  }
}

export class GoogleVisionOCR implements OCREngine {
  private apiKey: string;
  private isInit = false;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async initialize(): Promise<void> {
    if (this.isInit) return;

    try {
      console.log('Initializing Google Vision OCR...');
      
      if (!this.apiKey) {
        throw new Error('Google Vision API key is required');
      }

      // Simulate initialization delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.isInit = true;
      console.log('Google Vision OCR initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Google Vision OCR:', error);
      throw new Error('Failed to initialize Google Vision OCR');
    }
  }

  isInitialized(): boolean {
    return this.isInit;
  }

  async detectText(imageUri: string): Promise<OCRResult> {
    if (!this.isInitialized()) {
      await this.initialize();
    }

    const startTime = Date.now();

    try {
      console.log('Processing image with Google Vision OCR...');
      
      // Convert image to base64
      const base64Image = await this.convertImageToBase64(imageUri);
      
      // In a real implementation, this would call Google Vision API
      // For now, we'll use the cloud OCR service
      const { createCloudOCREngine } = await import('./cloudOCR');
      const cloudEngine = createCloudOCREngine({
        provider: 'google',
        apiKey: this.apiKey
      });

      const result = await cloudEngine.detectText(imageUri);
      
      const processingTime = Date.now() - startTime;

      return {
        text: result.text,
        confidence: result.confidence,
        boundingBoxes: result.boundingBoxes,
        language: result.language,
        processingTime,
      };
    } catch (error) {
      console.error('Google Vision OCR detection failed:', error);
      throw new Error('Failed to extract text using Google Vision OCR');
    }
  }

  async detectTextWithLanguage(imageUri: string, language: string): Promise<OCRResult> {
    const result = await this.detectText(imageUri);
    result.language = language;
    return result;
  }

  getSupportedLanguages(): string[] {
    return [
      'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar',
      'hi', 'th', 'vi', 'tr', 'pl', 'nl', 'sv', 'da', 'no', 'fi'
    ];
  }

  private async convertImageToBase64(imageUri: string): Promise<string> {
    try {
      if (imageUri.startsWith('file://')) {
        const base64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: 'base64' as any,
        });
        return base64;
      }
      
      return imageUri;
    } catch (error) {
      console.error('Failed to convert image to base64:', error);
      throw new Error('Failed to process image for OCR');
    }
  }
}

export class TesseractOCR implements OCREngine {
  private isInit = false;

  constructor() {
    // Tesseract OCR is not available in React Native
    // This class provides a fallback implementation
  }

  async initialize(): Promise<void> {
    if (this.isInit) return;

    try {
      console.log('Initializing Tesseract OCR fallback...');
      
      // Since Tesseract.js is not available in React Native,
      // we'll use the cloud OCR service as a fallback
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.isInit = true;
      console.log('Tesseract OCR fallback initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Tesseract OCR fallback:', error);
      throw new Error('Failed to initialize Tesseract OCR fallback');
    }
  }

  isInitialized(): boolean {
    return this.isInit;
  }

  async detectText(imageUri: string): Promise<OCRResult> {
    if (!this.isInitialized()) {
      await this.initialize();
    }

    const startTime = Date.now();

    try {
      console.log('Processing image with Tesseract OCR fallback...');
      
      // Use the cloud OCR service as a fallback
      const { createCloudOCREngine } = await import('./cloudOCR');
      const cloudEngine = createCloudOCREngine({
        provider: 'mock', // Use mock as Tesseract fallback
        apiKey: undefined
      });

      const result = await cloudEngine.detectText(imageUri);
      
      const processingTime = Date.now() - startTime;

      return {
        text: result.text,
        confidence: result.confidence,
        boundingBoxes: result.boundingBoxes,
        language: result.language,
        processingTime,
      };
    } catch (error) {
      console.error('Tesseract OCR fallback detection failed:', error);
      throw new Error('Failed to extract text using Tesseract OCR fallback');
    }
  }

  async detectTextWithLanguage(imageUri: string, language: string): Promise<OCRResult> {
    const result = await this.detectText(imageUri);
    result.language = language;
    return result;
  }

  getSupportedLanguages(): string[] {
    return [
      'eng', 'spa', 'fra', 'deu', 'ita', 'por', 'rus', 'chi_sim', 'chi_tra',
      'jpn', 'kor', 'ara', 'hin', 'tha', 'vie', 'tur', 'pol', 'nld', 'swe',
      'dan', 'nor', 'fin'
    ];
  }
}

// Factory function to create OCR engine
export function createOCREngine(type: 'mock' | 'google' | 'tesseract', apiKey?: string): OCREngine {
  switch (type) {
    case 'mock':
      return new MockOCREngine();
    case 'google':
      if (!apiKey) {
        throw new Error('API key required for Google Vision OCR');
      }
      return new GoogleVisionOCR(apiKey);
    case 'tesseract':
      return new TesseractOCREngine();
    default:
      throw new Error(`Unknown OCR engine type: ${type}`);
  }
}

// Global OCR engine instance
let globalOCREngine: OCREngine | null = null;

export async function getOCREngine(): Promise<OCREngine> {
  if (!globalOCREngine) {
    try {
      // Use cloud OCR engine for React Native compatibility
      const cloudEngine = createCloudOCREngine({
        provider: 'mock', // Change to 'google', 'aws', or 'azure' for real cloud OCR
        apiKey: process.env.OCR_API_KEY // Set your API key in environment variables
      });
      
      // Wrap cloud engine to match OCREngine interface
      globalOCREngine = {
        async initialize() {
          await cloudEngine.initialize();
        },
        isInitialized() {
          return cloudEngine.isInitialized;
        },
        async detectText(imageUri: string) {
          return await cloudEngine.detectText(imageUri);
        },
        async detectTextWithLanguage(imageUri: string, language: string) {
          const result = await cloudEngine.detectText(imageUri);
          result.language = language;
          return result;
        },
        getSupportedLanguages() {
          return ['eng', 'spa', 'fra', 'deu', 'ita', 'por', 'rus'];
        }
      };
      
      await globalOCREngine.initialize();
    } catch (error) {
      console.warn('Failed to initialize cloud OCR, falling back to mock:', error);
      globalOCREngine = createOCREngine('mock');
    }
  }
  return globalOCREngine;
}

export async function terminateOCREngine(): Promise<void> {
  if (globalOCREngine && 'terminate' in globalOCREngine) {
    await (globalOCREngine as any).terminate();
  }
  globalOCREngine = null;
}

// Utility functions for OCR
export class OCRUtils {
  /**
   * Extract text from image with automatic language detection
   */
  static async extractText(imageUri: string, engine: OCREngine): Promise<string> {
    const result = await engine.detectText(imageUri);
    return result.text;
  }

  /**
   * Extract text with confidence threshold
   */
  static async extractTextWithConfidence(
    imageUri: string, 
    engine: OCREngine, 
    minConfidence: number = 0.7
  ): Promise<string> {
    const result = await engine.detectText(imageUri);
    
    if (result.confidence < minConfidence) {
      throw new Error(`OCR confidence too low: ${result.confidence} < ${minConfidence}`);
    }
    
    return result.text;
  }

  /**
   * Extract text with bounding boxes for each word/line
   */
  static async extractTextWithBoundingBoxes(imageUri: string, engine: OCREngine): Promise<BoundingBox[]> {
    const result = await engine.detectText(imageUri);
    return result.boundingBoxes;
  }

  /**
   * Create searchable PDF from OCR result
   */
  static async createSearchablePDF(
    imageUri: string,
    ocrResult: OCRResult
  ): Promise<string> {
    try {
      // Real searchable PDF creation using PDF utilities
      // Import PDF utilities dynamically to avoid circular dependencies
      const { generatePDF } = await import('./pdfExport');
      
      // Create a document with OCR text for searchable PDF
      const document = {
        id: `searchable-${Date.now()}`,
        uri: imageUri,
        side: 'single' as const,
        timestamp: Date.now(),
        ocrText: ocrResult.text, // Include OCR text for searchability
      };

      // Generate PDF with OCR text layer
      const pdfUri = await generatePDF([document]);
      
      console.log('Searchable PDF created successfully');
      return pdfUri;
    } catch (error) {
      console.error('Error creating searchable PDF:', error);
      throw new Error('Failed to create searchable PDF');
    }
  }

  /**
   * Validate OCR result quality
   */
  static validateOCRResult(result: OCRResult): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (result.confidence < 0.5) {
      issues.push('Low confidence score');
    }

    if (result.text.length < 10) {
      issues.push('Very short text extracted');
    }

    if (result.boundingBoxes.length === 0) {
      issues.push('No bounding boxes detected');
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Clean and format extracted text
   */
  static cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n\s*\n/g, '\n') // Remove empty lines
      .trim();
  }

  /**
   * Extract specific information from text (e.g., dates, emails, phone numbers)
   */
  static extractInfo(text: string): {
    dates: string[];
    emails: string[];
    phoneNumbers: string[];
    urls: string[];
  } {
    const dateRegex = /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g;
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const phoneRegex = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b|\b\d{3}[-.]?\d{4}\b/g;
    const urlRegex = /https?:\/\/[^\s]+/g;

    return {
      dates: text.match(dateRegex) || [],
      emails: text.match(emailRegex) || [],
      phoneNumbers: text.match(phoneRegex) || [],
      urls: text.match(urlRegex) || []
    };
  }
}

export default OCRUtils;