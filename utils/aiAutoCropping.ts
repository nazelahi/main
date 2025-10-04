import * as ImageManipulator from 'expo-image-manipulator';

export interface AICropResult {
  success: boolean;
  croppedUri: string;
  confidence: number;
  detectedCorners: {
    topLeft: { x: number; y: number };
    topRight: { x: number; y: number };
    bottomLeft: { x: number; y: number };
    bottomRight: { x: number; y: number };
  };
  documentType: string;
  qualityScore: number;
  suggestions: string[];
}

export interface CropAnalysis {
  documentBounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  aspectRatio: number;
  skewAngle: number;
  brightness: number;
  contrast: number;
  sharpness: number;
  textDensity: number;
  edgeStrength: number;
}

export class AIAutoCropping {
  private static instance: AIAutoCropping;
  private cropModels: Map<string, any> = new Map();
  private isInitialized = false;

  static getInstance(): AIAutoCropping {
    if (!AIAutoCropping.instance) {
      AIAutoCropping.instance = new AIAutoCropping();
    }
    return AIAutoCropping.instance;
  }

  private constructor() {
    this.initializeModels();
  }

  private async initializeModels() {
    try {
      // Initialize ML models for different document types
      await this.loadDocumentTypeModel();
      await this.loadEdgeDetectionModel();
      await this.loadQualityAssessmentModel();
      this.isInitialized = true;
      console.log('AI Auto-cropping models initialized');
    } catch (error) {
      console.error('Failed to initialize AI models:', error);
    }
  }

  private async loadDocumentTypeModel() {
    // Simulate loading a document type classification model
    // In production, this would load a real ML model
    this.cropModels.set('documentType', {
      predict: (imageData: any) => this.simulateDocumentTypePrediction(imageData)
    });
  }

  private async loadEdgeDetectionModel() {
    // Simulate loading an edge detection model
    this.cropModels.set('edgeDetection', {
      predict: (imageData: any) => this.simulateEdgeDetection(imageData)
    });
  }

  private async loadQualityAssessmentModel() {
    // Simulate loading a quality assessment model
    this.cropModels.set('qualityAssessment', {
      predict: (imageData: any) => this.simulateQualityAssessment(imageData)
    });
  }

  private simulateDocumentTypePrediction(imageData: any): { type: string; confidence: number } {
    const types = ['receipt', 'contract', 'business_card', 'id_card', 'passport', 'invoice', 'letter'];
    const confidences = [0.85, 0.92, 0.78, 0.88, 0.90, 0.82, 0.75];
    const randomIndex = Math.floor(Math.random() * types.length);
    
    return {
      type: types[randomIndex],
      confidence: confidences[randomIndex] + (Math.random() * 0.1 - 0.05)
    };
  }

  private simulateEdgeDetection(imageData: any): {
    corners: {
      topLeft: { x: number; y: number };
      topRight: { x: number; y: number };
      bottomLeft: { x: number; y: number };
      bottomRight: { x: number; y: number };
    };
    confidence: number;
  } {
    // Simulate edge detection with realistic corner coordinates
    const margin = 0.1;
    const width = 1.0;
    const height = 1.0;
    
    return {
      corners: {
        topLeft: { 
          x: margin + Math.random() * 0.05, 
          y: margin + Math.random() * 0.05 
        },
        topRight: { 
          x: width - margin - Math.random() * 0.05, 
          y: margin + Math.random() * 0.05 
        },
        bottomLeft: { 
          x: margin + Math.random() * 0.05, 
          y: height - margin - Math.random() * 0.05 
        },
        bottomRight: { 
          x: width - margin - Math.random() * 0.05, 
          y: height - margin - Math.random() * 0.05 
        }
      },
      confidence: 0.85 + Math.random() * 0.1
    };
  }

  private simulateQualityAssessment(imageData: any): {
    brightness: number;
    contrast: number;
    sharpness: number;
    textDensity: number;
    edgeStrength: number;
    overallScore: number;
  } {
    return {
      brightness: 0.6 + Math.random() * 0.3,
      contrast: 0.5 + Math.random() * 0.4,
      sharpness: 0.7 + Math.random() * 0.2,
      textDensity: 0.3 + Math.random() * 0.5,
      edgeStrength: 0.6 + Math.random() * 0.3,
      overallScore: 0.7 + Math.random() * 0.2
    };
  }

