import * as FileSystem from 'expo-file-system';

/**
 * Utility functions for file system operations using the new Expo filesystem API
 * This replaces the deprecated getInfoAsync method
 */

export interface FileInfo {
  exists: boolean;
  size?: number;
  isDirectory?: boolean;
  modificationTime?: number;
  uri: string;
}

/**
 * Get file information using the new filesystem API
 * This is a replacement for the deprecated getInfoAsync method
 */
export async function getFileInfo(uri: string): Promise<FileInfo> {
  try {
    // Use the new FileSystem API
    const file = new FileSystem.File(uri);
    const info = await file.getInfoAsync();
    
    return {
      exists: info.exists,
      size: info.size,
      isDirectory: info.isDirectory,
      modificationTime: info.modificationTime,
      uri: uri
    };
  } catch (error) {
    console.warn('Failed to get file info with new API, falling back to legacy:', error);
    
    // Fallback to legacy API if new API fails
    try {
      const legacyInfo = await FileSystem.getInfoAsync(uri);
      return {
        exists: legacyInfo.exists,
        size: legacyInfo.size,
        isDirectory: legacyInfo.isDirectory,
        modificationTime: legacyInfo.modificationTime,
        uri: uri
      };
    } catch (legacyError) {
      console.error('Both new and legacy filesystem APIs failed:', legacyError);
      return {
        exists: false,
        size: 0,
        isDirectory: false,
        modificationTime: 0,
        uri: uri
      };
    }
  }
}

/**
 * Check if a file exists
 */
export async function fileExists(uri: string): Promise<boolean> {
  const info = await getFileInfo(uri);
  return info.exists;
}

/**
 * Get file size
 */
export async function getFileSize(uri: string): Promise<number> {
  const info = await getFileInfo(uri);
  return info.size || 0;
}

/**
 * Get file size with fallback
 */
export async function getFileSizeWithFallback(uri: string, fallback: number = 100000): Promise<number> {
  const info = await getFileInfo(uri);
  return info.size || fallback;
}

/**
 * Check if a directory exists
 */
export async function directoryExists(uri: string): Promise<boolean> {
  const info = await getFileInfo(uri);
  return info.exists && info.isDirectory === true;
}

/**
 * Create directory if it doesn't exist
 */
export async function ensureDirectoryExists(uri: string): Promise<void> {
  const exists = await directoryExists(uri);
  if (!exists) {
    await FileSystem.makeDirectoryAsync(uri, { intermediates: true });
  }
}

/**
 * Delete file if it exists
 */
export async function deleteFileIfExists(uri: string): Promise<void> {
  const exists = await fileExists(uri);
  if (exists) {
    await FileSystem.deleteAsync(uri);
  }
}

/**
 * Get file modification time
 */
export async function getFileModificationTime(uri: string): Promise<number> {
  const info = await getFileInfo(uri);
  return info.modificationTime || 0;
}

/**
 * Legacy compatibility function
 * This provides the same interface as the old getInfoAsync for easy migration
 */
export async function getInfoAsync(uri: string): Promise<FileInfo> {
  return getFileInfo(uri);
}
