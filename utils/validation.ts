// Input validation utilities for production

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class InputValidator {
  /**
   * Validate image URI
   */
  static validateImageUri(uri: string): ValidationResult {
    const errors: string[] = [];

    if (!uri || typeof uri !== 'string') {
      errors.push('Image URI is required and must be a string');
      return { isValid: false, errors };
    }

    // Check URI format
    if (!uri.startsWith('file://') && !uri.startsWith('data:image/') && !uri.startsWith('http')) {
      errors.push('Invalid image URI format');
    }

    // Check file extension
    const validExtensions = ['.jpg', '.jpeg', '.png', '.bmp', '.gif', '.webp'];
    const hasValidExtension = validExtensions.some(ext => 
      uri.toLowerCase().includes(ext)
    );

    if (!hasValidExtension && !uri.startsWith('data:image/')) {
      errors.push('Unsupported image format. Supported formats: JPG, PNG, BMP, GIF, WEBP');
    }

    // Check URI length (prevent extremely long URIs)
    if (uri.length > 10000) {
      errors.push('Image URI is too long');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate document type
   */
  static validateDocumentType(type: any): ValidationResult {
    const errors: string[] = [];

    if (!type || typeof type !== 'object') {
      errors.push('Document type is required and must be an object');
      return { isValid: false, errors };
    }

    if (!type.id || typeof type.id !== 'string') {
      errors.push('Document type ID is required and must be a string');
    }

    if (!type.name || typeof type.name !== 'string') {
      errors.push('Document type name is required and must be a string');
    }

    if (typeof type.aspectRatio !== 'number' || type.aspectRatio <= 0) {
      errors.push('Document type aspect ratio must be a positive number');
    }

    if (type.maxDocuments && (typeof type.maxDocuments !== 'number' || type.maxDocuments <= 0)) {
      errors.push('Document type maxDocuments must be a positive number');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate OCR options
   */
  static validateOCROptions(options: any): ValidationResult {
    const errors: string[] = [];

    if (!options || typeof options !== 'object') {
      errors.push('OCR options must be an object');
      return { isValid: false, errors };
    }

    if (options.language && typeof options.language !== 'string') {
      errors.push('OCR language must be a string');
    }

    if (options.confidence && (typeof options.confidence !== 'number' || options.confidence < 0 || options.confidence > 1)) {
      errors.push('OCR confidence must be a number between 0 and 1');
    }

    if (options.timeout && (typeof options.timeout !== 'number' || options.timeout <= 0)) {
      errors.push('OCR timeout must be a positive number');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate image processing options
   */
  static validateImageProcessingOptions(options: any): ValidationResult {
    const errors: string[] = [];

    if (!options || typeof options !== 'object') {
      errors.push('Image processing options must be an object');
      return { isValid: false, errors };
    }

    if (options.contrast && (typeof options.contrast !== 'number' || options.contrast < 0 || options.contrast > 3)) {
      errors.push('Contrast must be a number between 0 and 3');
    }

    if (options.brightness && (typeof options.brightness !== 'number' || options.brightness < -1 || options.brightness > 1)) {
      errors.push('Brightness must be a number between -1 and 1');
    }

    if (options.saturation && (typeof options.saturation !== 'number' || options.saturation < 0 || options.saturation > 2)) {
      errors.push('Saturation must be a number between 0 and 2');
    }

    if (options.quality && (typeof options.quality !== 'number' || options.quality < 0.1 || options.quality > 1)) {
      errors.push('Quality must be a number between 0.1 and 1');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate file size
   */
  static validateFileSize(size: number, maxSize: number = 10 * 1024 * 1024): ValidationResult {
    const errors: string[] = [];

    if (typeof size !== 'number' || size < 0) {
      errors.push('File size must be a non-negative number');
      return { isValid: false, errors };
    }

    if (size > maxSize) {
      errors.push(`File size exceeds maximum allowed size of ${Math.round(maxSize / 1024 / 1024)}MB`);
    }

    if (size === 0) {
      errors.push('File size cannot be zero');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate document corners
   */
  static validateDocumentCorners(corners: any): ValidationResult {
    const errors: string[] = [];

    if (!corners || typeof corners !== 'object') {
      errors.push('Document corners must be an object');
      return { isValid: false, errors };
    }

    const requiredCorners = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'];
    
    for (const corner of requiredCorners) {
      if (!corners[corner] || typeof corners[corner] !== 'object') {
        errors.push(`Missing or invalid ${corner} corner`);
        continue;
      }

      const { x, y } = corners[corner];
      if (typeof x !== 'number' || typeof y !== 'number') {
        errors.push(`${corner} corner coordinates must be numbers`);
      }

      if (x < 0 || y < 0) {
        errors.push(`${corner} corner coordinates must be non-negative`);
      }
    }

    // Validate corner relationships
    if (corners.topLeft && corners.topRight && corners.bottomLeft && corners.bottomRight) {
      const { topLeft, topRight, bottomLeft, bottomRight } = corners;
      
      if (topLeft.x >= topRight.x) {
        errors.push('Top-left X must be less than top-right X');
      }
      
      if (topLeft.y >= bottomLeft.y) {
        errors.push('Top-left Y must be less than bottom-left Y');
      }
      
      if (bottomLeft.x >= bottomRight.x) {
        errors.push('Bottom-left X must be less than bottom-right X');
      }
      
      if (topRight.y >= bottomRight.y) {
        errors.push('Top-right Y must be less than bottom-right Y');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate camera permissions
   */
  static validateCameraPermissions(permissions: any): ValidationResult {
    const errors: string[] = [];

    if (!permissions || typeof permissions !== 'object') {
      errors.push('Camera permissions must be an object');
      return { isValid: false, errors };
    }

    if (!permissions.status || typeof permissions.status !== 'string') {
      errors.push('Camera permission status is required');
    }

    if (permissions.status && !['granted', 'denied', 'undetermined'].includes(permissions.status)) {
      errors.push('Invalid camera permission status');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Sanitize text input
   */
  static sanitizeText(text: string, maxLength: number = 10000): string {
    if (typeof text !== 'string') {
      return '';
    }

    // Remove potentially dangerous characters
    let sanitized = text
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/data:/gi, '') // Remove data: protocol
      .trim();

    // Limit length
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
  }

  /**
   * Validate email format
   */
  static validateEmail(email: string): ValidationResult {
    const errors: string[] = [];

    if (!email || typeof email !== 'string') {
      errors.push('Email is required and must be a string');
      return { isValid: false, errors };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push('Invalid email format');
    }

    if (email.length > 254) {
      errors.push('Email is too long');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate phone number format
   */
  static validatePhoneNumber(phone: string): ValidationResult {
    const errors: string[] = [];

    if (!phone || typeof phone !== 'string') {
      errors.push('Phone number is required and must be a string');
      return { isValid: false, errors };
    }

    // Remove all non-digit characters
    const digitsOnly = phone.replace(/\D/g, '');
    
    if (digitsOnly.length < 10 || digitsOnly.length > 15) {
      errors.push('Phone number must be between 10 and 15 digits');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default InputValidator;