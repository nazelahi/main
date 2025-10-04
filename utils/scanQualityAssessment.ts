import { Dimensions } from 'react-native';
// import * as ImageManipulator from 'expo-image-manipulator';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface QualityMetrics {
  blurScore: number;
  lightingScore: number;
  alignmentScore: number;
  contrastScore: number;
  sharpnessScore: number;
  noiseScore: number;
  overallScore: number;
}

export interface QualityIssues {
  critical: string[];
  warning: string[];
  info: string[];
}

export interface QualityRecommendations {
  immediate: string[];
  suggested: string[];
  optional: string[];
}

export interface QualityAssessment {
  metrics: QualityMetrics;
  issues: QualityIssues;
  recommendations: QualityRecommendations;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  isScanReady: boolean;
  confidence: number;
}

export interface ScanGuidance {
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  action?: string;
  priority: 'high' | 'medium' | 'low';
}

export class ScanQualityAssessment {
  private static instance: ScanQualityAssessment;
  private assessmentHistory: QualityAssessment[] = [];
  private qualityThresholds = {
    excellent: 0.9,
    good: 0.8,
    fair: 0.7,
    poor: 0.6,
    critical: 0.5
  };

  static getInstance(): ScanQualityAssessment {
    if (!ScanQualityAssessment.instance) {
      ScanQualityAssessment.instance = new ScanQualityAssessment();
    }
    return ScanQualityAssessment.instance;
  }

  /**
   * Perform comprehensive quality assessment
   */
  async assessScanQuality(
    imageUri: string, 
    corners?: { topLeft: { x: number; y: number }, topRight: { x: number; y: number }, bottomLeft: { x: number; y: number }, bottomRight: { x: number; y: number } }
  ): Promise<QualityAssessment> {
    try {
      console.log('Starting comprehensive quality assessment...');
      
      // If no corners provided, return zero quality assessment
      if (!corners) {
        return {
          metrics: {
            blurScore: 0,
            lightingScore: 0,
            alignmentScore: 0,
            contrastScore: 0,
            sharpnessScore: 0,
            noiseScore: 0,
            overallScore: 0
          },
          issues: {
            critical: ['No document detected'],
            warning: [],
            info: []
          },
          recommendations: {
            immediate: ['Position document in frame and try again'],
            suggested: [],
            optional: []
          },
          grade: 'F',
          isScanReady: false,
          confidence: 0
        };
      }
      
      // Analyze various quality metrics
      const blurScore = await this.assessBlur(imageUri);
      const lightingScore = await this.assessLighting(imageUri);
      const alignmentScore = this.assessAlignment(corners);
      const contrastScore = await this.assessContrast(imageUri);
      const sharpnessScore = await this.assessSharpness(imageUri);
      const noiseScore = await this.assessNoise(imageUri);

      const metrics: QualityMetrics = {
        blurScore,
        lightingScore,
        alignmentScore,
        contrastScore,
        sharpnessScore,
        noiseScore,
        overallScore: (blurScore + lightingScore + alignmentScore + contrastScore + sharpnessScore + noiseScore) / 6
      };

      // Identify issues
      const issues = this.identifyIssues(metrics);

      // Generate recommendations
      const recommendations = this.generateRecommendations(metrics, issues);

      // Determine grade and readiness
      const grade = this.calculateGrade(metrics.overallScore);
      const isScanReady = this.determineScanReadiness(metrics, issues);
      const confidence = this.calculateConfidence(metrics);

      const assessment: QualityAssessment = {
        metrics,
        issues,
        recommendations,
        grade,
        isScanReady,
        confidence
      };

      // Store assessment history
      this.assessmentHistory.push(assessment);
      if (this.assessmentHistory.length > 100) {
        this.assessmentHistory.shift();
      }

      console.log('Quality assessment completed:', {
        overallScore: metrics.overallScore,
        grade,
        isScanReady,
        issuesCount: issues.critical.length + issues.warning.length
      });

      return assessment;
    } catch (error) {
      console.error('Quality assessment failed:', error);
      return this.getDefaultAssessment();
    }
  }

