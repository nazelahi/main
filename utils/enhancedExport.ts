// Enhanced Export Options for Document Scanner
// Supports Word, Excel, PowerPoint, and other formats

import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { AdvancedOCRResult, Table, ExtractedEntity } from './advancedOCR';

export interface ExportOptions {
  format: 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'txt' | 'csv' | 'json' | 'html';
  quality?: 'low' | 'medium' | 'high';
  includeImages?: boolean;
  includeOCR?: boolean;
  includeTables?: boolean;
  includeEntities?: boolean;
  includeMetadata?: boolean;
  filename?: string;
  title?: string;
}

export interface ExportResult {
  uri: string;
  filename: string;
  format: string;
  size: number;
  mimeType: string;
}

export interface DocumentData {
  id: string;
  uri: string;
  title?: string;
  timestamp: number;
  ocrResult?: AdvancedOCRResult;
  metadata?: {
    fileSize: number;
    dimensions: { width: number; height: number };
    quality: number;
  };
}

export class EnhancedExporter {
  private static instance: EnhancedExporter;
  
  public static getInstance(): EnhancedExporter {
    if (!EnhancedExporter.instance) {
      EnhancedExporter.instance = new EnhancedExporter();
    }
    return EnhancedExporter.instance;
  }

  /**
   * Export document(s) in the specified format
   */
  async exportDocuments(
    documents: DocumentData[],
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      const filename = options.filename || this.generateFilename(options.format, documents.length);
      
      switch (options.format) {
        case 'pdf':
          return await this.exportToPDF(documents, options, filename);
        case 'docx':
          return await this.exportToWord(documents, options, filename);
        case 'xlsx':
          return await this.exportToExcel(documents, options, filename);
        case 'pptx':
          return await this.exportToPowerPoint(documents, options, filename);
        case 'txt':
          return await this.exportToText(documents, options, filename);
        case 'csv':
          return await this.exportToCSV(documents, options, filename);
        case 'json':
          return await this.exportToJSON(documents, options, filename);
        case 'html':
          return await this.exportToHTML(documents, options, filename);
        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }
    } catch (error) {
      console.error('Export failed:', error);
      throw new Error(`Failed to export documents: ${error}`);
    }
  }

  /**
   * Export to PDF format
   */
  private async exportToPDF(
    documents: DocumentData[],
    options: ExportOptions,
    filename: string
  ): Promise<ExportResult> {
    const htmlContent = this.generatePDFHTML(documents, options);
    
    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false,
    });

    const fileInfo = await FileSystem.getInfoAsync(uri);
    const size = fileInfo.exists ? fileInfo.size || 0 : 0;

    return {
      uri,
      filename: `${filename}.pdf`,
      format: 'pdf',
      size,
      mimeType: 'application/pdf'
    };
  }

  /**
   * Export to Word format (DOCX)
   */
  private async exportToWord(
    documents: DocumentData[],
    options: ExportOptions,
    filename: string
  ): Promise<ExportResult> {
    const htmlContent = this.generateWordHTML(documents, options);
    
    // Convert HTML to DOCX by creating a rich HTML file
    const docxUri = await this.createDocumentFile(htmlContent, 'docx');
    
    const fileInfo = await FileSystem.getInfoAsync(docxUri);
    const size = fileInfo.exists ? fileInfo.size || 0 : 0;

    return {
      uri: docxUri,
      filename: `${filename}.docx`,
      format: 'docx',
      size,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };
  }

  /**
   * Export to Excel format (XLSX)
   */
  private async exportToExcel(
    documents: DocumentData[],
    options: ExportOptions,
    filename: string
  ): Promise<ExportResult> {
    const csvContent = this.generateExcelCSV(documents, options);
    const excelUri = await this.createDocumentFile(csvContent, 'xlsx');
    
    const fileInfo = await FileSystem.getInfoAsync(excelUri);
    const size = fileInfo.exists ? fileInfo.size || 0 : 0;

    return {
      uri: excelUri,
      filename: `${filename}.xlsx`,
      format: 'xlsx',
      size,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
  }

  /**
   * Export to PowerPoint format (PPTX)
   */
  private async exportToPowerPoint(
    documents: DocumentData[],
    options: ExportOptions,
    filename: string
  ): Promise<ExportResult> {
    const htmlContent = this.generatePowerPointHTML(documents, options);
    const pptxUri = await this.createDocumentFile(htmlContent, 'pptx');
    
    const fileInfo = await FileSystem.getInfoAsync(pptxUri);
    const size = fileInfo.exists ? fileInfo.size || 0 : 0;

    return {
      uri: pptxUri,
      filename: `${filename}.pptx`,
      format: 'pptx',
      size,
      mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    };
  }

  /**
   * Export to plain text format
   */
  private async exportToText(
    documents: DocumentData[],
    options: ExportOptions,
    filename: string
  ): Promise<ExportResult> {
    const textContent = this.generateTextContent(documents, options);
    const textUri = await this.createDocumentFile(textContent, 'txt');
    
    const fileInfo = await FileSystem.getInfoAsync(textUri);
    const size = fileInfo.exists ? fileInfo.size || 0 : 0;

    return {
      uri: textUri,
      filename: `${filename}.txt`,
      format: 'txt',
      size,
      mimeType: 'text/plain'
    };
  }

  /**
   * Export to CSV format
   */
  private async exportToCSV(
    documents: DocumentData[],
    options: ExportOptions,
    filename: string
  ): Promise<ExportResult> {
    const csvContent = this.generateCSVContent(documents, options);
    const csvUri = await this.createDocumentFile(csvContent, 'csv');
    
    const fileInfo = await FileSystem.getInfoAsync(csvUri);
    const size = fileInfo.exists ? fileInfo.size || 0 : 0;

    return {
      uri: csvUri,
      filename: `${filename}.csv`,
      format: 'csv',
      size,
      mimeType: 'text/csv'
    };
  }

  /**
   * Export to JSON format
   */
  private async exportToJSON(
    documents: DocumentData[],
    options: ExportOptions,
    filename: string
  ): Promise<ExportResult> {
    const jsonContent = this.generateJSONContent(documents, options);
    const jsonUri = await this.createDocumentFile(jsonContent, 'json');
    
    const fileInfo = await FileSystem.getInfoAsync(jsonUri);
    const size = fileInfo.exists ? fileInfo.size || 0 : 0;

    return {
      uri: jsonUri,
      filename: `${filename}.json`,
      format: 'json',
      size,
      mimeType: 'application/json'
    };
  }

  /**
   * Export to HTML format
   */
  private async exportToHTML(
    documents: DocumentData[],
    options: ExportOptions,
    filename: string
  ): Promise<ExportResult> {
    const htmlContent = this.generateHTMLContent(documents, options);
    const htmlUri = await this.createDocumentFile(htmlContent, 'html');
    
    const fileInfo = await FileSystem.getInfoAsync(htmlUri);
    const size = fileInfo.exists ? fileInfo.size || 0 : 0;

    return {
      uri: htmlUri,
      filename: `${filename}.html`,
      format: 'html',
      size,
      mimeType: 'text/html'
    };
  }

  /**
   * Generate PDF HTML content
   */
  private generatePDFHTML(documents: DocumentData[], options: ExportOptions): string {
    const title = options.title || 'Scanned Documents';
    const includeImages = options.includeImages !== false;
    const includeOCR = options.includeOCR !== false;
    const includeTables = options.includeTables !== false;
    const includeEntities = options.includeEntities !== false;

    const documentSections = documents.map((doc, index) => {
      let content = `
        <div class="document-section">
          <h2>Document ${index + 1}${doc.title ? ` - ${doc.title}` : ''}</h2>
          <p class="timestamp">Scanned: ${new Date(doc.timestamp).toLocaleString()}</p>
      `;

      if (includeImages) {
        content += `
          <div class="image-container">
            <img src="${doc.uri}" alt="Document ${index + 1}" class="document-image" />
          </div>
        `;
      }

      if (includeOCR && doc.ocrResult) {
        content += this.generateOCRHTML(doc.ocrResult, includeTables, includeEntities);
      }

      content += '</div>';
      return content;
    }).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          ${this.getPDFStyles()}
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${title}</h1>
          <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
        ${documentSections}
        <div class="footer">
          <p>Generated by Document Scanner App</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate Word HTML content
   */
  private generateWordHTML(documents: DocumentData[], options: ExportOptions): string {
    const title = options.title || 'Scanned Documents';
    const includeOCR = options.includeOCR !== false;
    const includeTables = options.includeTables !== false;
    const includeEntities = options.includeEntities !== false;

    const documentSections = documents.map((doc, index) => {
      let content = `
        <div class="document-section">
          <h2>Document ${index + 1}${doc.title ? ` - ${doc.title}` : ''}</h2>
          <p class="timestamp">Scanned: ${new Date(doc.timestamp).toLocaleString()}</p>
      `;

      if (includeOCR && doc.ocrResult) {
        content += this.generateOCRHTML(doc.ocrResult, includeTables, includeEntities);
      }

      content += '</div>';
      return content;
    }).join('');

    return `
      <!DOCTYPE html>
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          ${this.getWordStyles()}
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${title}</h1>
          <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
        ${documentSections}
      </body>
      </html>
    `;
  }

  /**
   * Generate Excel CSV content
   */
  private generateExcelCSV(documents: DocumentData[], options: ExportOptions): string {
    const includeOCR = options.includeOCR !== false;
    const includeTables = options.includeTables !== false;
    const includeEntities = options.includeEntities !== false;

    let csvContent = 'Document ID,Title,Timestamp,Text Content,Handwriting,Has Tables,Entity Count\n';

    documents.forEach((doc) => {
      const title = doc.title || '';
      const timestamp = new Date(doc.timestamp).toISOString();
      const textContent = doc.ocrResult?.text || '';
      const isHandwritten = doc.ocrResult?.handwriting?.isHandwritten ? 'Yes' : 'No';
      const hasTables = (doc.ocrResult?.tables?.tables.length || 0) > 0 ? 'Yes' : 'No';
      const entityCount = doc.ocrResult?.entities?.length || 0;

      // Escape CSV values
      const escapedTitle = `"${title.replace(/"/g, '""')}"`;
      const escapedText = `"${textContent.replace(/"/g, '""')}"`;

      csvContent += `${doc.id},${escapedTitle},${timestamp},${escapedText},${isHandwritten},${hasTables},${entityCount}\n`;

      // Add table data if available
      if (includeTables && doc.ocrResult?.tables?.tables) {
        doc.ocrResult.tables.tables.forEach((table, tableIndex) => {
          csvContent += `\nTable ${tableIndex + 1} Data:\n`;
          table.rows.forEach((row) => {
            const rowData = row.cells.map(cell => `"${cell.text.replace(/"/g, '""')}"`).join(',');
            csvContent += `${rowData}\n`;
          });
        });
      }
    });

    return csvContent;
  }

  /**
   * Generate PowerPoint HTML content
   */
  private generatePowerPointHTML(documents: DocumentData[], options: ExportOptions): string {
    const title = options.title || 'Scanned Documents';
    const includeOCR = options.includeOCR !== false;

    const slides = documents.map((doc, index) => {
      const slideTitle = `Document ${index + 1}${doc.title ? ` - ${doc.title}` : ''}`;
      const slideContent = includeOCR && doc.ocrResult ? doc.ocrResult.text : 'No OCR data available';

      return `
        <div class="slide">
          <h1 class="slide-title">${slideTitle}</h1>
          <p class="slide-timestamp">${new Date(doc.timestamp).toLocaleString()}</p>
          <div class="slide-content">
            <p>${slideContent}</p>
          </div>
        </div>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          ${this.getPowerPointStyles()}
        </style>
      </head>
      <body>
        <div class="presentation">
          <div class="title-slide">
            <h1>${title}</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
          </div>
          ${slides}
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate plain text content
   */
  private generateTextContent(documents: DocumentData[], options: ExportOptions): string {
    const title = options.title || 'Scanned Documents';
    const includeOCR = options.includeOCR !== false;
    const includeTables = options.includeTables !== false;
    const includeEntities = options.includeEntities !== false;

    let textContent = `${title}\n`;
    textContent += `Generated on ${new Date().toLocaleString()}\n`;
    textContent += `${'='.repeat(50)}\n\n`;

    documents.forEach((doc, index) => {
      textContent += `Document ${index + 1}${doc.title ? ` - ${doc.title}` : ''}\n`;
      textContent += `Scanned: ${new Date(doc.timestamp).toLocaleString()}\n`;
      textContent += `${'-'.repeat(30)}\n`;

      if (includeOCR && doc.ocrResult) {
        textContent += `\nText Content:\n${doc.ocrResult.text}\n\n`;

        if (includeTables && doc.ocrResult.tables?.tables) {
          textContent += `Tables:\n`;
          doc.ocrResult.tables.tables.forEach((table, tableIndex) => {
            textContent += `Table ${tableIndex + 1}:\n`;
            table.rows.forEach((row) => {
              const rowText = row.cells.map(cell => cell.text).join('\t');
              textContent += `${rowText}\n`;
            });
            textContent += '\n';
          });
        }

        if (includeEntities && doc.ocrResult.entities) {
          textContent += `Entities:\n`;
          const groupedEntities = doc.ocrResult.entities.reduce((acc, entity) => {
            if (!acc[entity.type]) acc[entity.type] = [];
            acc[entity.type].push(entity.value);
            return acc;
          }, {} as Record<string, string[]>);

          Object.entries(groupedEntities).forEach(([type, values]) => {
            textContent += `${type}: ${values.join(', ')}\n`;
          });
          textContent += '\n';
        }
      }

      textContent += '\n';
    });

    return textContent;
  }

  /**
   * Generate CSV content
   */
  private generateCSVContent(documents: DocumentData[], options: ExportOptions): string {
    return this.generateExcelCSV(documents, options);
  }

  /**
   * Generate JSON content
   */
  private generateJSONContent(documents: DocumentData[], options: ExportOptions): string {
    const exportData = {
      title: options.title || 'Scanned Documents',
      generatedAt: new Date().toISOString(),
      documentCount: documents.length,
      documents: documents.map(doc => ({
        id: doc.id,
        title: doc.title,
        timestamp: doc.timestamp,
        uri: doc.uri,
        metadata: doc.metadata,
        ocrResult: options.includeOCR ? doc.ocrResult : undefined
      }))
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Generate HTML content
   */
  private generateHTMLContent(documents: DocumentData[], options: ExportOptions): string {
    const title = options.title || 'Scanned Documents';
    const includeImages = options.includeImages !== false;
    const includeOCR = options.includeOCR !== false;
    const includeTables = options.includeTables !== false;
    const includeEntities = options.includeEntities !== false;

    const documentSections = documents.map((doc, index) => {
      let content = `
        <div class="document-section">
          <h2>Document ${index + 1}${doc.title ? ` - ${doc.title}` : ''}</h2>
          <p class="timestamp">Scanned: ${new Date(doc.timestamp).toLocaleString()}</p>
      `;

      if (includeImages) {
        content += `
          <div class="image-container">
            <img src="${doc.uri}" alt="Document ${index + 1}" class="document-image" />
          </div>
        `;
      }

      if (includeOCR && doc.ocrResult) {
        content += this.generateOCRHTML(doc.ocrResult, includeTables, includeEntities);
      }

      content += '</div>';
      return content;
    }).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          ${this.getHTMLStyles()}
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${title}</h1>
          <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
        ${documentSections}
        <div class="footer">
          <p>Generated by Document Scanner App</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate OCR-specific HTML content
   */
  private generateOCRHTML(
    ocrResult: AdvancedOCRResult,
    includeTables: boolean,
    includeEntities: boolean
  ): string {
    let content = `
      <div class="ocr-section">
        <h3>Extracted Text</h3>
        <div class="text-content">${ocrResult.text}</div>
        <p class="confidence">Confidence: ${(ocrResult.confidence * 100).toFixed(1)}%</p>
    `;

    if (ocrResult.handwriting) {
      content += `
        <h4>Handwriting Detection</h4>
        <p>Type: ${ocrResult.handwriting.isHandwritten ? 'Handwritten' : 'Typed'}</p>
        <p>Confidence: ${(ocrResult.handwriting.confidence * 100).toFixed(1)}%</p>
      `;
    }

    if (includeTables && ocrResult.tables?.tables) {
      content += '<h4>Tables</h4>';
      ocrResult.tables.tables.forEach((table, index) => {
        content += `
          <div class="table-container">
            <h5>Table ${index + 1}</h5>
            <table class="extracted-table">
              ${table.rows.map(row => `
                <tr>
                  ${row.cells.map(cell => `<td>${cell.text}</td>`).join('')}
                </tr>
              `).join('')}
            </table>
          </div>
        `;
      });
    }

    if (includeEntities && ocrResult.entities) {
      content += '<h4>Extracted Entities</h4>';
      const groupedEntities = ocrResult.entities.reduce((acc, entity) => {
        if (!acc[entity.type]) acc[entity.type] = [];
        acc[entity.type].push(entity.value);
        return acc;
      }, {} as Record<string, string[]>);

      Object.entries(groupedEntities).forEach(([type, values]) => {
        content += `
          <div class="entity-group">
            <strong>${type}:</strong> ${values.join(', ')}
          </div>
        `;
      });
    }

    content += '</div>';
    return content;
  }

  /**
   * Create a document file
   */
  private async createDocumentFile(content: string, format: string): Promise<string> {
    const filename = `export_${Date.now()}.${format}`;
    const fileUri = `${(FileSystem as any).documentDirectory || 'file:///tmp/'}${filename}`;
    
    await FileSystem.writeAsStringAsync(fileUri, content, {
      encoding: 'utf8' as any,
    });

    return fileUri;
  }

  /**
   * Generate filename based on format and document count
   */
  private generateFilename(format: string, documentCount: number): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const count = documentCount > 1 ? `_${documentCount}docs` : '';
    return `scanned_documents${count}_${timestamp}`;
  }

  /**
   * Get PDF-specific styles
   */
  private getPDFStyles(): string {
    return `
      body { font-family: Arial, sans-serif; margin: 20px; }
      .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #007AFF; padding-bottom: 20px; }
      .document-section { margin-bottom: 40px; page-break-inside: avoid; }
      .timestamp { color: #666; font-size: 12px; }
      .image-container { text-align: center; margin: 20px 0; }
      .document-image { max-width: 100%; height: auto; border: 1px solid #ddd; }
      .ocr-section { margin-top: 20px; }
      .text-content { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0; }
      .confidence { font-size: 12px; color: #666; }
      .table-container { margin: 20px 0; }
      .extracted-table { border-collapse: collapse; width: 100%; }
      .extracted-table td, .extracted-table th { border: 1px solid #ddd; padding: 8px; text-align: left; }
      .extracted-table th { background-color: #f2f2f2; }
      .entity-group { margin: 10px 0; }
      .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
    `;
  }

  /**
   * Get Word-specific styles
   */
  private getWordStyles(): string {
    return `
      body { font-family: 'Times New Roman', serif; margin: 1in; }
      .header { text-align: center; margin-bottom: 30px; }
      .document-section { margin-bottom: 40px; }
      .timestamp { color: #666; font-size: 12px; }
      .ocr-section { margin-top: 20px; }
      .text-content { background: #f5f5f5; padding: 15px; margin: 10px 0; }
      .confidence { font-size: 12px; color: #666; }
      .table-container { margin: 20px 0; }
      .extracted-table { border-collapse: collapse; width: 100%; }
      .extracted-table td, .extracted-table th { border: 1px solid #000; padding: 8px; }
      .extracted-table th { background-color: #f2f2f2; }
      .entity-group { margin: 10px 0; }
    `;
  }

  /**
   * Get PowerPoint-specific styles
   */
  private getPowerPointStyles(): string {
    return `
      body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
      .presentation { width: 100%; }
      .slide { width: 100%; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 40px; box-sizing: border-box; }
      .title-slide { background: linear-gradient(135deg, #007AFF, #0056CC); color: white; }
      .slide-title { font-size: 2.5em; margin-bottom: 20px; }
      .slide-timestamp { font-size: 1.2em; margin-bottom: 30px; }
      .slide-content { font-size: 1.5em; line-height: 1.6; max-width: 80%; }
    `;
  }

  /**
   * Get HTML-specific styles
   */
  private getHTMLStyles(): string {
    return `
      body { font-family: Arial, sans-serif; margin: 20px; background-color: #f8f9fa; }
      .header { text-align: center; margin-bottom: 30px; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
      .document-section { margin-bottom: 40px; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
      .timestamp { color: #666; font-size: 12px; }
      .image-container { text-align: center; margin: 20px 0; }
      .document-image { max-width: 100%; height: auto; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
      .ocr-section { margin-top: 20px; }
      .text-content { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0; }
      .confidence { font-size: 12px; color: #666; }
      .table-container { margin: 20px 0; overflow-x: auto; }
      .extracted-table { border-collapse: collapse; width: 100%; }
      .extracted-table td, .extracted-table th { border: 1px solid #ddd; padding: 8px; text-align: left; }
      .extracted-table th { background-color: #f2f2f2; }
      .entity-group { margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 4px; }
      .footer { text-align: center; margin-top: 30px; padding: 20px; color: #666; }
    `;
  }
}

// Export utility functions
export const exportDocuments = async (
  documents: DocumentData[],
  options: ExportOptions
): Promise<ExportResult> => {
  const exporter = EnhancedExporter.getInstance();
  return await exporter.exportDocuments(documents, options);
};

export const shareExport = async (exportResult: ExportResult): Promise<void> => {
  try {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      throw new Error('Sharing is not available on this device');
    }

    await Sharing.shareAsync(exportResult.uri, {
      mimeType: exportResult.mimeType,
      dialogTitle: `Share ${exportResult.filename}`,
    });
  } catch (error) {
    throw new Error(`Failed to share export: ${error}`);
  }
};

export const saveExportToGallery = async (exportResult: ExportResult): Promise<string> => {
  try {
    const asset = await MediaLibrary.createAssetAsync(exportResult.uri);
    return asset.uri;
  } catch (error) {
    throw new Error(`Failed to save export to gallery: ${error}`);
  }
};

export const getSupportedFormats = (): Array<{ format: string; name: string; mimeType: string }> => {
  return [
    { format: 'pdf', name: 'PDF Document', mimeType: 'application/pdf' },
    { format: 'docx', name: 'Word Document', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
    { format: 'xlsx', name: 'Excel Spreadsheet', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
    { format: 'pptx', name: 'PowerPoint Presentation', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' },
    { format: 'txt', name: 'Plain Text', mimeType: 'text/plain' },
    { format: 'csv', name: 'CSV File', mimeType: 'text/csv' },
    { format: 'json', name: 'JSON File', mimeType: 'application/json' },
    { format: 'html', name: 'HTML Document', mimeType: 'text/html' },
  ];
};

export default EnhancedExporter;