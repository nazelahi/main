// Advanced OCR Tests
import { AdvancedOCREngine, createAdvancedOCREngine, AdvancedOCRUtils } from '../../utils/advancedOCR';

// Mock the cloud OCR engine
jest.mock('../../utils/cloudOCR', () => ({
  createCloudOCREngine: jest.fn(() => ({
    initialize: jest.fn().mockResolvedValue(undefined),
    detectText: jest.fn().mockResolvedValue({
      text: 'Sample document text for testing',
      confidence: 0.9,
      boundingBoxes: [
        { x: 10, y: 20, width: 100, height: 20, text: 'Sample', confidence: 0.9 },
        { x: 120, y: 20, width: 80, height: 20, text: 'document', confidence: 0.9 },
        { x: 210, y: 20, width: 60, height: 20, text: 'text', confidence: 0.9 },
      ],
      language: 'en',
      processingTime: 1000
    }),
    terminate: jest.fn().mockResolvedValue(undefined)
  }))
}));

describe('AdvancedOCREngine', () => {
  let engine: AdvancedOCREngine;

  beforeEach(() => {
    engine = createAdvancedOCREngine({
      provider: 'mock',
      apiKey: 'test-key'
    });
  });

  afterEach(async () => {
    await engine.terminate();
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await expect(engine.initialize()).resolves.not.toThrow();
    });

    it('should not initialize twice', async () => {
      await engine.initialize();
      await engine.initialize(); // Should not throw
    });
  });

  describe('Document Processing', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    it('should process document with all advanced features', async () => {
      const result = await engine.processDocument('test-image-uri');

      expect(result).toBeDefined();
      expect(result.text).toBe('Sample document text for testing');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.processingTime).toBeGreaterThan(0);
      expect(result.handwriting).toBeDefined();
      expect(result.tables).toBeDefined();
      expect(result.structure).toBeDefined();
      expect(result.entities).toBeDefined();
    });

    it('should detect handwriting characteristics', async () => {
      const result = await engine.processDocument('test-image-uri');
      
      expect(result.handwriting).toBeDefined();
      expect(typeof result.handwriting?.isHandwritten).toBe('boolean');
      expect(typeof result.handwriting?.confidence).toBe('number');
      expect(Array.isArray(result.handwriting?.boundingBoxes)).toBe(true);
    });

    it('should extract tables from document', async () => {
      const result = await engine.processDocument('test-image-uri');
      
      expect(result.tables).toBeDefined();
      expect(Array.isArray(result.tables?.tables)).toBe(true);
      expect(typeof result.tables?.confidence).toBe('number');
    });

    it('should analyze document structure', async () => {
      const result = await engine.processDocument('test-image-uri');
      
      expect(result.structure).toBeDefined();
      expect(Array.isArray(result.structure?.paragraphs)).toBe(true);
      expect(Array.isArray(result.structure?.headers)).toBe(true);
      expect(Array.isArray(result.structure?.lists)).toBe(true);
      expect(typeof result.structure?.confidence).toBe('number');
    });

    it('should extract entities from text', async () => {
      const result = await engine.processDocument('test-image-uri');
      
      expect(result.entities).toBeDefined();
      expect(Array.isArray(result.entities)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle processing errors gracefully', async () => {
      // Mock an error in the cloud engine
      const mockEngine = createAdvancedOCREngine({
        provider: 'mock',
        apiKey: 'test-key'
      });
      
      // Override the detectText method to throw an error
      (mockEngine as any).cloudEngine.detectText = jest.fn().mockRejectedValue(new Error('Processing failed'));

      await expect(mockEngine.processDocument('test-image-uri')).rejects.toThrow('Failed to process document with advanced OCR');
    });
  });
});

