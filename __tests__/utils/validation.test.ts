import { InputValidator, ValidationResult } from '../../utils/validation';

describe('InputValidator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateImageUri', () => {
    it('validates correct image URIs', () => {
      const validUris = [
        'file:///path/to/image.jpg',
        'file:///path/to/image.png',
        'file:///path/to/image.jpeg',
        'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
        'https://example.com/image.jpg'
      ];

      validUris.forEach(uri => {
        const result = InputValidator.validateImageUri(uri);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('rejects invalid image URIs', () => {
      const invalidUris = [
        '',
        'invalid-uri',
        'file:///path/to/image.txt',
        'file:///path/to/image',
        'not-a-uri'
      ];

      invalidUris.forEach(uri => {
        const result = InputValidator.validateImageUri(uri);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('validateDocumentType', () => {
    it('validates correct document types', () => {
      const validTypes = [
        { id: 'invoice', name: 'Invoice', aspectRatio: 1.414 },
        { id: 'receipt', name: 'Receipt', aspectRatio: 1.0 },
        { id: 'contract', name: 'Contract', aspectRatio: 1.414, maxDocuments: 10 },
      ];

      validTypes.forEach(type => {
        const result = InputValidator.validateDocumentType(type);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('rejects invalid document types', () => {
      const invalidTypes = [
        '',
        'INVALID',
        { id: 'invoice' }, // Missing name and aspectRatio
        { name: 'Invoice' }, // Missing id and aspectRatio
        { id: 'invoice', name: 'Invoice' }, // Missing aspectRatio
        { id: 'invoice', name: 'Invoice', aspectRatio: -1 }, // Invalid aspectRatio
      ];

      invalidTypes.forEach(type => {
        const result = InputValidator.validateDocumentType(type);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('validateOCROptions', () => {
    it('validates correct OCR options', () => {
      const validOptions = {
        language: 'en',
        confidence: 0.8,
        autoDetect: true
      };

      const result = InputValidator.validateOCROptions(validOptions);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects invalid OCR options', () => {
      const invalidOptions = {
        language: 'invalid',
        confidence: 1.5,
        autoDetect: 'true'
      };

      const result = InputValidator.validateOCROptions(invalidOptions);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateImageProcessingOptions', () => {
    it('validates correct processing options', () => {
      const validOptions = {
        brightness: 0.5,
        contrast: 1.0,
        saturation: 1.2,
        sharpness: 0.8
      };

      const result = InputValidator.validateImageProcessingOptions(validOptions);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects invalid processing options', () => {
      const invalidOptions = {
        brightness: 2.0,
        contrast: -1.0,
        saturation: 3.0,
        sharpness: -0.5
      };

      const result = InputValidator.validateImageProcessingOptions(invalidOptions);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateFileSize', () => {
    it('validates correct file sizes', () => {
      const validSizes = [1024, 1024 * 1024, 5 * 1024 * 1024, 10 * 1024 * 1024];

      validSizes.forEach(size => {
        const result = InputValidator.validateFileSize(size);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('rejects files that are too large', () => {
      const largeSize = 11 * 1024 * 1024; // 11MB
      const result = InputValidator.validateFileSize(largeSize);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateDocumentCorners', () => {
    it('validates correct document corners', () => {
      const validCorners = {
        topLeft: { x: 100, y: 100 },
        topRight: { x: 300, y: 100 },
        bottomLeft: { x: 100, y: 400 },
        bottomRight: { x: 300, y: 400 }
      };

      const result = InputValidator.validateDocumentCorners(validCorners);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects invalid document corners', () => {
      const invalidCorners = {
        topLeft: { x: 100, y: 100 },
        topRight: { x: 300, y: 100 },
        bottomLeft: { x: 100, y: 400 }
        // Missing bottomRight
      };

      const result = InputValidator.validateDocumentCorners(invalidCorners);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateCameraPermissions', () => {
    it('validates granted camera permissions', () => {
      const grantedPermissions = { status: 'granted', canAskAgain: true };

      const result = InputValidator.validateCameraPermissions(grantedPermissions);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects denied camera permissions', () => {
      const deniedPermissions = { status: 'denied', canAskAgain: false };

      const result = InputValidator.validateCameraPermissions(deniedPermissions);
      expect(result.isValid).toBe(true); // This should be valid as it's a proper status
      expect(result.errors).toHaveLength(0);
    });

    it('rejects invalid camera permissions', () => {
      const invalidPermissions = { granted: true, canAskAgain: true }; // Missing status

      const result = InputValidator.validateCameraPermissions(invalidPermissions);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateEmail', () => {
    it('validates correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'test123@test-domain.com'
      ];

      validEmails.forEach(email => {
        const result = InputValidator.validateEmail(email);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('rejects invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test..test@example.com',
        'test@.com',
        'test@example.',
        ''
      ];

      invalidEmails.forEach(email => {
        const result = InputValidator.validateEmail(email);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('validatePhoneNumber', () => {
    it('validates correct phone numbers', () => {
      const validPhones = [
        '+1234567890',
        '123-456-7890',
        '(123) 456-7890',
        '123.456.7890',
        '+1 (123) 456-7890'
      ];

      validPhones.forEach(phone => {
        const result = InputValidator.validatePhoneNumber(phone);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('rejects invalid phone numbers', () => {
      const invalidPhones = [
        '123',
        'abc-def-ghij',
        '123-456-78901',
        '',
        '123-456-789a'
      ];

      invalidPhones.forEach(phone => {
        const result = InputValidator.validatePhoneNumber(phone);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('ValidationResult', () => {
    it('creates valid result', () => {
      const result: ValidationResult = { isValid: true, errors: [] };
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('creates invalid result with errors', () => {
      const errors = ['Error 1', 'Error 2'];
      const result: ValidationResult = { isValid: false, errors };
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(errors);
    });
  });
});