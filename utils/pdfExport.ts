// import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export interface ScannedDocument {
  id: string;
  uri: string;
  side: 'front' | 'back' | 'single';
  timestamp: number;
}

export interface PDFExportOptions {
  title?: string;
  includeMetadata?: boolean;
  quality?: 'low' | 'medium' | 'high';
}

export const generatePDF = async (
  documents: ScannedDocument[],
  options: PDFExportOptions = {}
): Promise<string> => {
  const {
    title = 'Scanned Documents',
    includeMetadata = true,
    quality = 'high'
  } = options;

  try {
    // Create HTML content for PDF
    const htmlContent = createHTMLContent(documents, title, includeMetadata);
    
    // Generate PDF
    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false,
    });

    return uri;
  } catch (error) {
    throw new Error(`Failed to generate PDF: ${error}`);
  }
};

export const savePDFToGallery = async (pdfUri: string, filename?: string): Promise<string> => {
  try {
    const asset = await MediaLibrary.createAssetAsync(pdfUri);
    return asset.uri;
  } catch (error) {
    throw new Error(`Failed to save PDF to gallery: ${error}`);
  }
};

export const sharePDF = async (pdfUri: string, title?: string): Promise<void> => {
  try {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      throw new Error('Sharing is not available on this device');
    }

    await Sharing.shareAsync(pdfUri, {
      mimeType: 'application/pdf',
      dialogTitle: title || 'Share PDF Document',
    });
  } catch (error) {
    throw new Error(`Failed to share PDF: ${error}`);
  }
};

export const exportBatchAsPDF = async (
  documents: ScannedDocument[],
  documentType: string,
  options: PDFExportOptions = {}
): Promise<{ pdfUri: string; filename: string }> => {
  try {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${documentType}_${timestamp}.pdf`;
    
    const pdfUri = await generatePDF(documents, {
      ...options,
      title: `${documentType} - ${timestamp}`,
    });

    return { pdfUri, filename };
  } catch (error) {
    throw new Error(`Failed to export batch as PDF: ${error}`);
  }
};

const createHTMLContent = (
  documents: ScannedDocument[],
  title: string,
  includeMetadata: boolean
): string => {
  const documentImages = documents.map((doc, index) => {
    const sideText = doc.side === 'single' ? 'Document' : 
                    doc.side === 'front' ? 'Front Side' : 'Back Side';
    
    return `
      <div class="document-page">
        <div class="document-header">
          <h3>${sideText} ${doc.side !== 'single' ? `- Page ${index + 1}` : ''}</h3>
          ${includeMetadata ? `<p class="timestamp">Scanned: ${new Date(doc.timestamp).toLocaleString()}</p>` : ''}
        </div>
        <div class="document-image">
          <img src="${doc.uri}" alt="${sideText}" />
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
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 0;
          padding: 20px;
          background-color: #f8f9fa;
        }
        
        .pdf-header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #007AFF;
        }
        
        .pdf-title {
          color: #1a1a1a;
          font-size: 24px;
          font-weight: bold;
          margin: 0 0 10px 0;
        }
        
        .pdf-subtitle {
          color: #666;
          font-size: 16px;
          margin: 0;
        }
        
        .document-page {
          page-break-after: always;
          margin-bottom: 30px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        
        .document-page:last-child {
          page-break-after: avoid;
        }
        
        .document-header {
          background: #007AFF;
          color: white;
          padding: 15px 20px;
          margin: 0;
        }
        
        .document-header h3 {
          margin: 0 0 5px 0;
          font-size: 18px;
          font-weight: 600;
        }
        
        .timestamp {
          margin: 0;
          font-size: 12px;
          opacity: 0.8;
        }
        
        .document-image {
          padding: 20px;
          text-align: center;
        }
        
        .document-image img {
          max-width: 100%;
          height: auto;
          border-radius: 4px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.1);
        }
        
        .pdf-footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e5ea;
          color: #666;
          font-size: 12px;
        }
        
        @media print {
          body {
            background-color: white;
          }
          
          .document-page {
            box-shadow: none;
            border: 1px solid #e5e5ea;
          }
        }
      </style>
    </head>
    <body>
      <div class="pdf-header">
        <h1 class="pdf-title">${title}</h1>
        <p class="pdf-subtitle">Generated on ${new Date().toLocaleString()}</p>
      </div>
      
      ${documentImages}
      
      <div class="pdf-footer">
        <p>Generated by Document Scanner App</p>
        <p>Total Documents: ${documents.length}</p>
      </div>
    </body>
    </html>
  `;
};

export const getPDFQuality = (quality: 'low' | 'medium' | 'high') => {
  switch (quality) {
    case 'low':
      return { width: 800, height: 600 };
    case 'medium':
      return { width: 1200, height: 900 };
    case 'high':
    default:
      return { width: 1600, height: 1200 };
  }
};