  /**
   * Assess image blur using simulated analysis
   */
  private async assessBlur(imageUri: string): Promise<number> {
    // Simulate blur detection analysis
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Simulate edge detection and blur calculation
    const blurLevel = Math.random() * 0.4 + 0.1; // 0.1 to 0.5
    const blurScore = Math.max(0, 1 - blurLevel * 2); // Convert to score (0-1)
    
    return Math.min(blurScore, 1.0);
  }

  /**
   * Assess lighting quality
   */
  private async assessLighting(imageUri: string): Promise<number> {
    // Simulate lighting analysis
    await new Promise(resolve => setTimeout(resolve, 80));
    
    // Simulate brightness and contrast analysis
    const brightness = Math.random() * 0.6 + 0.2; // 0.2 to 0.8
    const evenness = Math.random() * 0.4 + 0.6; // 0.6 to 1.0
    
    // Calculate lighting score
    const brightnessScore = Math.abs(brightness - 0.5) < 0.2 ? 1.0 : 0.7;
    const evennessScore = evenness;
    
    return (brightnessScore + evennessScore) / 2;
  }

  /**
   * Assess document alignment
   */
  private assessAlignment(corners: any): number {
    const { topLeft, topRight, bottomLeft, bottomRight } = corners;
    
    // Check horizontal alignment
    const topAlignment = Math.abs(topLeft.y - topRight.y) / SCREEN_HEIGHT;
    const bottomAlignment = Math.abs(bottomLeft.y - bottomRight.y) / SCREEN_HEIGHT;
    
    // Check vertical alignment
    const leftAlignment = Math.abs(topLeft.x - bottomLeft.x) / SCREEN_WIDTH;
    const rightAlignment = Math.abs(topRight.x - bottomRight.x) / SCREEN_WIDTH;
    
    // Calculate alignment score
    const avgAlignment = (topAlignment + bottomAlignment + leftAlignment + rightAlignment) / 4;
    return Math.max(0, 1 - avgAlignment * 3);
  }

  /**
   * Assess contrast quality
   */
  private async assessContrast(imageUri: string): Promise<number> {
    // Simulate contrast analysis
    await new Promise(resolve => setTimeout(resolve, 60));
    
    // Simulate histogram analysis
    const contrast = Math.random() * 0.5 + 0.5; // 0.5 to 1.0
    return Math.min(contrast, 1.0);
  }

  /**
   * Assess image sharpness
   */
  private async assessSharpness(imageUri: string): Promise<number> {
    // Simulate sharpness analysis
    await new Promise(resolve => setTimeout(resolve, 70));
    
    // Simulate edge sharpness calculation
    const sharpness = Math.random() * 0.4 + 0.6; // 0.6 to 1.0
    return Math.min(sharpness, 1.0);
  }

  /**
   * Assess image noise level
   */
  private async assessNoise(imageUri: string): Promise<number> {
    // Simulate noise analysis
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Simulate noise level calculation (inverted - higher noise = lower score)
    const noiseLevel = Math.random() * 0.3 + 0.1; // 0.1 to 0.4
    return Math.max(0, 1 - noiseLevel * 2);
  }