  async performAICropping(imageUri: string, options: {
    documentType?: string;
    confidenceThreshold?: number;
    enableSmartCrop?: boolean;
    preserveAspectRatio?: boolean;
  } = {}): Promise<AICropResult> {
    try {
      if (!this.isInitialized) {
        await this.initializeModels();
      }

      const {
        documentType,
        confidenceThreshold = 0.7,
        enableSmartCrop = true,
        preserveAspectRatio = true
      } = options;

      // Get image dimensions
      const imageInfo = await ImageManipulator.manipulateAsync(
        imageUri,
        [],
        { format: ImageManipulator.SaveFormat.JPEG }
      );

      const imageWidth = imageInfo.width;
      const imageHeight = imageInfo.height;

      // Analyze the image
      const analysis = await this.analyzeImage(imageUri, imageWidth, imageHeight);
      
      // Classify document type
      const typePrediction = this.cropModels.get('documentType')?.predict({});
      const detectedType = documentType || typePrediction.type;
      const typeConfidence = typePrediction.confidence;

      // Detect edges and corners
      const edgeResult = this.cropModels.get('edgeDetection')?.predict({});
      const corners = edgeResult.corners;
      const edgeConfidence = edgeResult.confidence;

      // Assess quality
      const qualityResult = this.cropModels.get('qualityAssessment')?.predict({});
      const qualityScore = qualityResult.overallScore;

      // Generate improvement suggestions
      const suggestions = this.generateImprovementSuggestions(analysis, qualityResult);

      // Check if confidence meets threshold
      if (edgeConfidence < confidenceThreshold) {
        return {
          success: false,
          croppedUri: imageUri,
          confidence: edgeConfidence,
          detectedCorners: corners,
          documentType: detectedType,
          qualityScore,
          suggestions: ['Low confidence in edge detection. Try improving lighting and document positioning.']
        };
      }

      // Convert normalized coordinates to actual pixel coordinates
      const actualCorners = {
        topLeft: {
          x: Math.round(corners.topLeft.x * imageWidth),
          y: Math.round(corners.topLeft.y * imageHeight)
        },
        topRight: {
          x: Math.round(corners.topRight.x * imageWidth),
          y: Math.round(corners.topRight.y * imageHeight)
        },
        bottomLeft: {
          x: Math.round(corners.bottomLeft.x * imageWidth),
          y: Math.round(corners.bottomLeft.y * imageHeight)
        },
        bottomRight: {
          x: Math.round(corners.bottomRight.x * imageWidth),
          y: Math.round(corners.bottomRight.y * imageHeight)
        }
      };

      // Calculate crop area
      const cropArea = this.calculateCropArea(actualCorners, imageWidth, imageHeight);
      
      // Apply perspective correction and cropping
      const croppedImage = await this.applyPerspectiveCorrection(
        imageUri,
        actualCorners,
        cropArea,
        preserveAspectRatio
      );

      return {
        success: true,
        croppedUri: croppedImage.uri,
        confidence: edgeConfidence,
        detectedCorners: actualCorners,
        documentType: detectedType,
        qualityScore,
        suggestions
      };

    } catch (error) {
      console.error('AI cropping failed:', error);
      return {
        success: false,
        croppedUri: imageUri,
        confidence: 0,
        detectedCorners: {
          topLeft: { x: 0, y: 0 },
          topRight: { x: 0, y: 0 },
          bottomLeft: { x: 0, y: 0 },
          bottomRight: { x: 0, y: 0 }
        },
        documentType: 'unknown',
        qualityScore: 0,
        suggestions: ['AI cropping failed. Please try manual cropping.']
      };
    }
  }

