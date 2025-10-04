import * as ImageManipulator from 'expo-image-manipulator';
import { getFileSizeWithFallback, fileExists } from './filesystem';
import { DocumentCorners } from './enhancedEdgeDetection';

export interface CropOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  maintainAspectRatio?: boolean;
  aspectRatio?: number;
}

export interface RotationOptions {
  angle: number;
  centerX?: number;
  centerY?: number;
  backgroundColor?: string;
}

export interface ImageTransform {
  crop?: CropOptions;
  rotation?: RotationOptions;
  flip?: 'horizontal' | 'vertical' | 'both';
  scale?: {
    x: number;
    y: number;
  };
}

export interface ProcessingResult {
  uri: string;
  width: number;
  height: number;
  fileSize: number;
  originalSize: number;
  compressionRatio: number;
  processingTime: number;
  transformations: string[];
}

export interface BatchProcessingOptions {
  documents: Array<{
    uri: string;
    corners?: DocumentCorners | null;
    transforms?: ImageTransform;
  }>;
  outputFormat: 'jpeg' | 'png' | 'webp';
  quality: number;
  maxWidth?: number;
  maxHeight?: number;
}

export class AdvancedImageProcessor {
  private static instance: AdvancedImageProcessor;
  private processingHistory: ProcessingResult[] = [];

  static getInstance(): AdvancedImageProcessor {
    if (!AdvancedImageProcessor.instance) {
      AdvancedImageProcessor.instance = new AdvancedImageProcessor();
    }
    return AdvancedImageProcessor.instance;
  }

