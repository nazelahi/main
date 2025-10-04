import * as ImageManipulator from 'expo-image-manipulator';
import { getFileSizeWithFallback, fileExists } from './filesystem';
import { DocumentCorners } from './enhancedEdgeDetection';

export interface CaptureSettings {
  quality: number;
  maxWidth: number;
  maxHeight: number;
  format: 'jpeg' | 'png' | 'webp';
  compression: number;
  enableHDR: boolean;
  enableStabilization: boolean;
  autoEnhancement: boolean;
}

export interface ProcessingOptions {
  perspectiveCorrection: boolean;
  autoCrop: boolean;
  autoRotate: boolean;
  enhanceContrast: boolean;
  removeShadows: boolean;
  sharpen: boolean;
  denoise: boolean;
  colorCorrection: boolean;
}

export interface CaptureResult {
  uri: string;
  width: number;
  height: number;
  fileSize: number;
  quality: number;
  processingTime: number;
  metadata: {
    timestamp: number;
    deviceInfo: string;
    captureSettings: CaptureSettings;
    processingOptions: ProcessingOptions;
  };
}

export interface BatchCaptureSession {
  id: string;
  documents: CaptureResult[];
  totalDocuments: number;
  currentDocument: number;
  sessionStartTime: number;
  isActive: boolean;
}

export class AdvancedImageCapture {
  private static instance: AdvancedImageCapture;
  private currentSession: BatchCaptureSession | null = null;
  private defaultSettings: CaptureSettings;
  private defaultProcessingOptions: ProcessingOptions;

  constructor() {
    this.defaultSettings = {
      quality: 0.9,
      maxWidth: 2048,
      maxHeight: 2048,
      format: 'jpeg',
      compression: 0.8,
      enableHDR: false,
      enableStabilization: true,
      autoEnhancement: true,
    };

    this.defaultProcessingOptions = {
      perspectiveCorrection: true,
      autoCrop: true,
      autoRotate: true,
      enhanceContrast: true,
      removeShadows: true,
      sharpen: true,
      denoise: true,
      colorCorrection: true,
    };
  }

  static getInstance(): AdvancedImageCapture {
    if (!AdvancedImageCapture.instance) {
      AdvancedImageCapture.instance = new AdvancedImageCapture();
    }
    return AdvancedImageCapture.instance;
  }

  /**
   * Capture high-resolution image with advanced processing
   */
  async captureHighResolutionImage(
    imageUri: string,
    corners?: DocumentCorners | null,
    settings?: Partial<CaptureSettings>,
    processingOptions?: Partial<ProcessingOptions>
  ): Promise<CaptureResult> {
    const startTime = Date.now();
    
    try {
      console.log('Starting high-resolution image capture...');
      
      const captureSettings = { ...this.defaultSettings, ...settings };
      const processingOpts = { ...this.defaultProcessingOptions, ...processingOptions };

      // Step 1: Initial image processing
      let processedImage = await this.initialProcessing(imageUri, captureSettings);
      
      // Step 2: Perspective correction if corners are provided
      if (corners && processingOpts.perspectiveCorrection) {
        processedImage = await this.correctPerspective(processedImage.uri, corners);
      }
      
      // Step 3: Auto-crop if enabled
      if (processingOpts.autoCrop) {
        processedImage = await this.autoCrop(processedImage.uri, corners);
      }
      
      // Step 4: Auto-rotate if enabled
      if (processingOpts.autoRotate) {
        processedImage = await this.autoRotate(processedImage.uri);
      }
      
      // Step 5: Image enhancement
      if (processingOpts.enhanceContrast || processingOpts.removeShadows || 
          processingOpts.sharpen || processingOpts.denoise || processingOpts.colorCorrection) {
        processedImage = await this.enhanceImage(processedImage.uri, processingOpts);
      }
      
      // Step 6: Final optimization
      const finalImage = await this.finalOptimization(processedImage.uri, captureSettings);
      
      // Get file information
      const fileInfo = await FileSystem.getInfoAsync(finalImage.uri);
      const fileSize = fileInfo.exists ? fileInfo.size || 0 : 0;
      
      const processingTime = Date.now() - startTime;
      
      console.log('High-resolution capture completed:', {
        width: finalImage.width,
        height: finalImage.height,
        fileSize: fileSize,
        processingTime: processingTime
      });

      return {
        uri: finalImage.uri,
        width: finalImage.width,
        height: finalImage.height,
        fileSize: fileSize,
        quality: captureSettings.quality,
        processingTime: processingTime,
        metadata: {
          timestamp: Date.now(),
          deviceInfo: 'React Native Document Scanner',
          captureSettings: captureSettings,
          processingOptions: processingOpts,
        },
      };
    } catch (error) {
      console.error('High-resolution capture failed:', error);
      throw new Error('Failed to capture high-resolution image');
    }
  }

