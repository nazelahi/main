// AI Features Tests
import { 
  AIDocumentClassifier, 
  SmartOrganizer, 
  AIInsightsGenerator,
  classifyDocument,
  organizeDocuments,
  generateInsights 
} from '../../utils/aiFeatures';
import { DocumentData } from '../../utils/enhancedExport';
import { AdvancedOCRResult } from '../../utils/advancedOCR';

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

describe('AIDocumentClassifier', () => {
  let classifier: AIDocumentClassifier;
  const mockDocument: DocumentData = {
    id: 'doc1',
    uri: 'file://mock/document.jpg',
    title: 'Invoice #12345',
    timestamp: Date.now(),
    metadata: {
      fileSize: 1024,
      dimensions: { width: 1200, height: 1600 },
      quality: 0.8
    }
  };

  const mockOCRResult: AdvancedOCRResult = {
    text: 'Invoice #12345\nAmount: $1,234.56\nDue Date: 12/31/2024\nPayment Terms: Net 30',
    confidence: 0.9,
    boundingBoxes: [],
    language: 'en',
    processingTime: 1000,
    handwriting: {
      text: 'Invoice #12345',
      confidence: 0.8,
      isHandwritten: false,
      boundingBoxes: [],
      language: 'en'
    },
    tables: {
      tables: [],
      confidence: 0,
      processingTime: 0
    },
    structure: {
      paragraphs: ['Invoice #12345', 'Amount: $1,234.56', 'Due Date: 12/31/2024', 'Payment Terms: Net 30'],
      tables: [],
      lists: [],
      headers: [],
      footers: [],
      confidence: 0.8
    },
    entities: [
      { type: 'money', value: '$1,234.56', confidence: 0.95, boundingBox: { x: 0, y: 0, width: 0, height: 0, text: '', confidence: 0 } },
      { type: 'date', value: '12/31/2024', confidence: 0.9, boundingBox: { x: 0, y: 0, width: 0, height: 0, text: '', confidence: 0 } }
    ]
  };

  beforeEach(() => {
    classifier = AIDocumentClassifier.getInstance();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = AIDocumentClassifier.getInstance();
      const instance2 = AIDocumentClassifier.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('initialize', () => {
    it('should initialize successfully', async () => {
      await classifier.initialize();
      expect(classifier).toBeDefined();
    });

    it('should not initialize twice', async () => {
      await classifier.initialize();
      const spy = jest.spyOn(classifier as any, 'getDefaultCategories');
      await classifier.initialize();
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('classifyDocument', () => {
    it('should classify financial documents correctly', async () => {
      const classification = await classifier.classifyDocument(mockDocument, mockOCRResult);
      
      expect(classification).toBeDefined();
      expect(classification.category.id).toBe('financial');
      expect(classification.confidence).toBeGreaterThan(0);
      expect(classification.tags).toContain('invoice');
      expect(classification.priority.level).toBe('high');
      expect(classification.suggestedActions.length).toBeGreaterThan(0);
    });

    it('should classify legal documents correctly', async () => {
      const legalDocument = {
        ...mockDocument,
        title: 'Contract Agreement'
      };

      const legalOCRResult = {
        ...mockOCRResult,
        text: 'Contract Agreement\nThis agreement is between...\nSignature: John Doe'
      };

      const classification = await classifier.classifyDocument(legalDocument, legalOCRResult);
      
      expect(classification.category.id).toBe('legal');
      expect(classification.tags).toContain('contract');
    });

    it('should classify medical documents correctly', async () => {
      const medicalDocument = {
        ...mockDocument,
        title: 'Medical Prescription'
      };

      const medicalOCRResult = {
        ...mockOCRResult,
        text: 'Dr. Smith\nPrescription for Patient John Doe\nMedication: Aspirin 100mg'
      };

      const classification = await classifier.classifyDocument(medicalDocument, medicalOCRResult);
      
      expect(classification.category.id).toBe('medical');
      expect(classification.tags).toContain('medical');
    });

    it('should handle documents without OCR results', async () => {
      const classification = await classifier.classifyDocument(mockDocument);
      
      expect(classification).toBeDefined();
      expect(classification.category).toBeDefined();
      expect(classification.confidence).toBeGreaterThanOrEqual(0);
    });

    it('should generate appropriate suggestions', async () => {
      const classification = await classifier.classifyDocument(mockDocument, mockOCRResult);
      
      expect(classification.suggestedActions.length).toBeGreaterThan(0);
      expect(classification.suggestedActions[0]).toHaveProperty('id');
      expect(classification.suggestedActions[0]).toHaveProperty('title');
      expect(classification.suggestedActions[0]).toHaveProperty('description');
      expect(classification.suggestedActions[0]).toHaveProperty('type');
      expect(classification.suggestedActions[0]).toHaveProperty('priority');
    });
  });

  describe('Error Handling', () => {
    it('should handle classification errors gracefully', async () => {
      // Mock an error in the analysis
      const spy = jest.spyOn(classifier as any, 'analyzeDocumentContent')
        .mockRejectedValueOnce(new Error('Analysis failed'));

      const classification = await classifier.classifyDocument(mockDocument, mockOCRResult);
      
      expect(classification.category.id).toBe('other');
      expect(classification.confidence).toBe(0.1);
      
      spy.mockRestore();
    });
  });
});

describe('SmartOrganizer', () => {
  let organizer: SmartOrganizer;
  const mockDocuments: DocumentData[] = [
    {
      id: 'doc1',
      uri: 'file://mock/invoice1.jpg',
      title: 'Invoice #12345',
      timestamp: Date.now(),
      metadata: { fileSize: 1024, dimensions: { width: 1200, height: 1600 }, quality: 0.8 }
    },
    {
      id: 'doc2',
      uri: 'file://mock/invoice2.jpg',
      title: 'Invoice #12346',
      timestamp: Date.now(),
      metadata: { fileSize: 1024, dimensions: { width: 1200, height: 1600 }, quality: 0.8 }
    },
    {
      id: 'doc3',
      uri: 'file://mock/contract1.jpg',
      title: 'Contract Agreement',
      timestamp: Date.now(),
      metadata: { fileSize: 1024, dimensions: { width: 1200, height: 1600 }, quality: 0.8 }
    }
  ];

  beforeEach(() => {
    organizer = SmartOrganizer.getInstance();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = SmartOrganizer.getInstance();
      const instance2 = SmartOrganizer.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('initialize', () => {
    it('should initialize successfully', async () => {
      await organizer.initialize();
      expect(organizer).toBeDefined();
    });
  });

  describe('organizeDocuments', () => {
    it('should organize documents successfully', async () => {
      const organization = await organizer.organizeDocuments(mockDocuments);
      
      expect(organization).toBeDefined();
      expect(organization.folders).toBeDefined();
      expect(organization.folders.length).toBeGreaterThan(0);
      expect(organization.suggestions).toBeDefined();
      expect(organization.rules).toBeDefined();
      expect(organization.autoSort).toBe(true);
    });

    it('should generate organization suggestions', async () => {
      const organization = await organizer.organizeDocuments(mockDocuments);
      
      expect(organization.suggestions.length).toBeGreaterThan(0);
      expect(organization.suggestions[0]).toHaveProperty('id');
      expect(organization.suggestions[0]).toHaveProperty('type');
      expect(organization.suggestions[0]).toHaveProperty('title');
      expect(organization.suggestions[0]).toHaveProperty('description');
      expect(organization.suggestions[0]).toHaveProperty('confidence');
    });

    it('should create smart folders', async () => {
      const organization = await organizer.organizeDocuments(mockDocuments);
      
      expect(organization.folders.length).toBeGreaterThan(0);
      expect(organization.folders[0]).toHaveProperty('id');
      expect(organization.folders[0]).toHaveProperty('name');
      expect(organization.folders[0]).toHaveProperty('description');
      expect(organization.folders[0]).toHaveProperty('icon');
      expect(organization.folders[0]).toHaveProperty('color');
      expect(organization.folders[0]).toHaveProperty('criteria');
    });

    it('should update folder counts', async () => {
      const organization = await organizer.organizeDocuments(mockDocuments);
      
      organization.folders.forEach(folder => {
        expect(folder.documentCount).toBeGreaterThanOrEqual(0);
        expect(folder.lastUpdated).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle organization errors gracefully', async () => {
      const spy = jest.spyOn(organizer as any, 'generateOrganizationSuggestions')
        .mockRejectedValueOnce(new Error('Organization failed'));

      const organization = await organizer.organizeDocuments(mockDocuments);
      
      expect(organization.folders).toBeDefined();
      expect(organization.suggestions).toEqual([]);
      expect(organization.autoSort).toBe(false);
      
      spy.mockRestore();
    });
  });
});

describe('AIInsightsGenerator', () => {
  let insightsGenerator: AIInsightsGenerator;
  const mockDocuments: DocumentData[] = [
    {
      id: 'doc1',
      uri: 'file://mock/invoice1.jpg',
      title: 'Invoice #12345',
      timestamp: Date.now() - 24 * 60 * 60 * 1000, // 1 day ago
      metadata: { fileSize: 1024, dimensions: { width: 1200, height: 1600 }, quality: 0.8 }
    },
    {
      id: 'doc2',
      uri: 'file://mock/invoice2.jpg',
      title: 'Scanned Document', // This will trigger the "Consider organizing" recommendation
      timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
      metadata: { fileSize: 1024, dimensions: { width: 1200, height: 1600 }, quality: 0.8 }
    }
  ];

  beforeEach(() => {
    insightsGenerator = AIInsightsGenerator.getInstance();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = AIInsightsGenerator.getInstance();
      const instance2 = AIInsightsGenerator.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('initialize', () => {
    it('should initialize successfully', async () => {
      await insightsGenerator.initialize();
      expect(insightsGenerator).toBeDefined();
    });
  });

  describe('generateInsights', () => {
    it('should generate insights successfully', async () => {
      const insights = await insightsGenerator.generateInsights(mockDocuments);
      
      expect(insights).toBeDefined();
      expect(insights.documentSummary).toBeDefined();
      expect(insights.keyFindings).toBeDefined();
      expect(insights.recommendations).toBeDefined();
      expect(insights.trends).toBeDefined();
      expect(insights.anomalies).toBeDefined();
      expect(insights.productivity).toBeDefined();
    });

    it('should generate document summary', async () => {
      const insights = await insightsGenerator.generateInsights(mockDocuments);
      
      expect(insights.documentSummary).toContain('2 documents');
      expect(insights.documentSummary).toContain('financial');
    });

    it('should generate key findings', async () => {
      const insights = await insightsGenerator.generateInsights(mockDocuments);
      
      expect(insights.keyFindings.length).toBeGreaterThan(0);
      expect(insights.keyFindings[0]).toContain('Most documents are in the');
    });

    it('should generate recommendations', async () => {
      const insights = await insightsGenerator.generateInsights(mockDocuments);
      
      expect(insights.recommendations.length).toBeGreaterThan(0);
      expect(insights.recommendations[0]).toContain('Consider');
    });

    it('should calculate productivity metrics', async () => {
      const insights = await insightsGenerator.generateInsights(mockDocuments);
      
      expect(insights.productivity.documentsProcessed).toBe(2);
      expect(insights.productivity.efficiencyScore).toBeGreaterThanOrEqual(0);
      expect(insights.productivity.mostUsedCategories).toBeDefined();
      expect(insights.productivity.peakUsageHours).toBeDefined();
    });

    it('should detect anomalies', async () => {
      const insights = await insightsGenerator.generateInsights(mockDocuments);
      
      expect(insights.anomalies).toBeDefined();
      // Anomalies depend on document patterns, so we just check the structure
      insights.anomalies.forEach(anomaly => {
        expect(anomaly).toHaveProperty('type');
        expect(anomaly).toHaveProperty('severity');
        expect(anomaly).toHaveProperty('description');
        expect(anomaly).toHaveProperty('affectedDocuments');
      });
    });

    it('should analyze trends', async () => {
      const insights = await insightsGenerator.generateInsights(mockDocuments);
      
      expect(insights.trends).toBeDefined();
      insights.trends.forEach(trend => {
        expect(trend).toHaveProperty('metric');
        expect(trend).toHaveProperty('period');
        expect(trend).toHaveProperty('data');
        expect(trend).toHaveProperty('trend');
        expect(trend).toHaveProperty('confidence');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle insights generation errors gracefully', async () => {
      const spy = jest.spyOn(insightsGenerator as any, 'generateDocumentSummary')
        .mockImplementationOnce(() => {
          throw new Error('Insights failed');
        });

      const insights = await insightsGenerator.generateInsights(mockDocuments);
      
      expect(insights.documentSummary).toBe('No documents available for analysis');
      expect(insights.keyFindings).toEqual([]);
      expect(insights.recommendations).toEqual(['Start scanning documents to get personalized insights']);
      
      spy.mockRestore();
    });
  });
});

describe('Utility Functions', () => {
  const mockDocument: DocumentData = {
    id: 'doc1',
    uri: 'file://mock/document.jpg',
    title: 'Test Document',
    timestamp: Date.now(),
    metadata: { fileSize: 1024, dimensions: { width: 1200, height: 1600 }, quality: 0.8 }
  };

  const mockOCRResult: AdvancedOCRResult = {
    text: 'Test document content',
    confidence: 0.9,
    boundingBoxes: [],
    language: 'en',
    processingTime: 1000,
    handwriting: {
      text: 'Test document content',
      confidence: 0.8,
      isHandwritten: false,
      boundingBoxes: [],
      language: 'en'
    },
    tables: { tables: [], confidence: 0, processingTime: 0 },
    structure: { paragraphs: ['Test document content'], tables: [], lists: [], headers: [], footers: [], confidence: 0.8 },
    entities: []
  };

  describe('classifyDocument', () => {
    it('should classify document using utility function', async () => {
      const classification = await classifyDocument(mockDocument, mockOCRResult);
      
      expect(classification).toBeDefined();
      expect(classification.category).toBeDefined();
      expect(classification.confidence).toBeGreaterThanOrEqual(0);
      expect(classification.tags).toBeDefined();
      expect(classification.priority).toBeDefined();
      expect(classification.suggestedActions).toBeDefined();
    });
  });

  describe('organizeDocuments', () => {
    it('should organize documents using utility function', async () => {
      const organization = await organizeDocuments([mockDocument]);
      
      expect(organization).toBeDefined();
      expect(organization.folders).toBeDefined();
      expect(organization.suggestions).toBeDefined();
      expect(organization.rules).toBeDefined();
      expect(organization.autoSort).toBeDefined();
    });
  });

  describe('generateInsights', () => {
    it('should generate insights using utility function', async () => {
      const insights = await generateInsights([mockDocument]);
      
      expect(insights).toBeDefined();
      expect(insights.documentSummary).toBeDefined();
      expect(insights.keyFindings).toBeDefined();
      expect(insights.recommendations).toBeDefined();
      expect(insights.trends).toBeDefined();
      expect(insights.anomalies).toBeDefined();
      expect(insights.productivity).toBeDefined();
    });
  });
});

describe('AI Features Integration', () => {
  const mockDocuments: DocumentData[] = [
    {
      id: 'doc1',
      uri: 'file://mock/invoice1.jpg',
      title: 'Invoice #12345',
      timestamp: Date.now(),
      metadata: { fileSize: 1024, dimensions: { width: 1200, height: 1600 }, quality: 0.8 }
    },
    {
      id: 'doc2',
      uri: 'file://mock/contract1.jpg',
      title: 'Contract Agreement',
      timestamp: Date.now(),
      metadata: { fileSize: 1024, dimensions: { width: 1200, height: 1600 }, quality: 0.8 }
    }
  ];

  it('should work together seamlessly', async () => {
    // Test classification
    const classification = await classifyDocument(mockDocuments[0]);
    expect(classification.category.id).toBe('financial');

    // Test organization
    const organization = await organizeDocuments(mockDocuments);
    expect(organization.folders.length).toBeGreaterThan(0);

    // Test insights
    const insights = await generateInsights(mockDocuments);
    expect(insights.documentSummary).toContain('2 documents');
  });
});