  /**
   * Identify quality issues based on metrics
   */
  private identifyIssues(metrics: QualityMetrics): QualityIssues {
    const issues: QualityIssues = {
      critical: [],
      warning: [],
      info: []
    };

    // Critical issues
    if (metrics.blurScore < this.qualityThresholds.critical) {
      issues.critical.push('Image is severely blurred');
    }
    if (metrics.lightingScore < this.qualityThresholds.critical) {
      issues.critical.push('Extremely poor lighting conditions');
    }
    if (metrics.overallScore < this.qualityThresholds.critical) {
      issues.critical.push('Overall quality is too poor for scanning');
    }

    // Warning issues
    if (metrics.blurScore < this.qualityThresholds.poor && metrics.blurScore >= this.qualityThresholds.critical) {
      issues.warning.push('Image appears blurry');
    }
    if (metrics.lightingScore < this.qualityThresholds.poor && metrics.lightingScore >= this.qualityThresholds.critical) {
      issues.warning.push('Poor lighting detected');
    }
    if (metrics.alignmentScore < this.qualityThresholds.poor) {
      issues.warning.push('Document not well aligned');
    }
    if (metrics.contrastScore < this.qualityThresholds.poor) {
      issues.warning.push('Low contrast detected');
    }
    if (metrics.sharpnessScore < this.qualityThresholds.poor) {
      issues.warning.push('Image lacks sharpness');
    }
    if (metrics.noiseScore < this.qualityThresholds.poor) {
      issues.warning.push('High noise level detected');
    }

    // Info issues
    if (metrics.blurScore < this.qualityThresholds.fair && metrics.blurScore >= this.qualityThresholds.poor) {
      issues.info.push('Slight blur detected');
    }
    if (metrics.lightingScore < this.qualityThresholds.fair && metrics.lightingScore >= this.qualityThresholds.poor) {
      issues.info.push('Lighting could be improved');
    }
    if (metrics.alignmentScore < this.qualityThresholds.fair) {
      issues.info.push('Document alignment could be better');
    }

    return issues;
  }

  /**
   * Generate recommendations based on issues
   */
  private generateRecommendations(metrics: QualityMetrics, issues: QualityIssues): QualityRecommendations {
    const recommendations: QualityRecommendations = {
      immediate: [],
      suggested: [],
      optional: []
    };

    // Immediate recommendations (critical issues)
    if (issues.critical.includes('Image is severely blurred')) {
      recommendations.immediate.push('Hold device steady and ensure document is in focus');
    }
    if (issues.critical.includes('Extremely poor lighting conditions')) {
      recommendations.immediate.push('Move to better lighting or use flash');
    }
    if (issues.critical.includes('Overall quality is too poor for scanning')) {
      recommendations.immediate.push('Reposition document and try again');
    }

    // Suggested recommendations (warning issues)
    if (issues.warning.includes('Image appears blurry')) {
      recommendations.suggested.push('Hold device steady and wait for auto-focus');
    }
    if (issues.warning.includes('Poor lighting detected')) {
      recommendations.suggested.push('Adjust lighting or use flash');
    }
    if (issues.warning.includes('Document not well aligned')) {
      recommendations.suggested.push('Align document edges with the frame');
    }
    if (issues.warning.includes('Low contrast detected')) {
      recommendations.suggested.push('Try adjusting lighting or use enhancement');
    }
    if (issues.warning.includes('Image lacks sharpness')) {
      recommendations.suggested.push('Ensure document is flat and well-lit');
    }
    if (issues.warning.includes('High noise level detected')) {
      recommendations.suggested.push('Use better lighting to reduce noise');
    }

    // Optional recommendations (info issues)
    if (issues.info.includes('Slight blur detected')) {
      recommendations.optional.push('Consider taking another shot for better quality');
    }
    if (issues.info.includes('Lighting could be improved')) {
      recommendations.optional.push('Try different lighting angle');
    }
    if (issues.info.includes('Document alignment could be better')) {
      recommendations.optional.push('Fine-tune document position');
    }

    return recommendations;
  }

  /**
   * Calculate quality grade
   */
  private calculateGrade(overallScore: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (overallScore >= this.qualityThresholds.excellent) return 'A';
    if (overallScore >= this.qualityThresholds.good) return 'B';
    if (overallScore >= this.qualityThresholds.fair) return 'C';
    if (overallScore >= this.qualityThresholds.poor) return 'D';
    return 'F';
  }

  /**
   * Determine if scan is ready
   */
  private determineScanReadiness(metrics: QualityMetrics, issues: QualityIssues): boolean {
    // Don't scan if there are critical issues
    if (issues.critical.length > 0) return false;
    
    // Don't scan if overall score is too low
    if (metrics.overallScore < this.qualityThresholds.poor) return false;
    
    // Don't scan if too many warning issues
    if (issues.warning.length > 3) return false;
    
    return true;
  }

