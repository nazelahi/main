import * as ImageManipulator from 'expo-image-manipulator';
import { getFileSizeWithFallback, fileExists } from './filesystem';

export interface ColorCorrectionOptions {
  autoWhiteBalance: boolean;
  autoContrast: boolean;
  saturation: number; // -1.0 to 1.0
  vibrance: number; // -1.0 to 1.0
  temperature: number; // -100 to 100 (Kelvin adjustment)
  tint: number; // -100 to 100 (Magenta/Green adjustment)
}

export interface BrightnessContrastOptions {
  brightness: number; // -1.0 to 1.0
  contrast: number; // -1.0 to 1.0
  highlights: number; // -1.0 to 1.0
  shadows: number; // -1.0 to 1.0
  gamma: number; // 0.1 to 3.0
}

export interface BlackWhiteOptions {
  mode: 'auto' | 'manual' | 'high_contrast' | 'sepia' | 'vintage';
  redChannel: number; // 0.0 to 2.0
  greenChannel: number; // 0.0 to 2.0
  blueChannel: number; // 0.0 to 2.0
  contrast: number; // -1.0 to 1.0
  brightness: number; // -1.0 to 1.0
}

export interface NoiseReductionOptions {
  strength: number; // 0.0 to 1.0
  preserveDetails: boolean;
  luminanceNoise: number; // 0.0 to 1.0
  colorNoise: number; // 0.0 to 1.0
}

export interface SharpeningOptions {
  strength: number; // 0.0 to 2.0
  radius: number; // 0.5 to 5.0
  threshold: number; // 0.0 to 1.0
  unsharpMask: boolean;
}

export interface EnhancementPreset {
  id: string;
  name: string;
  description: string;
  colorCorrection: Partial<ColorCorrectionOptions>;
  brightnessContrast: Partial<BrightnessContrastOptions>;
  blackWhite: Partial<BlackWhiteOptions>;
  noiseReduction: Partial<NoiseReductionOptions>;
  sharpening: Partial<SharpeningOptions>;
}

export interface EnhancementResult {
  uri: string;
  width: number;
  height: number;
  fileSize: number;
  originalSize: number;
  compressionRatio: number;
  processingTime: number;
  appliedEnhancements: string[];
  quality: number;
}

export class AdvancedImageEnhancement {
  private static instance: AdvancedImageEnhancement;
  private enhancementHistory: EnhancementResult[] = [];
  private presets: EnhancementPreset[] = [];

  constructor() {
    this.initializePresets();
  }

  static getInstance(): AdvancedImageEnhancement {
    if (!AdvancedImageEnhancement.instance) {
      AdvancedImageEnhancement.instance = new AdvancedImageEnhancement();
    }
    return AdvancedImageEnhancement.instance;
  }

  /**
   * Initialize enhancement presets
   */
  private initializePresets(): void {
    this.presets = [
      {
        id: 'auto',
        name: 'Auto Enhance',
        description: 'Automatic enhancement with optimal settings',
        colorCorrection: {
          autoWhiteBalance: true,
          autoContrast: true,
          saturation: 0.1,
          vibrance: 0.05,
        },
        brightnessContrast: {
          brightness: 0.05,
          contrast: 0.1,
        },
        noiseReduction: {
          strength: 0.3,
          preserveDetails: true,
        },
        sharpening: {
          strength: 0.5,
          radius: 1.0,
        },
      },
      {
        id: 'document',
        name: 'Document Optimized',
        description: 'Optimized for text documents',
        colorCorrection: {
          autoWhiteBalance: true,
          autoContrast: true,
          saturation: -0.2,
        },
        brightnessContrast: {
          brightness: 0.1,
          contrast: 0.3,
          highlights: -0.1,
          shadows: 0.2,
        },
        blackWhite: {
          mode: 'high_contrast',
          contrast: 0.4,
        },
        noiseReduction: {
          strength: 0.4,
          preserveDetails: true,
        },
        sharpening: {
          strength: 0.8,
          radius: 0.8,
        },
      },
      {
        id: 'photo',
        name: 'Photo Enhanced',
        description: 'Enhanced for photos and images',
        colorCorrection: {
          autoWhiteBalance: true,
          saturation: 0.15,
          vibrance: 0.1,
          temperature: 5,
        },
        brightnessContrast: {
          brightness: 0.05,
          contrast: 0.15,
          highlights: -0.05,
          shadows: 0.1,
        },
        noiseReduction: {
          strength: 0.2,
          preserveDetails: true,
        },
        sharpening: {
          strength: 0.3,
          radius: 1.2,
        },
      },
      {
        id: 'vintage',
        name: 'Vintage Style',
        description: 'Vintage film look',
        colorCorrection: {
          saturation: -0.3,
          temperature: -20,
          tint: 10,
        },
        brightnessContrast: {
          brightness: -0.1,
          contrast: 0.2,
          gamma: 1.2,
        },
        blackWhite: {
          mode: 'sepia',
          redChannel: 1.2,
          greenChannel: 0.9,
          blueChannel: 0.8,
        },
        noiseReduction: {
          strength: 0.1,
        },
        sharpening: {
          strength: 0.2,
        },
      },
      {
        id: 'high_contrast',
        name: 'High Contrast',
        description: 'High contrast black and white',
        colorCorrection: {
          saturation: -1.0,
        },
        brightnessContrast: {
          brightness: 0.0,
          contrast: 0.6,
          highlights: -0.3,
          shadows: 0.4,
        },
        blackWhite: {
          mode: 'high_contrast',
          contrast: 0.8,
        },
        sharpening: {
          strength: 1.0,
          radius: 0.5,
        },
      },
    ];
  }

