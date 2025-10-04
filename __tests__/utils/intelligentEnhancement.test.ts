// Intelligent Enhancement Tests
import IntelligentEnhancementEngine, { EnhancementResult, DocumentType, EnhancementPreset } from '../../utils/intelligentEnhancement';

// Mock the DocumentProcessor
jest.mock('../../utils/imageProcessing', () => ({
  DocumentProcessor: {
    enhanceDocument: jest.fn().mockImplementation(async (imageUri, settings) => {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 100));
      return 'mock://enhanced-image.jpg';
    })
  }
}));

// Mock console methods to prevent test logs
const originalLog = console.log;
const originalError = console.error;
beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});
afterAll(() => {
  console.log = originalLog;
  console.error = originalError;
});

describe('IntelligentEnhancementEngine', () => {
  let enhancementEngine: IntelligentEnhancementEngine;

  beforeEach(() => {
    enhancementEngine = IntelligentEnhancementEngine.getInstance();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = IntelligentEnhancementEngine.getInstance();
      const instance2 = IntelligentEnhancementEngine.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('enhanceDocument', () => {
    it('should enhance document successfully', async () => {
      const result = await enhancementEngine.enhanceDocument('mock://image.jpg');
      
      expect(result).toBeDefined();
      expect(result.originalUri).toBe('mock://image.jpg');
      expect(result.enhancedUri).toBeDefined();
      expect(result.documentType).toBeDefined();
      expect(result.documentType.id).toBeDefined();
      expect(result.documentType.name).toBeDefined();
      expect(result.documentType.confidence).toBeGreaterThanOrEqual(0);
      expect(result.documentType.confidence).toBeLessThanOrEqual(1);
      expect(result.documentType.characteristics).toBeDefined();
      expect(result.appliedPreset).toBeDefined();
      expect(result.qualityImprovement).toBeGreaterThanOrEqual(0);
      expect(result.qualityImprovement).toBeLessThanOrEqual(1);
      expect(result.processingTime).toBeGreaterThan(0);
    });

    it('should use forced preset when specified', async () => {
      const result = await enhancementEngine.enhanceDocument('mock://image.jpg', 'text_document');
      
      expect(result.appliedPreset.id).toBe('text_document');
    });

    it('should handle enhancement errors gracefully', async () => {
      // Mock enhancement failure
      const spy = jest.spyOn(enhancementEngine as any, 'applyEnhancement')
        .mockRejectedValueOnce(new Error('Enhancement failed'));

      await expect(enhancementEngine.enhanceDocument('mock://image.jpg'))
        .rejects.toThrow('Failed to enhance document intelligently');
      
      spy.mockRestore();
    });
  });

  describe('getPresets', () => {
    it('should return available presets', () => {
      const presets = enhancementEngine.getPresets();
      
      expect(Array.isArray(presets)).toBe(true);
      expect(presets.length).toBeGreaterThan(0);
      
      presets.forEach(preset => {
        expect(preset.id).toBeDefined();
        expect(preset.name).toBeDefined();
        expect(preset.description).toBeDefined();
        expect(preset.settings).toBeDefined();
        expect(preset.settings.contrast).toBeGreaterThan(0);
        expect(preset.settings.brightness).toBeDefined();
        expect(preset.settings.saturation).toBeGreaterThan(0);
        expect(preset.settings.grayscale).toBeGreaterThanOrEqual(0);
        expect(preset.settings.grayscale).toBeLessThanOrEqual(1);
        expect(typeof preset.settings.sharpen).toBe('boolean');
        expect(typeof preset.settings.removeShadows).toBe('boolean');
        expect(typeof preset.settings.autoColorDetection).toBe('boolean');
      });
    });
  });

  describe('getEnhancementHistory', () => {
    it('should return enhancement history', () => {
      const history = enhancementEngine.getEnhancementHistory();
      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe('getUserPreferences', () => {
    it('should return user preferences', () => {
      const preferences = enhancementEngine.getUserPreferences();
      expect(preferences).toBeInstanceOf(Map);
    });
  });

  describe('resetUserPreferences', () => {
    it('should reset user preferences', () => {
      enhancementEngine.resetUserPreferences();
      const preferences = enhancementEngine.getUserPreferences();
      expect(preferences.size).toBe(0);
    });
  });

  describe('getEnhancementStats', () => {
    it('should return enhancement statistics', () => {
      const stats = enhancementEngine.getEnhancementStats();
      
      expect(stats).toBeDefined();
      expect(typeof stats.totalEnhancements).toBe('number');
      expect(typeof stats.averageImprovement).toBe('number');
      expect(typeof stats.mostUsedPreset).toBe('string');
      expect(typeof stats.documentTypeDistribution).toBe('object');
    });

    it('should return zero stats when no enhancements', () => {
      const newEngine = new (IntelligentEnhancementEngine as any)();
      const stats = newEngine.getEnhancementStats();
      
      expect(stats.totalEnhancements).toBe(0);
      expect(stats.averageImprovement).toBe(0);
      expect(stats.mostUsedPreset).toBe('none');
      expect(Object.keys(stats.documentTypeDistribution).length).toBe(0);
    });
  });

  describe('document type detection', () => {
    it('should detect different document types', async () => {
      // Test document type detection through the main enhanceDocument method
      const result = await enhancementEngine.enhanceDocument('mock://document.jpg');
      
      expect(result).toBeDefined();
      expect(result.documentType).toBeDefined();
      expect(result.documentType.id).toBeDefined();
      expect(result.documentType.name).toBeDefined();
      expect(result.documentType.confidence).toBeGreaterThanOrEqual(0);
      expect(result.documentType.confidence).toBeLessThanOrEqual(1);
      expect(result.documentType.characteristics).toBeDefined();
      expect(result.documentType.characteristics.hasText).toBeDefined();
      expect(result.documentType.characteristics.hasImages).toBeDefined();
      expect(result.documentType.characteristics.hasTables).toBeDefined();
      expect(result.documentType.characteristics.isColor).toBeDefined();
      expect(result.documentType.characteristics.isHandwritten).toBeDefined();
    });

    it('should select appropriate presets based on document type', async () => {
      const result = await enhancementEngine.enhanceDocument('mock://document.jpg');
      
      expect(result.appliedPreset).toBeDefined();
      expect(result.appliedPreset.id).toBeDefined();
      expect(result.appliedPreset.name).toBeDefined();
      expect(result.appliedPreset.description).toBeDefined();
      expect(result.appliedPreset.settings).toBeDefined();
    });

    it('should provide quality improvement metrics', async () => {
      const result = await enhancementEngine.enhanceDocument('mock://document.jpg');
      
      expect(result.qualityImprovement).toBeGreaterThanOrEqual(0);
      expect(result.qualityImprovement).toBeLessThanOrEqual(1);
      expect(result.processingTime).toBeGreaterThan(0);
    });
  });
});