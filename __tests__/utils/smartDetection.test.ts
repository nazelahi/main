// Smart Detection Tests
import SmartDetectionEngine, { DetectionResult, ScanQualityMetrics } from '../../utils/smartDetection';

// Mock React Native Dimensions
jest.mock('react-native', () => ({
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 812 }))
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

describe('SmartDetectionEngine', () => {
  let detectionEngine: SmartDetectionEngine;

  beforeEach(() => {
    detectionEngine = SmartDetectionEngine.getInstance();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = SmartDetectionEngine.getInstance();
      const instance2 = SmartDetectionEngine.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('detectDocument', () => {
    it('should detect document successfully', async () => {
      const result = await detectionEngine.detectDocument('mock://image.jpg');
      
      expect(result).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.quality).toBeGreaterThanOrEqual(0);
      expect(result.quality).toBeLessThanOrEqual(1);
      expect(result.isStable).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('should return null corners when confidence is low', async () => {
      // Mock low confidence scenario
      const spy = jest.spyOn(detectionEngine as any, 'analyzeImage')
        .mockResolvedValueOnce({
          confidence: 0.3, // Below threshold
          edges: [],
          contours: [],
          lighting: 0.5
        });

      const result = await detectionEngine.detectDocument('mock://image.jpg');
      
      expect(result.corners).toBeNull();
      expect(result.confidence).toBe(0.3);
      
      spy.mockRestore();
    });

    it('should handle detection errors gracefully', async () => {
      const spy = jest.spyOn(detectionEngine as any, 'analyzeImage')
        .mockRejectedValueOnce(new Error('Detection failed'));

      const result = await detectionEngine.detectDocument('mock://image.jpg');
      
      expect(result.corners).toBeNull();
      expect(result.confidence).toBe(0);
      expect(result.quality).toBe(0);
      expect(result.isStable).toBe(false);
      expect(result.recommendations).toContain('Detection failed. Please try again.');
      
      spy.mockRestore();
    });
  });

  describe('assessQuality', () => {
    it('should assess quality with valid corners', async () => {
      const mockCorners = {
        topLeft: { x: 50, y: 50 },
        topRight: { x: 300, y: 50 },
        bottomLeft: { x: 50, y: 400 },
        bottomRight: { x: 300, y: 400 }
      };

      const quality = await detectionEngine.assessQuality('mock://image.jpg', mockCorners);
      
      expect(quality).toBeDefined();
      expect(quality.blurScore).toBeGreaterThanOrEqual(0);
      expect(quality.blurScore).toBeLessThanOrEqual(1);
      expect(quality.lightingScore).toBeGreaterThanOrEqual(0);
      expect(quality.lightingScore).toBeLessThanOrEqual(1);
      expect(quality.alignmentScore).toBeGreaterThanOrEqual(0);
      expect(quality.alignmentScore).toBeLessThanOrEqual(1);
      expect(quality.contrastScore).toBeGreaterThanOrEqual(0);
      expect(quality.contrastScore).toBeLessThanOrEqual(1);
      expect(quality.sharpnessScore).toBeGreaterThanOrEqual(0);
      expect(quality.sharpnessScore).toBeLessThanOrEqual(1);
      expect(quality.noiseScore).toBeGreaterThanOrEqual(0);
      expect(quality.noiseScore).toBeLessThanOrEqual(1);
      expect(quality.overallScore).toBeGreaterThanOrEqual(0);
      expect(quality.overallScore).toBeLessThanOrEqual(1);
      expect(Array.isArray(quality.issues)).toBe(true);
      expect(Array.isArray(quality.suggestions)).toBe(true);
    });

    it('should return zero quality for null corners', async () => {
      const quality = await detectionEngine.assessQuality('mock://image.jpg', null);
      
      expect(quality.blurScore).toBe(0);
      expect(quality.lightingScore).toBe(0);
      expect(quality.alignmentScore).toBe(0);
      expect(quality.contrastScore).toBe(0);
      expect(quality.sharpnessScore).toBe(0);
      expect(quality.noiseScore).toBe(0);
      expect(quality.overallScore).toBe(0);
      expect(quality.issues).toContain('No document detected');
      expect(quality.suggestions).toContain('Position document in frame and try again');
    });
  });

  describe('getDetectionHistory', () => {
    it('should return detection history', () => {
      const history = detectionEngine.getDetectionHistory();
      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe('resetHistory', () => {
    it('should reset detection history', () => {
      detectionEngine.resetHistory();
      const history = detectionEngine.getDetectionHistory();
      expect(history.length).toBe(0);
    });
  });
});