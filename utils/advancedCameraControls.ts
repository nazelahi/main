import { Dimensions } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface FlashMode {
  mode: 'off' | 'on' | 'auto' | 'torch';
  intensity?: number; // 0.0 to 1.0 for torch mode
  redEyeReduction?: boolean;
}

export interface HDRSettings {
  enabled: boolean;
  mode: 'auto' | 'manual' | 'off';
  exposureBracketing: number; // Number of exposures (-2, -1, 0, +1, +2)
  mergeAlgorithm: 'average' | 'hdr' | 'smart';
  toneMapping: 'linear' | 'reinhard' | 'aces';
  strength: number; // 0.0 to 1.0
}

export interface FocusSettings {
  mode: 'auto' | 'manual' | 'continuous' | 'macro';
  point: { x: number; y: number } | null; // Focus point coordinates (0.0 to 1.0)
  distance: number; // Focus distance in meters
  sensitivity: number; // 0.0 to 1.0
  stabilization: boolean;
}

export interface ExposureSettings {
  mode: 'auto' | 'manual' | 'priority';
  compensation: number; // -3.0 to +3.0 EV
  iso: number; // ISO sensitivity
  shutterSpeed: number; // Shutter speed in seconds
  aperture: number; // Aperture value (f-number)
  metering: 'matrix' | 'center' | 'spot';
}

export interface WhiteBalanceSettings {
  mode: 'auto' | 'manual' | 'preset';
  temperature: number; // Color temperature in Kelvin (2000-8000)
  tint: number; // Tint adjustment (-100 to +100)
  preset: 'daylight' | 'cloudy' | 'tungsten' | 'fluorescent' | 'flash' | 'custom';
}

export interface ResolutionSettings {
  width: number;
  height: number;
  aspectRatio: number;
  quality: 'low' | 'medium' | 'high' | 'ultra';
  compression: number; // 0.0 to 1.0
  format: 'jpeg' | 'png' | 'heic';
}

export interface CameraPreset {
  id: string;
  name: string;
  description: string;
  flash: Partial<FlashMode>;
  hdr: Partial<HDRSettings>;
  focus: Partial<FocusSettings>;
  exposure: Partial<ExposureSettings>;
  whiteBalance: Partial<WhiteBalanceSettings>;
  resolution: Partial<ResolutionSettings>;
  documentType: string;
  lightingCondition: 'bright' | 'normal' | 'low' | 'mixed';
}

export interface CameraControlResult {
  success: boolean;
  settings: {
    flash: FlashMode;
    hdr: HDRSettings;
    focus: FocusSettings;
    exposure: ExposureSettings;
    whiteBalance: WhiteBalanceSettings;
    resolution: ResolutionSettings;
  };
  processingTime: number;
  error?: string;
}

export class AdvancedCameraControls {
  private static instance: AdvancedCameraControls;
  private presets: CameraPreset[] = [];
  private currentSettings: CameraControlResult['settings'];
  private controlHistory: CameraControlResult[] = [];

  constructor() {
    this.initializePresets();
    this.initializeDefaultSettings();
  }

  static getInstance(): AdvancedCameraControls {
    if (!AdvancedCameraControls.instance) {
      AdvancedCameraControls.instance = new AdvancedCameraControls();
    }
    return AdvancedCameraControls.instance;
  }