  /**
   * Calculate confidence in assessment
   */
  private calculateConfidence(metrics: QualityMetrics): number {
    // Confidence based on how consistent the metrics are
    const scores = [
      metrics.blurScore,
      metrics.lightingScore,
      metrics.alignmentScore,
      metrics.contrastScore,
      metrics.sharpnessScore,
      metrics.noiseScore
    ];
    
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Lower standard deviation = higher confidence
    const confidence = Math.max(0, 1 - standardDeviation);
    return Math.min(confidence, 1.0);
  }

  /**
   * Get real-time scan guidance
   */
  getScanGuidance(assessment: QualityAssessment): ScanGuidance {
    // Check critical issues first
    if (assessment.issues.critical.length > 0) {
      return {
        message: assessment.issues.critical[0],
        type: 'error',
        action: assessment.recommendations.immediate[0] || 'Try again',
        priority: 'high'
      };
    }

    // Check warning issues
    if (assessment.issues.warning.length > 0) {
      return {
        message: assessment.issues.warning[0],
        type: 'warning',
        action: assessment.recommendations.suggested[0] || 'Adjust position',
        priority: 'medium'
      };
    }

    // If scan is ready
    if (assessment.isScanReady) {
      return {
        message: 'Document looks great! Ready to scan.',
        type: 'success',
        priority: 'high'
      };
    }

    return {
      message: 'Position document in frame for scanning',
      type: 'info',
      priority: 'low'
    };
  }

  /**
   * Get default assessment for errors
   */
  private getDefaultAssessment(): QualityAssessment {
    return {
      metrics: {
        blurScore: 0,
        lightingScore: 0,
        alignmentScore: 0,
        contrastScore: 0,
        sharpnessScore: 0,
        noiseScore: 0,
        overallScore: 0
      },
      issues: {
        critical: ['Unable to assess quality'],
        warning: [],
        info: []
      },
      recommendations: {
        immediate: ['Try scanning again'],
        suggested: [],
        optional: []
      },
      grade: 'F',
      isScanReady: false,
      confidence: 0
    };
  }

  /**
   * Get assessment history
   */
  getAssessmentHistory(): QualityAssessment[] {
    return [...this.assessmentHistory];
  }

  /**
   * Get quality statistics
   */
  getQualityStats(): {
    averageScore: number;
    gradeDistribution: Record<string, number>;
    commonIssues: string[];
    improvementTrend: number;
  } {
    if (this.assessmentHistory.length === 0) {
      return {
        averageScore: 0,
        gradeDistribution: {},
        commonIssues: [],
        improvementTrend: 0
      };
    }

    const averageScore = this.assessmentHistory.reduce(
      (sum, assessment) => sum + assessment.metrics.overallScore, 0
    ) / this.assessmentHistory.length;

    const gradeDistribution: Record<string, number> = {};
    this.assessmentHistory.forEach(assessment => {
      gradeDistribution[assessment.grade] = (gradeDistribution[assessment.grade] || 0) + 1;
    });

    const allIssues = this.assessmentHistory.flatMap(assessment => [
      ...assessment.issues.critical,
      ...assessment.issues.warning,
      ...assessment.issues.info
    ]);

    const issueCounts = new Map<string, number>();
    allIssues.forEach(issue => {
      issueCounts.set(issue, (issueCounts.get(issue) || 0) + 1);
    });

    const commonIssues = Array.from(issueCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([issue]) => issue);

    // Calculate improvement trend (comparing first half to second half)
    const half = Math.floor(this.assessmentHistory.length / 2);
    const firstHalf = this.assessmentHistory.slice(0, half);
    const secondHalf = this.assessmentHistory.slice(half);

    const firstHalfAvg = firstHalf.reduce((sum, a) => sum + a.metrics.overallScore, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, a) => sum + a.metrics.overallScore, 0) / secondHalf.length;
    const improvementTrend = secondHalfAvg - firstHalfAvg;

    return {
      averageScore,
      gradeDistribution,
      commonIssues,
      improvementTrend
    };
  }
}

export default ScanQualityAssessment;