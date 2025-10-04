export interface DocumentType {
  id: string;
  name: string;
  icon: string;
  description: string;
  aspectRatio: number;
  maxDocuments?: number;
  requiresBothSides?: boolean;
  scanInstructions: string[];
}

export const DOCUMENT_TYPES: DocumentType[] = [
  {
    id: 'id_card',
    name: 'ID Card',
    icon: 'card',
    description: 'Driver\'s license, national ID, or other identification cards',
    aspectRatio: 1.6, // Standard ID card ratio
    maxDocuments: 2, // Front and back
    requiresBothSides: true,
    scanInstructions: [
      'Place your ID card within the frame',
      'Ensure all text is clearly visible',
      'Scan the front side first',
      'Then scan the back side'
    ]
  },
  {
    id: 'passport',
    name: 'Passport',
    icon: 'book',
    description: 'Passport or travel document',
    aspectRatio: 1.4,
    maxDocuments: 1,
    requiresBothSides: false,
    scanInstructions: [
      'Open your passport to the photo page',
      'Place it flat within the frame',
      'Ensure all text and photo are clearly visible',
      'Avoid glare and shadows'
    ]
  },
  {
    id: 'document',
    name: 'Document',
    icon: 'document-text',
    description: 'Standard documents, contracts, forms, or papers',
    aspectRatio: 0.707, // A4 ratio
    maxDocuments: 50,
    requiresBothSides: false,
    scanInstructions: [
      'Place document flat on a clean surface',
      'Ensure document is fully within the frame',
      'Avoid wrinkles and folds',
      'Good lighting helps with text clarity'
    ]
  },
  {
    id: 'receipt',
    name: 'Receipt',
    icon: 'receipt',
    description: 'Receipts, invoices, or small documents',
    aspectRatio: 1.0,
    maxDocuments: 20,
    requiresBothSides: false,
    scanInstructions: [
      'Flatten the receipt completely',
      'Ensure all text is readable',
      'Avoid shadows and glare',
      'Keep receipt within the frame'
    ]
  },
  {
    id: 'business_card',
    name: 'Business Card',
    icon: 'business',
    description: 'Business cards or contact cards',
    aspectRatio: 1.6,
    maxDocuments: 10,
    requiresBothSides: true,
    scanInstructions: [
      'Place business card flat within frame',
      'Ensure all text is clearly visible',
      'Scan front side first',
      'Then scan back side if needed'
    ]
  },
  {
    id: 'certificate',
    name: 'Certificate',
    icon: 'ribbon',
    description: 'Certificates, diplomas, or awards',
    aspectRatio: 0.707,
    maxDocuments: 5,
    requiresBothSides: false,
    scanInstructions: [
      'Place certificate flat and straight',
      'Ensure all text and seals are visible',
      'Avoid shadows and reflections',
      'Keep within the scanning frame'
    ]
  }
];

export const getDocumentTypeById = (id: string): DocumentType | undefined => {
  return DOCUMENT_TYPES.find(type => type.id === id);
};

export const getDocumentTypeIcon = (typeId: string): string => {
  const type = getDocumentTypeById(typeId);
  return type?.icon || 'document';
};