  /**
   * Initialize camera presets for different scenarios
   */
  private initializePresets(): void {
    this.presets = [
      {
        id: 'document_standard',
        name: 'Document Standard',
        description: 'Optimized for standard document scanning',
        flash: { mode: 'auto', redEyeReduction: false },
        hdr: { enabled: false, mode: 'off' },
        focus: { mode: 'auto', sensitivity: 0.7, stabilization: true },
        exposure: { mode: 'auto', compensation: 0, metering: 'matrix' },
        whiteBalance: { mode: 'auto', preset: 'daylight' },
        resolution: { quality: 'high', compression: 0.85 },
        documentType: 'document',
        lightingCondition: 'normal',
      },
      {
        id: 'document_low_light',
        name: 'Document Low Light',
        description: 'Optimized for low light document scanning',
        flash: { mode: 'auto', intensity: 0.8, redEyeReduction: false },
        hdr: { enabled: true, mode: 'auto', strength: 0.6 },
        focus: { mode: 'macro', sensitivity: 0.9, stabilization: true },
        exposure: { mode: 'manual', compensation: 0.5, iso: 400 },
        whiteBalance: { mode: 'auto', preset: 'tungsten' },
        resolution: { quality: 'high', compression: 0.8 },
        documentType: 'document',
        lightingCondition: 'low',
      },
      {
        id: 'receipt_scanning',
        name: 'Receipt Scanning',
        description: 'Optimized for small receipt scanning',
        flash: { mode: 'auto', intensity: 0.6 },
        hdr: { enabled: true, mode: 'auto', strength: 0.4 },
        focus: { mode: 'macro', sensitivity: 0.8, stabilization: true },
        exposure: { mode: 'auto', compensation: 0.2, metering: 'center' },
        whiteBalance: { mode: 'auto', preset: 'daylight' },
        resolution: { quality: 'ultra', compression: 0.9 },
        documentType: 'receipt',
        lightingCondition: 'normal',
      },
      {
        id: 'photo_scanning',
        name: 'Photo Scanning',
        description: 'Optimized for photo and image scanning',
        flash: { mode: 'off' },
        hdr: { enabled: true, mode: 'manual', strength: 0.3 },
        focus: { mode: 'auto', sensitivity: 0.6, stabilization: true },
        exposure: { mode: 'auto', compensation: 0, metering: 'matrix' },
        whiteBalance: { mode: 'auto', preset: 'daylight' },
        resolution: { quality: 'ultra', compression: 0.95 },
        documentType: 'photo',
        lightingCondition: 'normal',
      },
      {
        id: 'text_optimized',
        name: 'Text Optimized',
        description: 'Optimized for text document scanning',
        flash: { mode: 'auto', intensity: 0.7 },
        hdr: { enabled: false, mode: 'off' },
        focus: { mode: 'auto', sensitivity: 0.8, stabilization: true },
        exposure: { mode: 'auto', compensation: 0.3, metering: 'matrix' },
        whiteBalance: { mode: 'auto', preset: 'daylight' },
        resolution: { quality: 'high', compression: 0.8 },
        documentType: 'text',
        lightingCondition: 'normal',
      },
      {
        id: 'mixed_lighting',
        name: 'Mixed Lighting',
        description: 'Optimized for mixed lighting conditions',
        flash: { mode: 'auto', intensity: 0.5 },
        hdr: { enabled: true, mode: 'auto', strength: 0.7 },
        focus: { mode: 'auto', sensitivity: 0.7, stabilization: true },
        exposure: { mode: 'auto', compensation: 0, metering: 'matrix' },
        whiteBalance: { mode: 'auto', preset: 'daylight' },
        resolution: { quality: 'high', compression: 0.85 },
        documentType: 'mixed',
        lightingCondition: 'mixed',
      },
    ];
  }

  /**
   * Initialize default camera settings
   */
  private initializeDefaultSettings(): void {
    this.currentSettings = {
      flash: {
        mode: 'auto',
        intensity: 0.5,
        redEyeReduction: false,
      },
      hdr: {
        enabled: false,
        mode: 'auto',
        exposureBracketing: 3,
        mergeAlgorithm: 'hdr',
        toneMapping: 'reinhard',
        strength: 0.5,
      },
      focus: {
        mode: 'auto',
        point: null,
        distance: 1.0,
        sensitivity: 0.7,
        stabilization: true,
      },
      exposure: {
        mode: 'auto',
        compensation: 0,
        iso: 100,
        shutterSpeed: 1/60,
        aperture: 2.8,
        metering: 'matrix',
      },
      whiteBalance: {
        mode: 'auto',
        temperature: 5500,
        tint: 0,
        preset: 'daylight',
      },
      resolution: {
        width: 1920,
        height: 1080,
        aspectRatio: 16/9,
        quality: 'high',
        compression: 0.85,
        format: 'jpeg',
      },
    };
  }