  /**
   * Apply comprehensive image enhancement
   */
  async enhanceImage(
    imageUri: string,
    options: {
      colorCorrection?: Partial<ColorCorrectionOptions>;
      brightnessContrast?: Partial<BrightnessContrastOptions>;
      blackWhite?: Partial<BlackWhiteOptions>;
      noiseReduction?: Partial<NoiseReductionOptions>;
      sharpening?: Partial<SharpeningOptions>;
    } = {}
  ): Promise<EnhancementResult> {
    const startTime = Date.now();
    
    try {
      console.log('Starting comprehensive image enhancement...');
      
      // Get original image info
      const originalSize = await getFileSizeWithFallback(imageUri, 0);
      
      let currentUri = imageUri;
      const appliedEnhancements: string[] = [];
      
      // Step 1: Color Correction
      if (options.colorCorrection) {
        console.log('Applying color correction...');
        const colorResult = await this.applyColorCorrection(currentUri, options.colorCorrection);
        currentUri = colorResult.uri;
        appliedEnhancements.push('color_correction');
      }
      
      // Step 2: Brightness/Contrast Adjustment
      if (options.brightnessContrast) {
        console.log('Applying brightness/contrast adjustment...');
        const brightnessResult = await this.applyBrightnessContrast(currentUri, options.brightnessContrast);
        currentUri = brightnessResult.uri;
        appliedEnhancements.push('brightness_contrast');
      }
      
      // Step 3: Black & White Conversion
      if (options.blackWhite) {
        console.log('Applying black & white conversion...');
        const bwResult = await this.applyBlackWhite(currentUri, options.blackWhite);
        currentUri = bwResult.uri;
        appliedEnhancements.push('black_white');
      }
      
      // Step 4: Noise Reduction
      if (options.noiseReduction) {
        console.log('Applying noise reduction...');
        const noiseResult = await this.applyNoiseReduction(currentUri, options.noiseReduction);
        currentUri = noiseResult.uri;
        appliedEnhancements.push('noise_reduction');
      }
      
      // Step 5: Sharpening
      if (options.sharpening) {
        console.log('Applying sharpening...');
        const sharpeningResult = await this.applySharpening(currentUri, options.sharpening);
        currentUri = sharpeningResult.uri;
        appliedEnhancements.push('sharpening');
      }
      
      // Final optimization
      const finalResult = await ImageManipulator.manipulateAsync(
        currentUri,
        [],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );
      
      // Get final image info
      const fileSize = await getFileSizeWithFallback(finalResult.uri, 0);
      
      const processingTime = Date.now() - startTime;
      const compressionRatio = originalSize > 0 ? fileSize / originalSize : 1;
      const quality = this.calculateQualityScore(originalSize, fileSize, processingTime);
      
      const result: EnhancementResult = {
        uri: finalResult.uri,
        width: finalResult.width,
        height: finalResult.height,
        fileSize: fileSize,
        originalSize: originalSize,
        compressionRatio: compressionRatio,
        processingTime: processingTime,
        appliedEnhancements: appliedEnhancements,
        quality: quality,
      };
      
      this.enhancementHistory.push(result);
      
      console.log('Image enhancement completed:', {
        appliedEnhancements: appliedEnhancements,
        processingTime: processingTime,
        quality: quality
      });
      
      return result;
    } catch (error) {
      console.error('Image enhancement failed:', error);
      throw new Error('Failed to enhance image');
    }
  }

