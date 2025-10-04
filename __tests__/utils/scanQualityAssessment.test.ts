// Scan Quality Assessment Tests
import ScanQualityAssessment, { QualityAssessment, ScanGuidance } from '../../utils/scanQualityAssessment';

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

describe('ScanQualityAssessment', () => {
  let qualityAssessment: ScanQualityAssessment;

  beforeEach(() => {
    qualityAssessment = ScanQualityAssessment.getInstance();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = ScanQualityAssessment.getInstance();
      const instance2 = ScanQualityAssessment.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('assessScanQuality', () => {
    it('should assess quality successfully', async () => {
      const mockCorners = {
        topLeft: { x: 50, y: 50 },
        topRight: { x: 300, y: 50 },
        bottomLeft: { x: 50, y: 400 },
        bottomRight: { x: 300, y: 400 }
      };

      const assessment = await qualityAssessment.assessScanQuality('mock://image.jpg', mockCorners);
      
      expect(assessment).toBeDefined();
      expect(assessment.metrics).toBeDefined();
      expect(assessment.metrics.blurScore).toBeGreaterThanOrEqual(0);
      expect(assessment.metrics.blurScore).toBeLessThanOrEqual(1);
      expect(assessment.metrics.lightingScore).toBeGreaterThanOrEqual(0);
      expect(assessment.metrics.lightingScore).toBeLessThanOrEqual(1);
      expect(assessment.metrics.alignmentScore).toBeGreaterThanOrEqual(0);
      expect(assessment.metrics.alignmentScore).toBeLessThanOrEqual(1);
      expect(assessment.metrics.contrastScore).toBeGreaterThanOrEqual(0);
      expect(assessment.metrics.contrastScore).toBeLessThanOrEqual(1);
      expect(assessment.metrics.sharpnessScore).toBeGreaterThanOrEqual(0);
      expect(assessment.metrics.sharpnessScore).toBeLessThanOrEqual(1);
      expect(assessment.metrics.noiseScore).toBeGreaterThanOrEqual(0);
      expect(assessment.metrics.noiseScore).toBeLessThanOrEqual(1);
      expect(assessment.metrics.overallScore).toBeGreaterThanOrEqual(0);
      expect(assessment.metrics.overallScore).toBeLessThanOrEqual(1);
      
      expect(assessment.issues).toBeDefined();
      expect(Array.isArray(assessment.issues.critical)).toBe(true);
      expect(Array.isArray(assessment.issues.warning)).toBe(true);
      expect(Array.isArray(assessment.issues.info)).toBe(true);
      
      expect(assessment.recommendations).toBeDefined();
      expect(Array.isArray(assessment.recommendations.immediate)).toBe(true);
      expect(Array.isArray(assessment.recommendations.suggested)).toBe(true);
      expect(Array.isArray(assessment.recommendations.optional)).toBe(true);
      
      expect(['A', 'B', 'C', 'D', 'F']).toContain(assessment.grade);
      expect(typeof assessment.isScanReady).toBe('boolean');
      expect(assessment.confidence).toBeGreaterThanOrEqual(0);
      expect(assessment.confidence).toBeLessThanOrEqual(1);
    });

    it('should handle null corners', async () => {
      const assessment = await qualityAssessment.assessScanQuality('mock://image.jpg', undefined);
      
      expect(assessment.metrics.blurScore).toBe(0);
      expect(assessment.metrics.lightingScore).toBe(0);
      expect(assessment.metrics.alignmentScore).toBe(0);
      expect(assessment.metrics.contrastScore).toBe(0);
      expect(assessment.metrics.sharpnessScore).toBe(0);
      expect(assessment.metrics.noiseScore).toBe(0);
      expect(assessment.metrics.overallScore).toBe(0);
      expect(assessment.issues.critical).toContain('No document detected');
      expect(assessment.recommendations.immediate).toContain('Position document in frame and try again');
      expect(assessment.grade).toBe('F');
      expect(assessment.isScanReady).toBe(false);
    });

    it('should handle assessment errors gracefully', async () => {
      // Mock assessment failure
      const spy = jest.spyOn(qualityAssessment as any, 'assessBlur')
        .mockRejectedValueOnce(new Error('Assessment failed'));

      const assessment = await qualityAssessment.assessScanQuality('mock://image.jpg', undefined);
      
      expect(assessment.metrics.overallScore).toBe(0);
      expect(assessment.grade).toBe('F');
      expect(assessment.isScanReady).toBe(false);
      
      spy.mockRestore();
    });
  });

  describe('getScanGuidance', () => {
    it('should provide success guidance for ready scans', () => {
      const mockAssessment: QualityAssessment = {
        metrics: {
          blurScore: 0.9,
          lightingScore: 0.9,
          alignmentScore: 0.9,
          contrastScore: 0.9,
          sharpnessScore: 0.9,
          noiseScore: 0.9,
          overallScore: 0.9
        },
        issues: { critical: [], warning: [], info: [] },
        recommendations: { immediate: [], suggested: [], optional: [] },
        grade: 'A',
        isScanReady: true,
        confidence: 0.9
      };

      const guidance = qualityAssessment.getScanGuidance(mockAssessment);
      
      expect(guidance.message).toBe('Document looks great! Ready to scan.');
      expect(guidance.type).toBe('success');
      expect(guidance.priority).toBe('high');
    });

    it('should provide error guidance for critical issues', () => {
      const mockAssessment: QualityAssessment = {
        metrics: {
          blurScore: 0.3,
          lightingScore: 0.3,
          alignmentScore: 0.3,
          contrastScore: 0.3,
          sharpnessScore: 0.3,
          noiseScore: 0.3,
          overallScore: 0.3
        },
        issues: { 
          critical: ['Image is severely blurred'], 
          warning: [], 
          info: [] 
        },
        recommendations: { 
          immediate: ['Hold device steady and ensure document is in focus'], 
          suggested: [], 
          optional: [] 
        },
        grade: 'F',
        isScanReady: false,
        confidence: 0.3
      };

      const guidance = qualityAssessment.getScanGuidance(mockAssessment);
      
      expect(guidance.message).toBe('Image is severely blurred');
      expect(guidance.type).toBe('error');
      expect(guidance.action).toBe('Hold device steady and ensure document is in focus');
      expect(guidance.priority).toBe('high');
    });

    it('should provide warning guidance for warning issues', () => {
      const mockAssessment: QualityAssessment = {
        metrics: {
          blurScore: 0.6,
          lightingScore: 0.6,
          alignmentScore: 0.6,
          contrastScore: 0.6,
          sharpnessScore: 0.6,
          noiseScore: 0.6,
          overallScore: 0.6
        },
        issues: { 
          critical: [], 
          warning: ['Image appears blurry'], 
          info: [] 
        },
        recommendations: { 
          immediate: [], 
          suggested: ['Hold device steady and wait for auto-focus'], 
          optional: [] 
        },
        grade: 'D',
        isScanReady: true,
        confidence: 0.6
      };

      const guidance = qualityAssessment.getScanGuidance(mockAssessment);
      
      expect(guidance.message).toBe('Image appears blurry');
      expect(guidance.type).toBe('warning');
      expect(guidance.action).toBe('Hold device steady and wait for auto-focus');
      expect(guidance.priority).toBe('medium');
    });
  });

  describe('getAssessmentHistory', () => {
    it('should return assessment history', () => {
      const history = qualityAssessment.getAssessmentHistory();
      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe('getQualityStats', () => {
    it('should return quality statistics', () => {
      const stats = qualityAssessment.getQualityStats();
      
      expect(stats).toBeDefined();
      expect(typeof stats.averageScore).toBe('number');
      expect(typeof stats.gradeDistribution).toBe('object');
      expect(Array.isArray(stats.commonIssues)).toBe(true);
      expect(typeof stats.improvementTrend).toBe('number');
    });

    it('should return zero stats when no assessments', () => {
      const newAssessment = new (ScanQualityAssessment as any)();
      const stats = newAssessment.getQualityStats();
      
      expect(stats.averageScore).toBe(0);
      expect(Object.keys(stats.gradeDistribution).length).toBe(0);
      expect(stats.commonIssues.length).toBe(0);
      expect(stats.improvementTrend).toBe(0);
    });
  });
});