// AI-Powered Features for Document Scanner
// Intelligent document classification, smart organization, and automated processing

import { AdvancedOCRResult } from './advancedOCR';
import { DocumentData } from './enhancedExport';

// Re-export DocumentData for easier imports
export type { DocumentData } from './enhancedExport';

export interface DocumentClassification {
  category: DocumentCategory;
  subcategory?: string;
  confidence: number;
  tags: string[];
  priority: DocumentPriority;
  suggestedActions: SuggestedAction[];
}

export interface DocumentCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  keywords: string[];
}

export interface DocumentPriority {
  level: 'low' | 'medium' | 'high' | 'urgent';
  score: number;
  reasons: string[];
}

export interface SuggestedAction {
  id: string;
  title: string;
  description: string;
  type: 'export' | 'share' | 'organize' | 'process' | 'remind';
  priority: number;
  metadata?: any;
}

export interface SmartOrganization {
  folders: SmartFolder[];
  suggestions: OrganizationSuggestion[];
  autoSort: boolean;
  rules: OrganizationRule[];
}

export interface SmartFolder {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  criteria: FolderCriteria;
  documentCount: number;
  lastUpdated: number;
}

export interface FolderCriteria {
  categories: string[];
  keywords: string[];
  dateRange?: {
    start: number;
    end: number;
  };
  priority?: DocumentPriority['level'];
  customRules?: string[];
}

export interface OrganizationSuggestion {
  id: string;
  type: 'move' | 'rename' | 'categorize' | 'merge' | 'split';
  title: string;
  description: string;
  confidence: number;
  documents: string[];
  suggestedFolder?: string;
  metadata?: any;
}

export interface OrganizationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  conditions: RuleCondition[];
  actions: RuleAction[];
  priority: number;
}

export interface RuleCondition {
  field: 'category' | 'keywords' | 'date' | 'priority' | 'text' | 'entities';
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'regex' | 'greater_than' | 'less_than' | 'between';
  value: any;
  caseSensitive?: boolean;
}

export interface RuleAction {
  type: 'move_to_folder' | 'add_tag' | 'set_priority' | 'rename' | 'export' | 'share' | 'remind';
  parameters: any;
}

export interface AIInsights {
  documentSummary: string;
  keyFindings: string[];
  recommendations: string[];
  trends: TrendAnalysis[];
  anomalies: AnomalyDetection[];
  productivity: ProductivityMetrics;
}

export interface TrendAnalysis {
  metric: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  data: Array<{ date: number; value: number }>;
  trend: 'increasing' | 'decreasing' | 'stable';
  confidence: number;
}

export interface AnomalyDetection {
  type: 'unusual_pattern' | 'missing_data' | 'duplicate' | 'inconsistency';
  severity: 'low' | 'medium' | 'high';
  description: string;
  affectedDocuments: string[];
  suggestedFix?: string;
}

export interface ProductivityMetrics {
  documentsProcessed: number;
  averageProcessingTime: number;
  mostUsedCategories: Array<{ category: string; count: number }>;
  peakUsageHours: number[];
  efficiencyScore: number;
}

export class AIDocumentClassifier {
  private static instance: AIDocumentClassifier;
  private categories: DocumentCategory[] = [];
  private isInitialized = false;

  public static getInstance(): AIDocumentClassifier {
    if (!AIDocumentClassifier.instance) {
      AIDocumentClassifier.instance = new AIDocumentClassifier();
    }
    return AIDocumentClassifier.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    this.categories = this.getDefaultCategories();
    this.isInitialized = true;
    this.log('AI Document Classifier initialized successfully');
  }

  async classifyDocument(document: DocumentData, ocrResult?: AdvancedOCRResult): Promise<DocumentClassification> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const text = ocrResult?.text || '';
      const entities = ocrResult?.entities || [];
      const tables = ocrResult?.tables?.tables || [];
      
      // Analyze document content
      const analysis = await this.analyzeDocumentContent(text, entities, tables);
      