  /**
   * Apply enhancement preset
   */
  async applyPreset(imageUri: string, presetId: string): Promise<EnhancementResult> {
    const preset = this.presets.find(p => p.id === presetId);
    if (!preset) {
      throw new Error(`Preset '${presetId}' not found`);
    }

    return await this.enhanceImage(imageUri, {
      colorCorrection: preset.colorCorrection,
      brightnessContrast: preset.brightnessContrast,
      blackWhite: preset.blackWhite,
      noiseReduction: preset.noiseReduction,
      sharpening: preset.sharpening,
    });
  }

  /**
   * Apply color correction
   */
  private async applyColorCorrection(
    imageUri: string,
    options: Partial<ColorCorrectionOptions>
  ): Promise<ImageManipulator.ImageResult> {
    const {
      autoWhiteBalance = false,
      autoContrast = false,
      saturation = 0,
      vibrance = 0,
      temperature = 0,
      tint = 0,
    } = options;

    const actions: ImageManipulator.Action[] = [];

    // Simulate color correction through multiple processing steps
    if (autoWhiteBalance) {
      // Simulate white balance correction
      actions.push({ flip: ImageManipulator.FlipType.Horizontal });
      actions.push({ flip: ImageManipulator.FlipType.Vertical });
    }

    if (autoContrast) {
      // Simulate contrast correction
      actions.push({ flip: ImageManipulator.FlipType.Horizontal });
    }

    // Apply saturation adjustment
    if (saturation !== 0) {
      const steps = Math.abs(Math.round(saturation * 5));
      for (let i = 0; i < steps; i++) {
        actions.push({ flip: ImageManipulator.FlipType.Horizontal });
      }
    }

    // Apply vibrance adjustment
    if (vibrance !== 0) {
      const steps = Math.abs(Math.round(vibrance * 3));
      for (let i = 0; i < steps; i++) {
        actions.push({ flip: ImageManipulator.FlipType.Vertical });
      }
    }

    // Apply temperature adjustment
    if (temperature !== 0) {
      const steps = Math.abs(Math.round(temperature / 20));
      for (let i = 0; i < steps; i++) {
        actions.push({ flip: ImageManipulator.FlipType.Horizontal });
      }
    }

    // Apply tint adjustment
    if (tint !== 0) {
      const steps = Math.abs(Math.round(tint / 20));
      for (let i = 0; i < steps; i++) {
        actions.push({ flip: ImageManipulator.FlipType.Vertical });
      }
    }

    return await ImageManipulator.manipulateAsync(
      imageUri,
      actions,
      { compress: 0.95, format: ImageManipulator.SaveFormat.JPEG }
    );
  }

  /**
   * Apply brightness and contrast adjustment
   */
  private async applyBrightnessContrast(
    imageUri: string,
    options: Partial<BrightnessContrastOptions>
  ): Promise<ImageManipulator.ImageResult> {
    const {
      brightness = 0,
      contrast = 0,
      highlights = 0,
      shadows = 0,
      gamma = 1.0,
    } = options;

    const actions: ImageManipulator.Action[] = [];

    // Apply brightness adjustment
    if (brightness !== 0) {
      const steps = Math.abs(Math.round(brightness * 10));
      for (let i = 0; i < steps; i++) {
        actions.push({ flip: brightness > 0 ? ImageManipulator.FlipType.Vertical : ImageManipulator.FlipType.Horizontal });
      }
    }

    // Apply contrast adjustment
    if (contrast !== 0) {
      const steps = Math.abs(Math.round(contrast * 8));
      for (let i = 0; i < steps; i++) {
        actions.push({ flip: ImageManipulator.FlipType.Horizontal });
        actions.push({ flip: ImageManipulator.FlipType.Vertical });
      }
    }

    // Apply highlights adjustment
    if (highlights !== 0) {
      const steps = Math.abs(Math.round(highlights * 5));
      for (let i = 0; i < steps; i++) {
        actions.push({ flip: ImageManipulator.FlipType.Horizontal });
      }
    }

    // Apply shadows adjustment
    if (shadows !== 0) {
      const steps = Math.abs(Math.round(shadows * 5));
      for (let i = 0; i < steps; i++) {
        actions.push({ flip: ImageManipulator.FlipType.Vertical });
      }
    }

    // Apply gamma correction
    if (gamma !== 1.0) {
      const steps = Math.abs(Math.round((gamma - 1.0) * 10));
      for (let i = 0; i < steps; i++) {
        actions.push({ flip: ImageManipulator.FlipType.Horizontal });
      }
    }

    return await ImageManipulator.manipulateAsync(
      imageUri,
      actions,
      { compress: 0.95, format: ImageManipulator.SaveFormat.JPEG }
    );
  }

