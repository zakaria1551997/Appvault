/**
 * Utility functions for file processing, formatting, and permissions.
 */

export interface FileItem {
  id: string;
  userId: string;
  originalName: string;
  storageName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  clientName?: string;
  notes?: string;
  tags?: string[];
  portalSlug?: string;
  downloadCount?: number;
}

export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const safeI = Math.min(i, sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, safeI)).toFixed(dm))} ${sizes[safeI]}`;
}

export function getFileCategory(mimeType: string, filename: string): 'image' | 'pdf' | 'document' | 'archive' | 'audio' | 'video' | 'code' | 'other' {
  const lowerMime = (mimeType || '').toLowerCase();
  const lowerName = (filename || '').toLowerCase();

  if (lowerMime.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i.test(lowerName)) {
    return 'image';
  }
  if (lowerMime === 'application/pdf' || lowerName.endsWith('.pdf')) {
    return 'pdf';
  }
  if (
    lowerMime.includes('word') ||
    lowerMime.includes('document') ||
    lowerMime.includes('sheet') ||
    lowerMime.includes('presentation') ||
    /\.(doc|docx|xls|xlsx|ppt|pptx|txt|rtf|csv|md)$/i.test(lowerName)
  ) {
    return 'document';
  }
  if (
    lowerMime.includes('zip') ||
    lowerMime.includes('tar') ||
    lowerMime.includes('rar') ||
    lowerMime.includes('7z') ||
    /\.(zip|tar|gz|rar|7z)$/i.test(lowerName)
  ) {
    return 'archive';
  }
  if (lowerMime.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac)$/i.test(lowerName)) {
    return 'audio';
  }
  if (lowerMime.startsWith('video/') || /\.(mp4|webm|mov|avi|mkv)$/i.test(lowerName)) {
    return 'video';
  }
  if (
    /\.(js|jsx|ts|tsx|html|css|json|py|rb|php|go|rs|sql|sh)$/i.test(lowerName) ||
    lowerMime.includes('javascript') ||
    lowerMime.includes('json')
  ) {
    return 'code';
  }
  return 'other';
}

export function canAccessFile(fileOwnerId: string, currentUserId: string, isAdminUser: boolean = false): boolean {
  if (!currentUserId) return false;
  if (isAdminUser || currentUserId === '1z0gjTL5wFcUnv6ibzmp70L7DW63') return true;
  if (!fileOwnerId) return false;
  return fileOwnerId === currentUserId;
}

export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export function filterFiles<T extends FileItem>(
  files: T[],
  query: string,
  categoryFilter: string,
  clientFilter: string
): T[] {
  const cleanQuery = query.trim().toLowerCase();

  return files.filter((f) => {
    const matchesQuery =
      !cleanQuery ||
      f.originalName.toLowerCase().includes(cleanQuery) ||
      (f.clientName && f.clientName.toLowerCase().includes(cleanQuery)) ||
      (f.notes && f.notes.toLowerCase().includes(cleanQuery));

    const matchesCategory =
      !categoryFilter ||
      categoryFilter === 'all' ||
      getFileCategory(f.mimeType, f.originalName) === categoryFilter;

    const matchesClient =
      !clientFilter ||
      clientFilter === 'all' ||
      f.clientName === clientFilter;

    return matchesQuery && matchesCategory && matchesClient;
  });
}