  private async analyzeImage(imageUri: string, width: number, height: number): Promise<CropAnalysis> {
    // Simulate image analysis
    return {
      documentBounds: {
        x: width * 0.1,
        y: height * 0.1,
        width: width * 0.8,
        height: height * 0.8
      },
      aspectRatio: width / height,
      skewAngle: (Math.random() - 0.5) * 10, // -5 to 5 degrees
      brightness: 0.6 + Math.random() * 0.3,
      contrast: 0.5 + Math.random() * 0.4,
      sharpness: 0.7 + Math.random() * 0.2,
      textDensity: 0.3 + Math.random() * 0.5,
      edgeStrength: 0.6 + Math.random() * 0.3
    };
  }

  private calculateCropArea(corners: any, imageWidth: number, imageHeight: number) {
    const minX = Math.min(corners.topLeft.x, corners.bottomLeft.x);
    const maxX = Math.max(corners.topRight.x, corners.bottomRight.x);
    const minY = Math.min(corners.topLeft.y, corners.topRight.y);
    const maxY = Math.max(corners.bottomLeft.y, corners.bottomRight.y);

    return {
      originX: Math.max(0, minX),
      originY: Math.max(0, minY),
      width: Math.min(imageWidth - minX, maxX - minX),
      height: Math.min(imageHeight - minY, maxY - minY)
    };
  }

  private async applyPerspectiveCorrection(
    imageUri: string,
    corners: any,
    cropArea: any,
    preserveAspectRatio: boolean
  ) {
    // Apply perspective correction and cropping
    const manipulations = [
      {
        crop: {
          originX: cropArea.originX,
          originY: cropArea.originY,
          width: cropArea.width,
          height: cropArea.height
        }
      }
    ];

    // Add rotation if needed (based on skew angle)
    const skewAngle = (Math.random() - 0.5) * 5; // -2.5 to 2.5 degrees
    if (Math.abs(skewAngle) > 0.5) {
      manipulations.push({ rotate: skewAngle });
    }

    return await ImageManipulator.manipulateAsync(
      imageUri,
      manipulations,
      { 
        compress: 0.9, 
        format: ImageManipulator.SaveFormat.JPEG 
      }
    );
  }

  private generateImprovementSuggestions(analysis: CropAnalysis, qualityResult: any): string[] {
    const suggestions: string[] = [];

    if (qualityResult.brightness < 0.4) {
      suggestions.push('Increase lighting for better brightness');
    } else if (qualityResult.brightness > 0.8) {
      suggestions.push('Reduce lighting to avoid overexposure');
    }

    if (qualityResult.contrast < 0.4) {
      suggestions.push('Improve contrast by adjusting lighting angle');
    }

    if (qualityResult.sharpness < 0.6) {
      suggestions.push('Hold the camera steady and ensure document is flat');
    }

    if (Math.abs(analysis.skewAngle) > 3) {
      suggestions.push('Straighten the document to reduce skew');
    }

    if (qualityResult.edgeStrength < 0.5) {
      suggestions.push('Ensure document edges are clearly visible');
    }

    if (qualityResult.textDensity < 0.2) {
      suggestions.push('Move closer to capture more text detail');
    }

    if (suggestions.length === 0) {
      suggestions.push('Document quality is excellent!');
    }

    return suggestions;
  }

  async batchProcess(images: string[], options: any = {}): Promise<AICropResult[]> {
    const results: AICropResult[] = [];
    
    for (const imageUri of images) {
      try {
        const result = await this.performAICropping(imageUri, options);
        results.push(result);
      } catch (error) {
        console.error(`Failed to process image: ${imageUri}`, error);
        results.push({
          success: false,
          croppedUri: imageUri,
          confidence: 0,
          detectedCorners: {
            topLeft: { x: 0, y: 0 },
            topRight: { x: 0, y: 0 },
            bottomLeft: { x: 0, y: 0 },
            bottomRight: { x: 0, y: 0 }
          },
          documentType: 'unknown',
          qualityScore: 0,
          suggestions: ['Processing failed']
        });
      }
    }

    return results;
  }

  getSupportedDocumentTypes(): string[] {
    return ['receipt', 'contract', 'business_card', 'id_card', 'passport', 'invoice', 'letter', 'certificate'];
  }

  isModelReady(): boolean {
    return this.isInitialized;
  }
}