      // Classify document
      const classification = await this.performClassification(analysis, document);
      
      // Generate suggestions
      const suggestions = await this.generateSuggestions(classification, analysis, document);
      
      return {
        ...classification,
        suggestedActions: suggestions
      };
    } catch (error) {
      this.error('Document classification failed:', error);
      return this.getDefaultClassification();
    }
  }

  private async analyzeDocumentContent(text: string, entities: any[], tables: any[]): Promise<any> {
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 100));

    const analysis = {
      wordCount: text.split(/\s+/).length,
      hasNumbers: /\d/.test(text),
      hasCurrency: /\$|€|£|¥/.test(text),
      hasDates: /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.test(text),
      hasEmails: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(text),
      hasPhones: /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(text),
      hasAddresses: /\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr)/i.test(text),
      hasSignatures: /(?:signature|signed|sign|sign here)/i.test(text),
      hasTables: tables.length > 0,
      entityTypes: entities.map(e => e.type),
      keywords: this.extractKeywords(text),
      sentiment: this.analyzeSentiment(text),
      language: this.detectLanguage(text)
    };

    return analysis;
  }

  private async performClassification(analysis: any, document: DocumentData): Promise<DocumentClassification> {
    // Simulate AI classification
    await new Promise(resolve => setTimeout(resolve, 50));

    let bestMatch = this.categories[0];
    let bestScore = 0;
    let tags: string[] = [];
    let priority: DocumentPriority = { level: 'medium', score: 0.5, reasons: [] };

    // Score each category
    for (const category of this.categories) {
      let score = 0;
      const categoryTags: string[] = [];

      // Check keywords
      for (const keyword of category.keywords) {
        if (analysis.keywords.some((k: string) => k.toLowerCase().includes(keyword.toLowerCase()))) {
          score += 0.2;
          categoryTags.push(keyword);
        }
      }

      // Check specific patterns
      if (category.id === 'financial' && (analysis.hasCurrency || analysis.hasNumbers)) {
        score += 0.3;
        categoryTags.push('financial');
      }

      if (category.id === 'legal' && (analysis.hasSignatures || analysis.keywords.some((k: string) => k.includes('contract') || k.includes('agreement')))) {
        score += 0.4;
        categoryTags.push('legal');
      }

      if (category.id === 'medical' && (analysis.keywords.some((k: string) => k.includes('medical') || k.includes('doctor') || k.includes('prescription')) || analysis.entityTypes.includes('person'))) {
        score += 0.3;
        categoryTags.push('medical');
      }

      if (category.id === 'business' && (analysis.hasEmails || analysis.hasPhones || analysis.keywords.some((k: string) => k.includes('business') || k.includes('meeting')))) {
        score += 0.3;
        categoryTags.push('business');
      }

      if (category.id === 'academic' && (analysis.hasTables || analysis.keywords.some((k: string) => k.includes('academic') || k.includes('school') || k.includes('student')))) {
        score += 0.2;
        categoryTags.push('academic');
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = category;
        tags = categoryTags;
      }
    }

    // Determine priority
    if (analysis.hasSignatures || analysis.hasCurrency) {
      priority = { level: 'high', score: 0.8, reasons: ['Contains signatures or financial data'] };
    } else if (analysis.hasEmails || analysis.hasPhones) {
      priority = { level: 'medium', score: 0.6, reasons: ['Contains contact information'] };
    } else {
      priority = { level: 'low', score: 0.4, reasons: ['Standard document'] };
    }

    return {
      category: bestMatch,
      confidence: Math.min(bestScore, 1),
      tags,
      priority,
      suggestedActions: []
    };
  }

  private async generateSuggestions(classification: DocumentClassification, analysis: any, document: DocumentData): Promise<SuggestedAction[]> {
    const suggestions: SuggestedAction[] = [];

    // Export suggestions
    if (classification.category.id === 'financial') {
      suggestions.push({
        id: 'export_excel',
        title: 'Export to Excel',
        description: 'Export financial data to Excel for analysis',
        type: 'export',
        priority: 8,
        metadata: { format: 'xlsx' }
      });
    }

    if (classification.category.id === 'legal') {
      suggestions.push({
        id: 'export_pdf',
        title: 'Export to PDF',
        description: 'Export legal document as PDF for official use',
        type: 'export',
        priority: 9,
        metadata: { format: 'pdf' }
      });
    }

    // Share suggestions
    if (analysis.hasEmails || analysis.hasPhones) {
      suggestions.push({
        id: 'share_contacts',
        title: 'Share Contact Info',
        description: 'Extract and share contact information',
        type: 'share',
        priority: 6,
        metadata: { type: 'contacts' }
      });
    }

    // Organization suggestions
    suggestions.push({
      id: 'organize_category',
      title: `Move to ${classification.category.name}`,
      description: `Organize document in ${classification.category.name} folder`,
      type: 'organize',
      priority: 7,
      metadata: { category: classification.category.id }
    });

    // Process suggestions
    if (analysis.hasTables) {
      suggestions.push({
        id: 'extract_tables',
        title: 'Extract Tables',
        description: 'Extract and process table data',
        type: 'process',
        priority: 5,
        metadata: { action: 'extract_tables' }
      });
    }

    // Reminder suggestions
    if (analysis.hasDates) {
      suggestions.push({
        id: 'set_reminder',
        title: 'Set Reminder',
        description: 'Set reminder for important dates',
        type: 'remind',
        priority: 4,
        metadata: { type: 'date_reminder' }
      });
    }

    return suggestions.sort((a, b) => b.priority - a.priority);
  }

  private extractKeywords(text: string): string[] {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);

    const stopWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'among', 'within', 'without', 'against', 'across', 'behind', 'beyond', 'under', 'over', 'around', 'near', 'far', 'here', 'there', 'where', 'when', 'why', 'how', 'what', 'who', 'which', 'that', 'this', 'these', 'those', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'shall', 'ought', 'need', 'dare', 'used']);

    const wordCount: { [key: string]: number } = {};
    words.forEach(word => {
      if (!stopWords.has(word)) {
        wordCount[word] = (wordCount[word] || 0) + 1;
      }
    });

    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'perfect', 'love', 'like', 'happy', 'pleased', 'satisfied', 'success', 'win', 'achieve', 'accomplish'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'hate', 'dislike', 'angry', 'sad', 'disappointed', 'frustrated', 'fail', 'lose', 'problem', 'issue', 'error', 'mistake'];

    const words = text.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;

    words.forEach(word => {
      if (positiveWords.includes(word)) positiveCount++;
      if (negativeWords.includes(word)) negativeCount++;
    });

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private detectLanguage(text: string): string {
    // Simple language detection based on common words
    const englishWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const spanishWords = ['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se', 'no', 'te', 'lo', 'le'];
    const frenchWords = ['le', 'la', 'de', 'et', 'à', 'un', 'il', 'que', 'ne', 'se', 'ce', 'pas', 'tout', 'plus'];

    const words = text.toLowerCase().split(/\s+/);
    let englishCount = 0;
    let spanishCount = 0;
    let frenchCount = 0;

    words.forEach(word => {
      if (englishWords.includes(word)) englishCount++;
      if (spanishWords.includes(word)) spanishCount++;
      if (frenchWords.includes(word)) frenchCount++;
    });

    if (englishCount > spanishCount && englishCount > frenchCount) return 'en';
    if (spanishCount > frenchCount) return 'es';
    if (frenchCount > 0) return 'fr';
    return 'en'; // Default to English
  }

  private getDefaultCategories(): DocumentCategory[] {
    return [
      {
        id: 'financial',
        name: 'Financial',
        description: 'Financial documents, invoices, receipts, statements',
        icon: 'cash',
        color: '#4CAF50',
        keywords: ['invoice', 'receipt', 'payment', 'bill', 'statement', 'financial', 'money', 'dollar', 'euro', 'pound', 'tax', 'expense', 'budget', 'account', 'bank', 'credit', 'debit']
      },
      {
        id: 'legal',
        name: 'Legal',
        description: 'Legal documents, contracts, agreements, forms',
        icon: 'document-text',
        color: '#2196F3',
        keywords: ['contract', 'agreement', 'legal', 'law', 'terms', 'conditions', 'signature', 'signed', 'witness', 'notary', 'court', 'lawyer', 'attorney', 'clause', 'section', 'article']
      },
      {
        id: 'medical',
        name: 'Medical',
        description: 'Medical records, prescriptions, health documents',
        icon: 'medical',
        color: '#F44336',
        keywords: ['medical', 'health', 'doctor', 'patient', 'prescription', 'medicine', 'treatment', 'diagnosis', 'symptoms', 'hospital', 'clinic', 'pharmacy', 'insurance', 'healthcare', 'therapy']
      },
      {
        id: 'business',
        name: 'Business',
        description: 'Business documents, reports, presentations',
        icon: 'briefcase',
        color: '#FF9800',
        keywords: ['business', 'company', 'corporate', 'meeting', 'report', 'presentation', 'proposal', 'strategy', 'marketing', 'sales', 'customer', 'client', 'project', 'team', 'management']
      },
      {
        id: 'academic',
        name: 'Academic',
        description: 'Educational documents, research, papers',
        icon: 'school',
        color: '#9C27B0',
        keywords: ['academic', 'education', 'school', 'university', 'college', 'student', 'teacher', 'professor', 'research', 'study', 'exam', 'test', 'assignment', 'homework', 'thesis', 'paper']
      },
      {
        id: 'personal',
        name: 'Personal',
        description: 'Personal documents, letters, notes',
        icon: 'person',
        color: '#607D8B',
        keywords: ['personal', 'private', 'letter', 'note', 'memo', 'reminder', 'diary', 'journal', 'family', 'friend', 'personal', 'private', 'home', 'address', 'phone']
      },
      {
        id: 'government',
        name: 'Government',
        description: 'Government forms, official documents',
        icon: 'shield-checkmark',
        color: '#795548',
        keywords: ['government', 'official', 'form', 'application', 'permit', 'license', 'passport', 'id', 'identification', 'citizen', 'immigration', 'tax', 'social', 'security']
      },
      {
        id: 'other',
        name: 'Other',
        description: 'Miscellaneous documents',
        icon: 'document',
        color: '#9E9E9E',
        keywords: []
      }
    ];
  }

  private getDefaultClassification(): DocumentClassification {
    return {
      category: this.categories[this.categories.length - 1], // 'other'
      confidence: 0.1,
      tags: [],
      priority: { level: 'low', score: 0.3, reasons: ['Unable to classify'] },
      suggestedActions: []
    };
  }

  private log(...args: any[]) {
    console.log('AI Classifier:', ...args);
  }

  private error(...args: any[]) {
    console.error('AI Classifier Error:', ...args);
  }
}