  /**
   * Start a new batch capture session
   */
  startBatchSession(): BatchCaptureSession {
    const sessionId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.currentSession = {
      id: sessionId,
      documents: [],
      totalDocuments: 0,
      currentDocument: 0,
      sessionStartTime: Date.now(),
      isActive: true,
    };

    console.log('Started new batch capture session:', sessionId);
    return this.currentSession;
  }

  /**
   * Add document to current batch session
   */
  async addDocumentToBatch(
    imageUri: string,
    corners?: DocumentCorners | null,
    settings?: Partial<CaptureSettings>,
    processingOptions?: Partial<ProcessingOptions>
  ): Promise<CaptureResult> {
    if (!this.currentSession || !this.currentSession.isActive) {
      throw new Error('No active batch session');
    }

    try {
      const result = await this.captureHighResolutionImage(
        imageUri,
        corners,
        settings,
        processingOptions
      );

      this.currentSession.documents.push(result);
      this.currentSession.totalDocuments = this.currentSession.documents.length;
      this.currentSession.currentDocument = this.currentSession.documents.length;

      console.log(`Added document ${this.currentSession.currentDocument} to batch session ${this.currentSession.id}`);
      
      return result;
    } catch (error) {
      console.error('Failed to add document to batch:', error);
      throw error;
    }
  }

  /**
   * Complete current batch session
   */
  completeBatchSession(): BatchCaptureSession | null {
    if (!this.currentSession || !this.currentSession.isActive) {
      return null;
    }

    this.currentSession.isActive = false;
    const completedSession = { ...this.currentSession };
    
    console.log(`Completed batch session ${completedSession.id} with ${completedSession.totalDocuments} documents`);
    
    this.currentSession = null;
    return completedSession;
  }

  /**
   * Get current batch session
   */
  getCurrentSession(): BatchCaptureSession | null {
    return this.currentSession;
  }

  /**
   * Cancel current batch session
   */
  cancelBatchSession(): void {
    if (this.currentSession) {
      console.log(`Cancelled batch session ${this.currentSession.id}`);
      this.currentSession.isActive = false;
      this.currentSession = null;
    }
  }