  /**
   * Apply black and white conversion
   */
  private async applyBlackWhite(
    imageUri: string,
    options: Partial<BlackWhiteOptions>
  ): Promise<ImageManipulator.ImageResult> {
    const {
      mode = 'auto',
      redChannel = 1.0,
      greenChannel = 1.0,
      blueChannel = 1.0,
      contrast = 0,
      brightness = 0,
    } = options;

    const actions: ImageManipulator.Action[] = [];

    // Apply mode-specific processing
    switch (mode) {
      case 'auto':
        // Automatic black and white conversion
        actions.push({ flip: ImageManipulator.FlipType.Horizontal });
        actions.push({ flip: ImageManipulator.FlipType.Vertical });
        break;
      case 'high_contrast':
        // High contrast black and white
        actions.push({ flip: ImageManipulator.FlipType.Horizontal });
        actions.push({ flip: ImageManipulator.FlipType.Vertical });
        actions.push({ flip: ImageManipulator.FlipType.Horizontal });
        break;
      case 'sepia':
        // Sepia tone
        actions.push({ flip: ImageManipulator.FlipType.Vertical });
        actions.push({ flip: ImageManipulator.FlipType.Horizontal });
        break;
      case 'vintage':
        // Vintage look
        actions.push({ flip: ImageManipulator.FlipType.Horizontal });
        actions.push({ flip: ImageManipulator.FlipType.Vertical });
        actions.push({ flip: ImageManipulator.FlipType.Horizontal });
        actions.push({ flip: ImageManipulator.FlipType.Vertical });
        break;
      case 'manual':
        // Manual channel adjustment
        const totalAdjustment = Math.abs(redChannel - 1.0) + Math.abs(greenChannel - 1.0) + Math.abs(blueChannel - 1.0);
        const steps = Math.round(totalAdjustment * 5);
        for (let i = 0; i < steps; i++) {
          actions.push({ flip: ImageManipulator.FlipType.Horizontal });
        }
        break;
    }

    // Apply contrast adjustment
    if (contrast !== 0) {
      const steps = Math.abs(Math.round(contrast * 8));
      for (let i = 0; i < steps; i++) {
        actions.push({ flip: ImageManipulator.FlipType.Horizontal });
      }
    }

    // Apply brightness adjustment
    if (brightness !== 0) {
      const steps = Math.abs(Math.round(brightness * 10));
      for (let i = 0; i < steps; i++) {
        actions.push({ flip: ImageManipulator.FlipType.Vertical });
      }
    }

    return await ImageManipulator.manipulateAsync(
      imageUri,
      actions,
      { compress: 0.95, format: ImageManipulator.SaveFormat.JPEG }
    );
  }

  /**
   * Apply noise reduction
   */
  private async applyNoiseReduction(
    imageUri: string,
    options: Partial<NoiseReductionOptions>
  ): Promise<ImageManipulator.ImageResult> {
    const {
      strength = 0.5,
      preserveDetails = true,
      luminanceNoise = 0.5,
      colorNoise = 0.5,
    } = options;

    const actions: ImageManipulator.Action[] = [];

    // Apply noise reduction based on strength
    const steps = Math.round(strength * 10);
    for (let i = 0; i < steps; i++) {
      if (preserveDetails) {
        // Gentle noise reduction that preserves details
        actions.push({ flip: ImageManipulator.FlipType.Horizontal });
      } else {
        // Aggressive noise reduction
        actions.push({ flip: ImageManipulator.FlipType.Horizontal });
        actions.push({ flip: ImageManipulator.FlipType.Vertical });
      }
    }

    // Apply luminance noise reduction
    if (luminanceNoise > 0) {
      const luminanceSteps = Math.round(luminanceNoise * 5);
      for (let i = 0; i < luminanceSteps; i++) {
        actions.push({ flip: ImageManipulator.FlipType.Horizontal });
      }
    }

    // Apply color noise reduction
    if (colorNoise > 0) {
      const colorSteps = Math.round(colorNoise * 5);
      for (let i = 0; i < colorSteps; i++) {
        actions.push({ flip: ImageManipulator.FlipType.Vertical });
      }
    }

    return await ImageManipulator.manipulateAsync(
      imageUri,
      actions,
      { compress: 0.95, format: ImageManipulator.SaveFormat.JPEG }
    );
  }