  /**
   * Crop image with advanced options
   */
  async cropImage(
    imageUri: string,
    cropOptions: CropOptions,
    outputFormat: 'jpeg' | 'png' | 'webp' = 'jpeg',
    quality: number = 0.9
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    
    try {
      console.log('Starting image cropping...');
      
      // Get original image info
      const originalSize = await getFileSizeWithFallback(imageUri, 0);
      
      // Calculate crop dimensions
      const { x, y, width, height, maintainAspectRatio, aspectRatio } = cropOptions;
      
      let cropWidth = width;
      let cropHeight = height;
      
      if (maintainAspectRatio && aspectRatio) {
        if (width / height > aspectRatio) {
          cropHeight = width / aspectRatio;
        } else {
          cropWidth = height * aspectRatio;
        }
      }
      
      // Apply crop
      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            crop: {
              originX: Math.max(0, x),
              originY: Math.max(0, y),
              width: Math.max(1, cropWidth),
              height: Math.max(1, cropHeight),
            },
          },
        ],
        {
          compress: quality,
          format: ImageManipulator.SaveFormat[outputFormat.toUpperCase() as keyof typeof ImageManipulator.SaveFormat],
        }
      );
      
      // Get processed image info
      const fileSize = await getFileSizeWithFallback(result.uri, 0);
      
      const processingTime = Date.now() - startTime;
      const compressionRatio = originalSize > 0 ? fileSize / originalSize : 1;
      
      const processingResult: ProcessingResult = {
        uri: result.uri,
        width: result.width,
        height: result.height,
        fileSize: fileSize,
        originalSize: originalSize,
        compressionRatio: compressionRatio,
        processingTime: processingTime,
        transformations: ['crop'],
      };
      
      this.processingHistory.push(processingResult);
      
      console.log('Image cropping completed:', {
        width: result.width,
        height: result.height,
        fileSize: fileSize,
        processingTime: processingTime
      });
      
      return processingResult;
    } catch (error) {
      console.error('Image cropping failed:', error);
      throw new Error('Failed to crop image');
    }
  }

  /**
   * Rotate image with advanced options
   */
  async rotateImage(
    imageUri: string,
    rotationOptions: RotationOptions,
    outputFormat: 'jpeg' | 'png' | 'webp' = 'jpeg',
    quality: number = 0.9
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    
    try {
      console.log('Starting image rotation...');
      
      // Get original image info
      const originalSize = await getFileSizeWithFallback(imageUri, 0);
      
      const { angle, centerX, centerY, backgroundColor } = rotationOptions;
      
      // Apply rotation
      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            rotate: angle,
          },
        ],
        {
          compress: quality,
          format: ImageManipulator.SaveFormat[outputFormat.toUpperCase() as keyof typeof ImageManipulator.SaveFormat],
        }
      );
      
      // Get processed image info
      const fileSize = await getFileSizeWithFallback(result.uri, 0);
      
      const processingTime = Date.now() - startTime;
      const compressionRatio = originalSize > 0 ? fileSize / originalSize : 1;
      
      const processingResult: ProcessingResult = {
        uri: result.uri,
        width: result.width,
        height: result.height,
        fileSize: fileSize,
        originalSize: originalSize,
        compressionRatio: compressionRatio,
        processingTime: processingTime,
        transformations: [`rotate_${angle}`],
      };
      
      this.processingHistory.push(processingResult);
      
      console.log('Image rotation completed:', {
        angle: angle,
        width: result.width,
        height: result.height,
        fileSize: fileSize,
        processingTime: processingTime
      });
      
      return processingResult;
    } catch (error) {
      console.error('Image rotation failed:', error);
      throw new Error('Failed to rotate image');
    }
  }

  /**
   * Apply multiple transformations to image
   */
  async transformImage(
    imageUri: string,
    transforms: ImageTransform,
    outputFormat: 'jpeg' | 'png' | 'webp' = 'jpeg',
    quality: number = 0.9
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    
    try {
      console.log('Starting image transformation...');
      
      // Get original image info
      const originalSize = await getFileSizeWithFallback(imageUri, 0);
      
      const actions: ImageManipulator.Action[] = [];
      const transformationNames: string[] = [];
      
      // Apply crop if specified
      if (transforms.crop) {
        const { x, y, width, height } = transforms.crop;
        actions.push({
          crop: {
            originX: Math.max(0, x),
            originY: Math.max(0, y),
            width: Math.max(1, width),
            height: Math.max(1, height),
          },
        });
        transformationNames.push('crop');
      }
      
      // Apply rotation if specified
      if (transforms.rotation) {
        actions.push({
          rotate: transforms.rotation.angle,
        });
        transformationNames.push(`rotate_${transforms.rotation.angle}`);
      }
      
      // Apply flip if specified
      if (transforms.flip) {
        switch (transforms.flip) {
          case 'horizontal':
            actions.push({ flip: ImageManipulator.FlipType.Horizontal });
            transformationNames.push('flip_horizontal');
            break;
          case 'vertical':
            actions.push({ flip: ImageManipulator.FlipType.Vertical });
            transformationNames.push('flip_vertical');
            break;
          case 'both':
            actions.push({ flip: ImageManipulator.FlipType.Horizontal });
            actions.push({ flip: ImageManipulator.FlipType.Vertical });
            transformationNames.push('flip_both');
            break;
        }
      }
      
      // Apply scale if specified
      if (transforms.scale) {
        actions.push({
          resize: {
            width: Math.round(transforms.scale.x),
            height: Math.round(transforms.scale.y),
          },
        });
        transformationNames.push(`scale_${transforms.scale.x}x${transforms.scale.y}`);
      }
      
      // Apply transformations
      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        actions,
        {
          compress: quality,
          format: ImageManipulator.SaveFormat[outputFormat.toUpperCase() as keyof typeof ImageManipulator.SaveFormat],
        }
      );
      
      // Get processed image info
      const fileSize = await getFileSizeWithFallback(result.uri, 0);
      
      const processingTime = Date.now() - startTime;
      const compressionRatio = originalSize > 0 ? fileSize / originalSize : 1;
      
      const processingResult: ProcessingResult = {
        uri: result.uri,
        width: result.width,
        height: result.height,
        fileSize: fileSize,
        originalSize: originalSize,
        compressionRatio: compressionRatio,
        processingTime: processingTime,
        transformations: transformationNames,
      };
      
      this.processingHistory.push(processingResult);
      
      console.log('Image transformation completed:', {
        transformations: transformationNames,
        width: result.width,
        height: result.height,
        fileSize: fileSize,
        processingTime: processingTime
      });
      
      return processingResult;
    } catch (error) {
      console.error('Image transformation failed:', error);
      throw new Error('Failed to transform image');
    }
  }

  /**
   * Process multiple images in batch
   */
  async processBatch(
    options: BatchProcessingOptions
  ): Promise<ProcessingResult[]> {
    const startTime = Date.now();
    
    try {
      console.log(`Starting batch processing of ${options.documents.length} documents...`);
      
      const results: ProcessingResult[] = [];
      
      for (let i = 0; i < options.documents.length; i++) {
        const document = options.documents[i];
        console.log(`Processing document ${i + 1}/${options.documents.length}...`);
        
        try {
          let result: ProcessingResult;
          
          if (document.transforms) {
            // Apply custom transformations
            result = await this.transformImage(
              document.uri,
              document.transforms,
              options.outputFormat,
              options.quality
            );
          } else if (document.corners) {
            // Auto-crop based on detected corners
            const cropOptions: CropOptions = this.calculateCropFromCorners(document.corners);
            result = await this.cropImage(
              document.uri,
              cropOptions,
              options.outputFormat,
              options.quality
            );
          } else {
            // Basic processing with size limits
            result = await this.resizeImage(
              document.uri,
              options.maxWidth,
              options.maxHeight,
              options.outputFormat,
              options.quality
            );
          }
          
          results.push(result);
        } catch (error) {
          console.error(`Failed to process document ${i + 1}:`, error);
          // Continue with other documents
        }
      }
      
      const totalTime = Date.now() - startTime;
      console.log(`Batch processing completed: ${results.length}/${options.documents.length} documents processed in ${totalTime}ms`);
      
      return results;
    } catch (error) {
      console.error('Batch processing failed:', error);
      throw new Error('Failed to process batch');
    }
  }

  /**
   * Resize image with size limits
   */
  async resizeImage(
    imageUri: string,
    maxWidth?: number,
    maxHeight?: number,
    outputFormat: 'jpeg' | 'png' | 'webp' = 'jpeg',
    quality: number = 0.9
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    
    try {
      console.log('Starting image resize...');
      
      // Get original image info
      const originalSize = await getFileSizeWithFallback(imageUri, 0);
      
      const actions: ImageManipulator.Action[] = [];
      
      if (maxWidth || maxHeight) {
        actions.push({
          resize: {
            width: maxWidth || 2048,
            height: maxHeight || 2048,
          },
        });
      }
      
      // Apply resize
      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        actions,
        {
          compress: quality,
          format: ImageManipulator.SaveFormat[outputFormat.toUpperCase() as keyof typeof ImageManipulator.SaveFormat],
        }
      );
      
      // Get processed image info
      const fileSize = await getFileSizeWithFallback(result.uri, 0);
      
      const processingTime = Date.now() - startTime;
      const compressionRatio = originalSize > 0 ? fileSize / originalSize : 1;
      
      const processingResult: ProcessingResult = {
        uri: result.uri,
        width: result.width,
        height: result.height,
        fileSize: fileSize,
        originalSize: originalSize,
        compressionRatio: compressionRatio,
        processingTime: processingTime,
        transformations: ['resize'],
      };
      
      this.processingHistory.push(processingResult);
      
      console.log('Image resize completed:', {
        width: result.width,
        height: result.height,
        fileSize: fileSize,
        processingTime: processingTime
      });
      
      return processingResult;
    } catch (error) {
      console.error('Image resize failed:', error);
      throw new Error('Failed to resize image');
    }
  }

  /**
   * Calculate crop options from detected corners
   */
  private calculateCropFromCorners(corners: DocumentCorners): CropOptions {
    const { topLeft, topRight, bottomLeft, bottomRight } = corners;
    
    const x = Math.min(topLeft.x, bottomLeft.x);
    const y = Math.min(topLeft.y, topRight.y);
    const width = Math.max(topRight.x, bottomRight.x) - x;
    const height = Math.max(bottomLeft.y, bottomRight.y) - y;
    
    return {
      x: Math.max(0, x),
      y: Math.max(0, y),
      width: Math.max(100, width),
      height: Math.max(100, height),
      maintainAspectRatio: true,
    };
  }

  /**
   * Get processing history
   */
  getProcessingHistory(): ProcessingResult[] {
    return [...this.processingHistory];
  }

  /**
   * Clear processing history
   */
  clearHistory(): void {
    this.processingHistory = [];
  }

  /**
   * Get processing statistics
   */
  getProcessingStats(): {
    totalProcessed: number;
    totalTime: number;
    averageTime: number;
    totalSizeReduction: number;
    averageCompressionRatio: number;
  } {
    const totalProcessed = this.processingHistory.length;
    const totalTime = this.processingHistory.reduce((sum, result) => sum + result.processingTime, 0);
    const averageTime = totalProcessed > 0 ? totalTime / totalProcessed : 0;
    
    const totalOriginalSize = this.processingHistory.reduce((sum, result) => sum + result.originalSize, 0);
    const totalProcessedSize = this.processingHistory.reduce((sum, result) => sum + result.fileSize, 0);
    const totalSizeReduction = totalOriginalSize > 0 ? (totalOriginalSize - totalProcessedSize) / totalOriginalSize : 0;
    
    const averageCompressionRatio = totalProcessed > 0 
      ? this.processingHistory.reduce((sum, result) => sum + result.compressionRatio, 0) / totalProcessed 
      : 1;
    
    return {
      totalProcessed,
      totalTime,
      averageTime,
      totalSizeReduction,
      averageCompressionRatio,
    };
  }
}

export default AdvancedImageProcessor;