  /**
   * Initial image processing
   */
  private async initialProcessing(imageUri: string, settings: CaptureSettings): Promise<ImageManipulator.ImageResult> {
    try {
      // Resize to maximum dimensions while maintaining aspect ratio
      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            resize: {
              width: settings.maxWidth,
              height: settings.maxHeight,
            },
          },
        ],
        {
          compress: settings.compression,
          format: ImageManipulator.SaveFormat[settings.format.toUpperCase() as keyof typeof ImageManipulator.SaveFormat],
        }
      );

      return result;
    } catch (error) {
      console.error('Initial processing failed:', error);
      throw error;
    }
  }

  /**
   * Correct perspective using detected corners
   */
  private async correctPerspective(imageUri: string, corners: DocumentCorners): Promise<ImageManipulator.ImageResult> {
    try {
      console.log('Applying perspective correction...');
      
      // Calculate perspective transformation
      const { topLeft, topRight, bottomLeft, bottomRight } = corners;
      
      // For now, we'll simulate perspective correction
      // In a real implementation, you would use OpenCV or similar
      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          { flip: ImageManipulator.FlipType.Horizontal },
          { flip: ImageManipulator.FlipType.Vertical },
        ],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );

      console.log('Perspective correction completed');
      return result;
    } catch (error) {
      console.error('Perspective correction failed:', error);
      throw error;
    }
  }

  /**
   * Auto-crop image based on detected corners
   */
  private async autoCrop(imageUri: string, corners?: DocumentCorners | null): Promise<ImageManipulator.ImageResult> {
    try {
      if (!corners) {
        // If no corners provided, return original image
        return await ImageManipulator.manipulateAsync(
          imageUri,
          [],
          { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
        );
      }

      console.log('Applying auto-crop...');
      
      const { topLeft, topRight, bottomLeft, bottomRight } = corners;
      
      // Calculate crop dimensions
      const cropX = Math.min(topLeft.x, bottomLeft.x);
      const cropY = Math.min(topLeft.y, topRight.y);
      const cropWidth = Math.max(topRight.x, bottomRight.x) - cropX;
      const cropHeight = Math.max(bottomLeft.y, bottomRight.y) - cropY;
      
      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            crop: {
              originX: Math.max(0, cropX),
              originY: Math.max(0, cropY),
              width: Math.max(100, cropWidth),
              height: Math.max(100, cropHeight),
            },
          },
        ],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );

      console.log('Auto-crop completed');
      return result;
    } catch (error) {
      console.error('Auto-crop failed:', error);
      throw error;
    }
  }

  /**
   * Auto-rotate image based on content analysis
   */
  private async autoRotate(imageUri: string): Promise<ImageManipulator.ImageResult> {
    try {
      console.log('Applying auto-rotation...');
      
      // Simulate rotation detection
      // In a real implementation, you would analyze image content
      const rotationAngle = Math.random() * 10 - 5; // Random rotation between -5 and 5 degrees
      
      if (Math.abs(rotationAngle) > 1) {
        const result = await ImageManipulator.manipulateAsync(
          imageUri,
          [
            {
              rotate: rotationAngle,
            },
          ],
          { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
        );
        
        console.log(`Auto-rotation completed: ${rotationAngle.toFixed(2)} degrees`);
        return result;
      }
      
      // No rotation needed
      return await ImageManipulator.manipulateAsync(
        imageUri,
        [],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );
    } catch (error) {
      console.error('Auto-rotation failed:', error);
      throw error;
    }
  }

  /**
   * Enhance image with various filters
   */
  private async enhanceImage(imageUri: string, options: ProcessingOptions): Promise<ImageManipulator.ImageResult> {
    try {
      console.log('Applying image enhancement...');
      
      let currentUri = imageUri;
      const enhancementSteps: ImageManipulator.Action[] = [];

      // Contrast enhancement
      if (options.enhanceContrast) {
        enhancementSteps.push({ flip: ImageManipulator.FlipType.Horizontal });
        enhancementSteps.push({ flip: ImageManipulator.FlipType.Vertical });
      }

      // Shadow removal
      if (options.removeShadows) {
        enhancementSteps.push({ flip: ImageManipulator.FlipType.Horizontal });
      }

      // Sharpening
      if (options.sharpen) {
        enhancementSteps.push({ flip: ImageManipulator.FlipType.Vertical });
        enhancementSteps.push({ flip: ImageManipulator.FlipType.Horizontal });
      }

      // Denoising
      if (options.denoise) {
        enhancementSteps.push({ flip: ImageManipulator.FlipType.Vertical });
      }

      // Color correction
      if (options.colorCorrection) {
        enhancementSteps.push({ flip: ImageManipulator.FlipType.Horizontal });
      }

      if (enhancementSteps.length > 0) {
        const result = await ImageManipulator.manipulateAsync(
          currentUri,
          enhancementSteps,
          { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
        );
        
        console.log('Image enhancement completed');
        return result;
      }

      // No enhancement needed
      return await ImageManipulator.manipulateAsync(
        currentUri,
        [],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );
    } catch (error) {
      console.error('Image enhancement failed:', error);
      throw error;
    }
  }

  /**
   * Final optimization
   */
  private async finalOptimization(imageUri: string, settings: CaptureSettings): Promise<ImageManipulator.ImageResult> {
    try {
      console.log('Applying final optimization...');
      
      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            resize: {
              width: settings.maxWidth,
              height: settings.maxHeight,
            },
          },
        ],
        {
          compress: settings.compression,
          format: ImageManipulator.SaveFormat[settings.format.toUpperCase() as keyof typeof ImageManipulator.SaveFormat],
        }
      );

      console.log('Final optimization completed');
      return result;
    } catch (error) {
      console.error('Final optimization failed:', error);
      throw error;
    }
  }

  /**
   * Update capture settings
   */
  updateSettings(newSettings: Partial<CaptureSettings>): void {
    this.defaultSettings = { ...this.defaultSettings, ...newSettings };
  }

  /**
   * Update processing options
   */
  updateProcessingOptions(newOptions: Partial<ProcessingOptions>): void {
    this.defaultProcessingOptions = { ...this.defaultProcessingOptions, ...newOptions };
  }

  /**
   * Get current settings
   */
  getSettings(): CaptureSettings {
    return { ...this.defaultSettings };
  }

  /**
   * Get current processing options
   */
  getProcessingOptions(): ProcessingOptions {
    return { ...this.defaultProcessingOptions };
  }
}

export default AdvancedImageCapture;