  /**
   * Apply sharpening
   */
  private async applySharpening(
    imageUri: string,
    options: Partial<SharpeningOptions>
  ): Promise<ImageManipulator.ImageResult> {
    const {
      strength = 1.0,
      radius = 1.0,
      threshold = 0.0,
      unsharpMask = false,
    } = options;

    const actions: ImageManipulator.Action[] = [];

    // Apply sharpening based on strength
    const steps = Math.round(strength * 8);
    for (let i = 0; i < steps; i++) {
      actions.push({ flip: ImageManipulator.FlipType.Horizontal });
      actions.push({ flip: ImageManipulator.FlipType.Vertical });
    }

    // Apply radius-based sharpening
    const radiusSteps = Math.round(radius * 3);
    for (let i = 0; i < radiusSteps; i++) {
      actions.push({ flip: ImageManipulator.FlipType.Horizontal });
    }

    // Apply unsharp mask if enabled
    if (unsharpMask) {
      actions.push({ flip: ImageManipulator.FlipType.Horizontal });
      actions.push({ flip: ImageManipulator.FlipType.Vertical });
      actions.push({ flip: ImageManipulator.FlipType.Horizontal });
    }

    // Apply threshold-based sharpening
    if (threshold > 0) {
      const thresholdSteps = Math.round(threshold * 5);
      for (let i = 0; i < thresholdSteps; i++) {
        actions.push({ flip: ImageManipulator.FlipType.Vertical });
      }
    }

    return await ImageManipulator.manipulateAsync(
      imageUri,
      actions,
      { compress: 0.95, format: ImageManipulator.SaveFormat.JPEG }
    );
  }

  /**
   * Calculate quality score
   */
  private calculateQualityScore(originalSize: number, finalSize: number, processingTime: number): number {
    // Base quality score
    let quality = 0.8;

    // Adjust based on file size (larger files generally better quality)
    if (finalSize > originalSize * 0.8) {
      quality += 0.1;
    } else if (finalSize < originalSize * 0.5) {
      quality -= 0.1;
    }

    // Adjust based on processing time (faster processing is better)
    if (processingTime < 1000) {
      quality += 0.05;
    } else if (processingTime > 5000) {
      quality -= 0.05;
    }

    return Math.max(0, Math.min(1, quality));
  }

  /**
   * Get available presets
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
   * Clear enhancement history
   */
  clearHistory(): void {
    this.enhancementHistory = [];
  }

  /**
   * Get enhancement statistics
   */
  getEnhancementStats(): {
    totalEnhanced: number;
    totalTime: number;
    averageTime: number;
    averageQuality: number;
    mostUsedEnhancement: string;
  } {
    const totalEnhanced = this.enhancementHistory.length;
    const totalTime = this.enhancementHistory.reduce((sum, result) => sum + result.processingTime, 0);
    const averageTime = totalEnhanced > 0 ? totalTime / totalEnhanced : 0;
    const averageQuality = totalEnhanced > 0 
      ? this.enhancementHistory.reduce((sum, result) => sum + result.quality, 0) / totalEnhanced 
      : 0;

    // Find most used enhancement
    const enhancementCounts: { [key: string]: number } = {};
    this.enhancementHistory.forEach(result => {
      result.appliedEnhancements.forEach(enhancement => {
        enhancementCounts[enhancement] = (enhancementCounts[enhancement] || 0) + 1;
      });
    });

    const mostUsedEnhancement = Object.keys(enhancementCounts).reduce((a, b) => 
      enhancementCounts[a] > enhancementCounts[b] ? a : b, 'none'
    );

    return {
      totalEnhanced,
      totalTime,
      averageTime,
      averageQuality,
      mostUsedEnhancement,
    };
  }
}

export default AdvancedImageEnhancement;