export class SmartOrganizer {
  private static instance: SmartOrganizer;
  private folders: SmartFolder[] = [];
  private rules: OrganizationRule[] = [];
  private isInitialized = false;

  public static getInstance(): SmartOrganizer {
    if (!SmartOrganizer.instance) {
      SmartOrganizer.instance = new SmartOrganizer();
    }
    return SmartOrganizer.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    this.folders = this.getDefaultFolders();
    this.rules = this.getDefaultRules();
    this.isInitialized = true;
    this.log('Smart Organizer initialized successfully');
  }

  async organizeDocuments(documents: DocumentData[]): Promise<SmartOrganization> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const suggestions = await this.generateOrganizationSuggestions(documents);
      const updatedFolders = await this.updateFolderCounts(documents);

      return {
        folders: updatedFolders,
        suggestions,
        autoSort: true,
        rules: this.rules
      };
    } catch (error) {
      this.error('Document organization failed:', error);
      return {
        folders: this.folders,
        suggestions: [],
        autoSort: false,
        rules: this.rules
      };
    }
  }

  private async generateOrganizationSuggestions(documents: DocumentData[]): Promise<OrganizationSuggestion[]> {
    const suggestions: OrganizationSuggestion[] = [];

    // Group similar documents
    const groupedDocs = this.groupSimilarDocuments(documents);
    
    for (const group of groupedDocs) {
      if (group.documents.length > 1) {
        suggestions.push({
          id: `merge_${Date.now()}`,
          type: 'merge',
          title: `Merge ${group.documents.length} similar documents`,
          description: `These documents appear to be related and could be merged`,
          confidence: 0.8,
          documents: group.documents.map(d => d.id),
          metadata: { groupType: group.type }
        });
      }
    }

    // Suggest folder moves
    for (const doc of documents) {
      const bestFolder = this.findBestFolder(doc);
      if (bestFolder && bestFolder.id !== 'inbox') {
        suggestions.push({
          id: `move_${doc.id}`,
          type: 'move',
          title: `Move to ${bestFolder.name}`,
          description: `This document fits well in the ${bestFolder.name} folder`,
          confidence: 0.7,
          documents: [doc.id],
          suggestedFolder: bestFolder.id
        });
      }
    }

    return suggestions;
  }

  private groupSimilarDocuments(documents: DocumentData[]): Array<{ type: string; documents: DocumentData[] }> {
    const groups: { [key: string]: DocumentData[] } = {};

    documents.forEach(doc => {
      const key = this.getDocumentGroupKey(doc);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(doc);
    });

    return Object.entries(groups).map(([type, docs]) => ({ type, documents: docs }));
  }

  private getDocumentGroupKey(doc: DocumentData): string {
    // Simple grouping based on title similarity
    const title = doc.title?.toLowerCase() || '';
    if (title.includes('invoice') || title.includes('receipt')) return 'financial';
    if (title.includes('contract') || title.includes('agreement')) return 'legal';
    if (title.includes('medical') || title.includes('health')) return 'medical';
    if (title.includes('meeting') || title.includes('report')) return 'business';
    if (title.includes('exam') || title.includes('assignment')) return 'academic';
    return 'other';
  }

  private findBestFolder(doc: DocumentData): SmartFolder | null {
    let bestFolder = this.folders[0]; // Default to inbox
    let bestScore = 0;

    for (const folder of this.folders) {
      let score = 0;
      
      // Check category match
      if (folder.criteria.categories.length > 0) {
        // This would need actual classification data
        score += 0.3;
      }

      // Check keyword match
      if (folder.criteria.keywords.length > 0) {
        const title = doc.title?.toLowerCase() || '';
        const keywordMatches = folder.criteria.keywords.filter(keyword => 
          title.includes(keyword.toLowerCase())
        ).length;
        score += (keywordMatches / folder.criteria.keywords.length) * 0.4;
      }

      // Check date range
      if (folder.criteria.dateRange) {
        const docDate = doc.timestamp;
        if (docDate >= folder.criteria.dateRange.start && docDate <= folder.criteria.dateRange.end) {
          score += 0.3;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestFolder = folder;
      }
    }

    return bestScore > 0.3 ? bestFolder : null;
  }

  private async updateFolderCounts(documents: DocumentData[]): Promise<SmartFolder[]> {
    return this.folders.map(folder => ({
      ...folder,
      documentCount: documents.filter(doc => {
        // Simple counting logic - would be more sophisticated in real implementation
        const title = doc.title?.toLowerCase() || '';
        return folder.criteria.keywords.some(keyword => 
          title.includes(keyword.toLowerCase())
        );
      }).length,
      lastUpdated: Date.now()
    }));
  }

  private getDefaultFolders(): SmartFolder[] {
    return [
      {
        id: 'inbox',
        name: 'Inbox',
        description: 'New documents awaiting organization',
        icon: 'mail',
        color: '#2196F3',
        criteria: { categories: [], keywords: [] },
        documentCount: 0,
        lastUpdated: Date.now()
      },
      {
        id: 'financial',
        name: 'Financial',
        description: 'Invoices, receipts, financial documents',
        icon: 'cash',
        color: '#4CAF50',
        criteria: { 
          categories: ['financial'], 
          keywords: ['invoice', 'receipt', 'payment', 'bill', 'statement'] 
        },
        documentCount: 0,
        lastUpdated: Date.now()
      },
      {
        id: 'legal',
        name: 'Legal',
        description: 'Contracts, agreements, legal documents',
        icon: 'document-text',
        color: '#2196F3',
        criteria: { 
          categories: ['legal'], 
          keywords: ['contract', 'agreement', 'legal', 'terms'] 
        },
        documentCount: 0,
        lastUpdated: Date.now()
      },
      {
        id: 'medical',
        name: 'Medical',
        description: 'Medical records, prescriptions, health documents',
        icon: 'medical',
        color: '#F44336',
        criteria: { 
          categories: ['medical'], 
          keywords: ['medical', 'health', 'prescription', 'doctor'] 
        },
        documentCount: 0,
        lastUpdated: Date.now()
      },
      {
        id: 'business',
        name: 'Business',
        description: 'Business documents, reports, presentations',
        icon: 'briefcase',
        color: '#FF9800',
        criteria: { 
          categories: ['business'], 
          keywords: ['business', 'report', 'meeting', 'presentation'] 
        },
        documentCount: 0,
        lastUpdated: Date.now()
      }
    ];
  }

  private getDefaultRules(): OrganizationRule[] {
    return [
      {
        id: 'auto_financial',
        name: 'Auto-categorize Financial Documents',
        description: 'Automatically move documents with financial keywords to Financial folder',
        enabled: true,
        conditions: [
          { field: 'keywords', operator: 'contains', value: 'invoice' },
          { field: 'keywords', operator: 'contains', value: 'receipt' }
        ],
        actions: [
          { type: 'move_to_folder', parameters: { folderId: 'financial' } }
        ],
        priority: 1
      },
      {
        id: 'auto_legal',
        name: 'Auto-categorize Legal Documents',
        description: 'Automatically move documents with legal keywords to Legal folder',
        enabled: true,
        conditions: [
          { field: 'keywords', operator: 'contains', value: 'contract' },
          { field: 'keywords', operator: 'contains', value: 'agreement' }
        ],
        actions: [
          { type: 'move_to_folder', parameters: { folderId: 'legal' } }
        ],
        priority: 2
      }
    ];
  }

  private log(...args: any[]) {
    console.log('Smart Organizer:', ...args);
  }

  private error(...args: any[]) {
    console.error('Smart Organizer Error:', ...args);
  }
}