  /**
   * Apply camera preset
   */
  async applyPreset(presetId: string): Promise<CameraControlResult> {
    const startTime = Date.now();
    
    try {
      const preset = this.presets.find(p => p.id === presetId);
      if (!preset) {
        throw new Error(`Preset '${presetId}' not found`);
      }

      console.log(`Applying camera preset: ${preset.name}`);

      // Apply preset settings
      this.currentSettings = {
        flash: { ...this.currentSettings.flash, ...preset.flash },
        hdr: { ...this.currentSettings.hdr, ...preset.hdr },
        focus: { ...this.currentSettings.focus, ...preset.focus },
        exposure: { ...this.currentSettings.exposure, ...preset.exposure },
        whiteBalance: { ...this.currentSettings.whiteBalance, ...preset.whiteBalance },
        resolution: { ...this.currentSettings.resolution, ...preset.resolution },
      };

      // Optimize resolution based on document type
      await this.optimizeResolutionForDocumentType(preset.documentType);

      const result: CameraControlResult = {
        success: true,
        settings: { ...this.currentSettings },
        processingTime: Date.now() - startTime,
      };

      this.controlHistory.push(result);
      console.log('Camera preset applied successfully:', preset.name);

      return result;
    } catch (error) {
      console.error('Failed to apply camera preset:', error);
      return {
        success: false,
        settings: this.currentSettings,
        processingTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Optimize resolution based on document type
   */
  private async optimizeResolutionForDocumentType(documentType: string): Promise<void> {
    const baseResolution = this.getBaseResolution();
    
    switch (documentType) {
      case 'receipt':
        // Higher resolution for small documents
        this.currentSettings.resolution = {
          ...baseResolution,
          quality: 'ultra',
          compression: 0.9,
          width: Math.min(SCREEN_WIDTH * 2, 2048),
          height: Math.min(SCREEN_HEIGHT * 2, 1536),
        };
        break;
      case 'text':
        // Balanced resolution for text documents
        this.currentSettings.resolution = {
          ...baseResolution,
          quality: 'high',
          compression: 0.8,
          width: Math.min(SCREEN_WIDTH * 1.5, 1920),
          height: Math.min(SCREEN_HEIGHT * 1.5, 1080),
        };
        break;
      case 'photo':
        // Maximum resolution for photos
        this.currentSettings.resolution = {
          ...baseResolution,
          quality: 'ultra',
          compression: 0.95,
          width: Math.min(SCREEN_WIDTH * 2.5, 3072),
          height: Math.min(SCREEN_HEIGHT * 2.5, 2048),
        };
        break;
      case 'document':
      default:
        // Standard resolution for documents
        this.currentSettings.resolution = {
          ...baseResolution,
          quality: 'high',
          compression: 0.85,
          width: Math.min(SCREEN_WIDTH * 1.8, 2560),
          height: Math.min(SCREEN_HEIGHT * 1.8, 1440),
        };
        break;
    }
  }

  /**
   * Get base resolution based on screen size
   */
  private getBaseResolution(): ResolutionSettings {
    const aspectRatio = SCREEN_WIDTH / SCREEN_HEIGHT;
    return {
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
      aspectRatio,
      quality: 'high',
      compression: 0.85,
      format: 'jpeg',
    };
  }

  /**
   * Configure flash settings
   */
  async configureFlash(flashSettings: Partial<FlashMode>): Promise<CameraControlResult> {
    const startTime = Date.now();
    
    try {
      this.currentSettings.flash = { ...this.currentSettings.flash, ...flashSettings };
      
      console.log('Flash settings updated:', this.currentSettings.flash);

      const result: CameraControlResult = {
        success: true,
        settings: { ...this.currentSettings },
        processingTime: Date.now() - startTime,
      };

      this.controlHistory.push(result);
      return result;
    } catch (error) {
      console.error('Failed to configure flash:', error);
      return {
        success: false,
        settings: this.currentSettings,
        processingTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Configure HDR settings
   */
  async configureHDR(hdrSettings: Partial<HDRSettings>): Promise<CameraControlResult> {
    const startTime = Date.now();
    
    try {
      this.currentSettings.hdr = { ...this.currentSettings.hdr, ...hdrSettings };
      
      console.log('HDR settings updated:', this.currentSettings.hdr);

      const result: CameraControlResult = {
        success: true,
        settings: { ...this.currentSettings },
        processingTime: Date.now() - startTime,
      };

      this.controlHistory.push(result);
      return result;
    } catch (error) {
      console.error('Failed to configure HDR:', error);
      return {
        success: false,
        settings: this.currentSettings,
        processingTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Configure focus settings
   */
  async configureFocus(focusSettings: Partial<FocusSettings>): Promise<CameraControlResult> {
    const startTime = Date.now();
    
    try {
      this.currentSettings.focus = { ...this.currentSettings.focus, ...focusSettings };
      
      console.log('Focus settings updated:', this.currentSettings.focus);

      const result: CameraControlResult = {
        success: true,
        settings: { ...this.currentSettings },
        processingTime: Date.now() - startTime,
      };

      this.controlHistory.push(result);
      return result;
    } catch (error) {
      console.error('Failed to configure focus:', error);
      return {
        success: false,
        settings: this.currentSettings,
        processingTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Configure exposure settings
   */
  async configureExposure(exposureSettings: Partial<ExposureSettings>): Promise<CameraControlResult> {
    const startTime = Date.now();
    
    try {
      this.currentSettings.exposure = { ...this.currentSettings.exposure, ...exposureSettings };
      
      console.log('Exposure settings updated:', this.currentSettings.exposure);

      const result: CameraControlResult = {
        success: true,
        settings: { ...this.currentSettings },
        processingTime: Date.now() - startTime,
      };

      this.controlHistory.push(result);
      return result;
    } catch (error) {
      console.error('Failed to configure exposure:', error);
      return {
        success: false,
        settings: this.currentSettings,
        processingTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Configure white balance settings
   */
  async configureWhiteBalance(whiteBalanceSettings: Partial<WhiteBalanceSettings>): Promise<CameraControlResult> {
    const startTime = Date.now();
    
    try {
      this.currentSettings.whiteBalance = { ...this.currentSettings.whiteBalance, ...whiteBalanceSettings };
      
      console.log('White balance settings updated:', this.currentSettings.whiteBalance);

      const result: CameraControlResult = {
        success: true,
        settings: { ...this.currentSettings },
        processingTime: Date.now() - startTime,
      };

      this.controlHistory.push(result);
      return result;
    } catch (error) {
      console.error('Failed to configure white balance:', error);
      return {
        success: false,
        settings: this.currentSettings,
        processingTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Configure resolution settings
   */
  async configureResolution(resolutionSettings: Partial<ResolutionSettings>): Promise<CameraControlResult> {
    const startTime = Date.now();
    
    try {
      this.currentSettings.resolution = { ...this.currentSettings.resolution, ...resolutionSettings };
      
      console.log('Resolution settings updated:', this.currentSettings.resolution);

      const result: CameraControlResult = {
        success: true,
        settings: { ...this.currentSettings },
        processingTime: Date.now() - startTime,
      };

      this.controlHistory.push(result);
      return result;
    } catch (error) {
      console.error('Failed to configure resolution:', error);
      return {
        success: false,
        settings: this.currentSettings,
        processingTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Auto-configure camera based on lighting conditions
   */
  async autoConfigure(lightingCondition: 'bright' | 'normal' | 'low' | 'mixed'): Promise<CameraControlResult> {
    const startTime = Date.now();
    
    try {
      console.log(`Auto-configuring camera for ${lightingCondition} lighting`);

      switch (lightingCondition) {
        case 'bright':
          this.currentSettings.flash.mode = 'off';
          this.currentSettings.hdr.enabled = false;
          this.currentSettings.exposure.compensation = -0.5;
          this.currentSettings.whiteBalance.preset = 'daylight';
          break;
        case 'low':
          this.currentSettings.flash.mode = 'auto';
          this.currentSettings.hdr.enabled = true;
          this.currentSettings.exposure.compensation = 0.5;
          this.currentSettings.whiteBalance.preset = 'tungsten';
          break;
        case 'mixed':
          this.currentSettings.flash.mode = 'auto';
          this.currentSettings.hdr.enabled = true;
          this.currentSettings.exposure.compensation = 0;
          this.currentSettings.whiteBalance.mode = 'auto';
          break;
        case 'normal':
        default:
          this.currentSettings.flash.mode = 'auto';
          this.currentSettings.hdr.enabled = false;
          this.currentSettings.exposure.compensation = 0;
          this.currentSettings.whiteBalance.preset = 'daylight';
          break;
      }

      const result: CameraControlResult = {
        success: true,
        settings: { ...this.currentSettings },
        processingTime: Date.now() - startTime,
      };

      this.controlHistory.push(result);
      console.log('Camera auto-configured successfully');

      return result;
    } catch (error) {
      console.error('Failed to auto-configure camera:', error);
      return {
        success: false,
        settings: this.currentSettings,
        processingTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get current camera settings
   */
  getCurrentSettings(): CameraControlResult['settings'] {
    return { ...this.currentSettings };
  }

  /**
   * Get available presets
   */
  getPresets(): CameraPreset[] {
    return [...this.presets];
  }

  /**
   * Get control history
   */
  getControlHistory(): CameraControlResult[] {
    return [...this.controlHistory];
  }

  /**
   * Clear control history
   */
  clearHistory(): void {
    this.controlHistory = [];
  }

  /**
   * Get camera statistics
   */
  getCameraStats(): {
    totalConfigurations: number;
    averageProcessingTime: number;
    successRate: number;
    mostUsedPreset: string;
  } {
    const totalConfigurations = this.controlHistory.length;
    const averageProcessingTime = totalConfigurations > 0 
      ? this.controlHistory.reduce((sum, result) => sum + result.processingTime, 0) / totalConfigurations 
      : 0;
    const successRate = totalConfigurations > 0 
      ? this.controlHistory.filter(result => result.success).length / totalConfigurations 
      : 0;

    // Find most used preset (simplified - in real implementation, track preset usage)
    const mostUsedPreset = 'document_standard';

    return {
      totalConfigurations,
      averageProcessingTime,
      successRate,
      mostUsedPreset,
    };
  }
}

export default AdvancedCameraControls;