describe('AdvancedOCRUtils', () => {
  const mockResult = {
    text: 'Sample document text',
    confidence: 0.9,
    boundingBoxes: [],
    language: 'en',
    processingTime: 1000,
    handwriting: {
      text: 'handwritten text',
      confidence: 0.8,
      isHandwritten: true,
      boundingBoxes: [],
      language: 'en'
    },
    tables: {
      tables: [
        {
          id: 'table-1',
          rows: [
            {
              cells: [
                { text: 'Header 1', columnIndex: 0, rowIndex: 0, boundingBox: { x: 0, y: 0, width: 100, height: 20, text: 'Header 1', confidence: 0.9 }, confidence: 0.9 },
                { text: 'Header 2', columnIndex: 1, rowIndex: 0, boundingBox: { x: 100, y: 0, width: 100, height: 20, text: 'Header 2', confidence: 0.9 }, confidence: 0.9 }
              ],
              rowIndex: 0
            }
          ],
          columns: 2,
          boundingBox: { x: 0, y: 0, width: 200, height: 20, text: 'Table', confidence: 0.9 },
          confidence: 0.9
        }
      ],
      confidence: 0.9,
      processingTime: 500
    },
    structure: {
      title: 'Sample Document',
      paragraphs: ['This is a sample paragraph.'],
      tables: [],
      lists: [],
      headers: [],
      footers: [],
      confidence: 0.8
    },
    entities: [
      {
        type: 'person' as const,
        value: 'John Doe',
        confidence: 0.9,
        boundingBox: { x: 0, y: 0, width: 60, height: 20, text: 'John Doe', confidence: 0.9 }
      }
    ]
  };

  describe('extractStructuredData', () => {
    it('should extract structured data correctly', () => {
      const structuredData = AdvancedOCRUtils.extractStructuredData(mockResult);

      expect(structuredData.title).toBe('Sample Document');
      expect(structuredData.content).toBe('Sample document text');
      expect(Array.isArray(structuredData.tables)).toBe(true);
      expect(Array.isArray(structuredData.entities)).toBe(true);
      expect(structuredData.metadata.isHandwritten).toBe(true);
      expect(structuredData.metadata.hasTables).toBe(true);
      expect(typeof structuredData.metadata.confidence).toBe('number');
    });
  });

  describe('exportTableToCSV', () => {
    it('should export table to CSV format', () => {
      const table = mockResult.tables.tables[0];
      const csv = AdvancedOCRUtils.exportTableToCSV(table);

      expect(csv).toContain('Header 1');
      expect(csv).toContain('Header 2');
      expect(csv).toContain(',');
    });
  });

  describe('exportTableToJSON', () => {
    it('should export table to JSON format', () => {
      const table = mockResult.tables.tables[0];
      const json = AdvancedOCRUtils.exportTableToJSON(table);

      expect(json.id).toBe('table-1');
      expect(json.columns).toBe(2);
      expect(Array.isArray(json.rows)).toBe(true);
      expect(json.rows[0].cells).toHaveLength(2);
    });
  });

  describe('searchEntities', () => {
    it('should search for specific entity types', () => {
      const personEntities = AdvancedOCRUtils.searchEntities(mockResult, 'person');
      
      expect(Array.isArray(personEntities)).toBe(true);
      expect(personEntities.length).toBe(1);
      expect(personEntities[0].type).toBe('person');
      expect(personEntities[0].value).toBe('John Doe');
    });

    it('should return empty array for non-existent entity types', () => {
      const locationEntities = AdvancedOCRUtils.searchEntities(mockResult, 'location');
      
      expect(Array.isArray(locationEntities)).toBe(true);
      expect(locationEntities.length).toBe(0);
    });
  });

  describe('getDocumentSummary', () => {
    it('should generate document summary', () => {
      const summary = AdvancedOCRUtils.getDocumentSummary(mockResult);

      expect(typeof summary).toBe('string');
      expect(summary).toContain('Sample Document');
      expect(summary).toContain('Content:');
    });

    it('should handle missing structure gracefully', () => {
      const resultWithoutStructure = { ...mockResult, structure: undefined };
      const summary = AdvancedOCRUtils.getDocumentSummary(resultWithoutStructure);

      expect(typeof summary).toBe('string');
      expect(summary).toContain('Sample document text');
    });
  });
});