export class AIInsightsGenerator {
  private static instance: AIInsightsGenerator;
  private isInitialized = false;

  public static getInstance(): AIInsightsGenerator {
    if (!AIInsightsGenerator.instance) {
      AIInsightsGenerator.instance = new AIInsightsGenerator();
    }
    return AIInsightsGenerator.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;
    this.log('AI Insights Generator initialized successfully');
  }

  async generateInsights(documents: DocumentData[]): Promise<AIInsights> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const documentSummary = this.generateDocumentSummary(documents);
      const keyFindings = this.extractKeyFindings(documents);
      const recommendations = this.generateRecommendations(documents);
      const trends = this.analyzeTrends(documents);
      const anomalies = this.detectAnomalies(documents);
      const productivity = this.calculateProductivityMetrics(documents);

      return {
        documentSummary,
        keyFindings,
        recommendations,
        trends,
        anomalies,
        productivity
      };
    } catch (error) {
      this.error('Insights generation failed:', error);
      return this.getDefaultInsights();
    }
  }

  private generateDocumentSummary(documents: DocumentData[]): string {
    const totalDocs = documents.length;
    const categories = this.groupByCategory(documents);
    const recentDocs = documents.filter(d => Date.now() - d.timestamp < 7 * 24 * 60 * 60 * 1000).length;

    return `You have ${totalDocs} documents in your collection. ${recentDocs} were added in the last week. Your most active categories are ${Object.keys(categories).slice(0, 3).join(', ')}.`;
  }

  private extractKeyFindings(documents: DocumentData[]): string[] {
    const findings: string[] = [];
    
    const categories = this.groupByCategory(documents);
    const mostActiveCategory = Object.entries(categories).sort(([,a], [,b]) => b.length - a.length)[0];
    
    if (mostActiveCategory) {
      findings.push(`Most documents are in the ${mostActiveCategory[0]} category (${mostActiveCategory[1].length} documents)`);
    }

    const recentDocs = documents.filter(d => Date.now() - d.timestamp < 24 * 60 * 60 * 1000).length;
    if (recentDocs > 0) {
      findings.push(`${recentDocs} documents were added today`);
    }

    const hasFinancialDocs = documents.some(d => d.title?.toLowerCase().includes('invoice') || d.title?.toLowerCase().includes('receipt'));
    if (hasFinancialDocs) {
      findings.push('Financial documents detected - consider organizing for tax purposes');
    }

    return findings;
  }

  private generateRecommendations(documents: DocumentData[]): string[] {
    const recommendations: string[] = [];

    const categories = this.groupByCategory(documents);
    const unorganizedDocs = documents.filter(d => !d.title || d.title === 'Scanned Document').length;

    if (unorganizedDocs > 0) {
      recommendations.push(`Consider organizing ${unorganizedDocs} unnamed documents`);
    }

    const financialDocs = categories['financial'] || [];
    if (financialDocs.length > 10) {
      recommendations.push('You have many financial documents - consider creating subcategories by month or type');
    }

    const oldDocs = documents.filter(d => Date.now() - d.timestamp > 365 * 24 * 60 * 60 * 1000).length;
    if (oldDocs > 0) {
      recommendations.push(`Consider archiving ${oldDocs} documents older than one year`);
    }

    // Always provide at least one recommendation
    if (recommendations.length === 0) {
      recommendations.push('Keep up the great work organizing your documents!');
    }

    return recommendations;
  }

  private analyzeTrends(documents: DocumentData[]): TrendAnalysis[] {
    const trends: TrendAnalysis[] = [];

    // Document creation trend
    const dailyCounts: { [key: string]: number } = {};
    documents.forEach(doc => {
      const date = new Date(doc.timestamp).toISOString().split('T')[0];
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });

    const dailyData = Object.entries(dailyCounts).map(([date, count]) => ({
      date: new Date(date).getTime(),
      value: count
    })).sort((a, b) => a.date - b.date);

    if (dailyData.length > 1) {
      const trend = this.calculateTrend(dailyData);
      trends.push({
        metric: 'Document Creation',
        period: 'daily',
        data: dailyData,
        trend: trend > 0 ? 'increasing' : trend < 0 ? 'decreasing' : 'stable',
        confidence: Math.abs(trend)
      });
    }

    return trends;
  }

  private detectAnomalies(documents: DocumentData[]): AnomalyDetection[] {
    const anomalies: AnomalyDetection[] = [];

    // Check for duplicate documents
    const titles = documents.map(d => d.title?.toLowerCase() || '');
    const duplicates = titles.filter((title, index) => titles.indexOf(title) !== index);
    
    if (duplicates.length > 0) {
      anomalies.push({
        type: 'duplicate',
        severity: 'medium',
        description: `Found ${duplicates.length} potential duplicate documents`,
        affectedDocuments: duplicates,
        suggestedFix: 'Review and merge or delete duplicate documents'
      });
    }

    // Check for unusually large batches
    const recentDocs = documents.filter(d => Date.now() - d.timestamp < 24 * 60 * 60 * 1000);
    if (recentDocs.length > 20) {
      anomalies.push({
        type: 'unusual_pattern',
        severity: 'low',
        description: `Unusually high document creation today (${recentDocs.length} documents)`,
        affectedDocuments: recentDocs.map(d => d.id),
        suggestedFix: 'Consider organizing documents into batches'
      });
    }

    return anomalies;
  }

  private calculateProductivityMetrics(documents: DocumentData[]): ProductivityMetrics {
    const totalDocs = documents.length;
    const now = Date.now();
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const recentDocs = documents.filter(d => d.timestamp > oneWeekAgo);

    const categories = this.groupByCategory(documents);
    const mostUsedCategories = Object.entries(categories)
      .map(([category, docs]) => ({ category, count: docs.length }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate peak usage hours (simplified)
    const peakHours = [9, 10, 11, 14, 15, 16]; // Typical business hours

    const efficiencyScore = Math.min(100, (recentDocs.length / 7) * 10); // Simple efficiency metric

    return {
      documentsProcessed: totalDocs,
      averageProcessingTime: 2.5, // Simulated
      mostUsedCategories,
      peakUsageHours: peakHours,
      efficiencyScore
    };
  }

  private groupByCategory(documents: DocumentData[]): { [key: string]: DocumentData[] } {
    const groups: { [key: string]: DocumentData[] } = {};
    
    documents.forEach(doc => {
      const title = doc.title?.toLowerCase() || '';
      let category = 'other';
      
      if (title.includes('invoice') || title.includes('receipt')) category = 'financial';
      else if (title.includes('contract') || title.includes('agreement')) category = 'legal';
      else if (title.includes('medical') || title.includes('health')) category = 'medical';
      else if (title.includes('meeting') || title.includes('report')) category = 'business';
      else if (title.includes('exam') || title.includes('assignment')) category = 'academic';
      
      if (!groups[category]) groups[category] = [];
      groups[category].push(doc);
    });

    return groups;
  }

  private calculateTrend(data: Array<{ date: number; value: number }>): number {
    if (data.length < 2) return 0;
    
    const first = data[0];
    const last = data[data.length - 1];
    const timeDiff = last.date - first.date;
    const valueDiff = last.value - first.value;
    
    return timeDiff > 0 ? valueDiff / (timeDiff / (24 * 60 * 60 * 1000)) : 0;
  }

  private getDefaultInsights(): AIInsights {
    return {
      documentSummary: 'No documents available for analysis',
      keyFindings: [],
      recommendations: ['Start scanning documents to get personalized insights'],
      trends: [],
      anomalies: [],
      productivity: {
        documentsProcessed: 0,
        averageProcessingTime: 0,
        mostUsedCategories: [],
        peakUsageHours: [],
        efficiencyScore: 0
      }
    };
  }

  private log(...args: any[]) {
    console.log('AI Insights:', ...args);
  }

  private error(...args: any[]) {
    console.error('AI Insights Error:', ...args);
  }
}

// Export utility functions
export const classifyDocument = async (document: DocumentData, ocrResult?: AdvancedOCRResult): Promise<DocumentClassification> => {
  const classifier = AIDocumentClassifier.getInstance();
  return await classifier.classifyDocument(document, ocrResult);
};

export const organizeDocuments = async (documents: DocumentData[]): Promise<SmartOrganization> => {
  const organizer = SmartOrganizer.getInstance();
  return await organizer.organizeDocuments(documents);
};

export const generateInsights = async (documents: DocumentData[]): Promise<AIInsights> => {
  const insightsGenerator = AIInsightsGenerator.getInstance();
  return await insightsGenerator.generateInsights(documents);
};

export default {
  AIDocumentClassifier,
  SmartOrganizer,
  AIInsightsGenerator,
  classifyDocument,
  organizeDocuments,
  generateInsights
};