describe('Handwriting Detection', () => {
  let engine: AdvancedOCREngine;

  beforeEach(async () => {
    engine = createAdvancedOCREngine({
      provider: 'mock',
      apiKey: 'test-key'
    });
    await engine.initialize();
  });

  afterEach(async () => {
    await engine.terminate();
  });

  it('should detect handwriting characteristics correctly', async () => {
    // Test with text that has handwriting characteristics
    const handwrittenText = 'This is a HANDWRITTEN note with mixed case and irregular spacing.';
    
    // Mock the cloud engine to return handwritten text
    (engine as any).cloudEngine.detectText = jest.fn().mockResolvedValue({
      text: handwrittenText,
      confidence: 0.9,
      boundingBoxes: [],
      language: 'en',
      processingTime: 1000
    });

    const result = await engine.processDocument('test-image-uri');
    
    expect(result.handwriting?.isHandwritten).toBe(true);
    expect(result.handwriting?.confidence).toBeGreaterThan(0.5);
  });

  it('should detect typed text correctly', async () => {
    // Test with text that looks typed
    const typedText = 'This is a properly formatted document with consistent spacing and capitalization.';
    
    // Mock the cloud engine to return typed text
    (engine as any).cloudEngine.detectText = jest.fn().mockResolvedValue({
      text: typedText,
      confidence: 0.9,
      boundingBoxes: [],
      language: 'en',
      processingTime: 1000
    });

    const result = await engine.processDocument('test-image-uri');
    
    expect(result.handwriting?.isHandwritten).toBe(false);
    expect(result.handwriting?.confidence).toBeLessThan(0.5);
  });
});

describe('Table Extraction', () => {
  let engine: AdvancedOCREngine;

  beforeEach(async () => {
    engine = createAdvancedOCREngine({
      provider: 'mock',
      apiKey: 'test-key'
    });
    await engine.initialize();
  });

  afterEach(async () => {
    await engine.terminate();
  });

  it('should extract tables from tab-separated text', async () => {
    const tableText = 'Name\tAge\tCity\nJohn\t25\tNew York\nJane\t30\tLos Angeles';
    
    (engine as any).cloudEngine.detectText = jest.fn().mockResolvedValue({
      text: tableText,
      confidence: 0.9,
      boundingBoxes: [],
      language: 'en',
      processingTime: 1000
    });

    const result = await engine.processDocument('test-image-uri');
    
    expect(result.tables?.tables.length).toBeGreaterThan(0);
    expect(result.tables?.tables[0].columns).toBe(3);
    expect(result.tables?.tables[0].rows.length).toBe(3);
  });

  it('should extract tables from space-separated text', async () => {
    const tableText = 'Name    Age    City\nJohn    25     New York\nJane    30     Los Angeles';
    
    (engine as any).cloudEngine.detectText = jest.fn().mockResolvedValue({
      text: tableText,
      confidence: 0.9,
      boundingBoxes: [],
      language: 'en',
      processingTime: 1000
    });

    const result = await engine.processDocument('test-image-uri');
    
    expect(result.tables?.tables.length).toBeGreaterThan(0);
    expect(result.tables?.tables[0].columns).toBe(3);
  });
});

describe('Entity Extraction', () => {
  let engine: AdvancedOCREngine;

  beforeEach(async () => {
    engine = createAdvancedOCREngine({
      provider: 'mock',
      apiKey: 'test-key'
    });
    await engine.initialize();
  });

  afterEach(async () => {
    await engine.terminate();
  });

  it('should extract various entity types', async () => {
    const textWithEntities = 'Contact John Smith at john@example.com or call (555) 123-4567. Visit https://example.com for more info.';
    
    (engine as any).cloudEngine.detectText = jest.fn().mockResolvedValue({
      text: textWithEntities,
      confidence: 0.9,
      boundingBoxes: [],
      language: 'en',
      processingTime: 1000
    });

    const result = await engine.processDocument('test-image-uri');
    
    expect(result.entities).toBeDefined();
    expect(result.entities!.length).toBeGreaterThan(0);
    
    const entityTypes = result.entities!.map(e => e.type);
    expect(entityTypes).toContain('person');
    expect(entityTypes).toContain('email');
    expect(entityTypes).toContain('phone');
    expect(entityTypes).toContain('url');
  });
});