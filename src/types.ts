export interface User {
  id: string;
  email: string;
  name: string;
  company: string;
  role: 'freelancer' | 'client';
}

export interface StoredFile {
  id: string;
  userId: string;
  originalName: string;
  storageName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  clientName: string;
  notes: string;
  portalSlug?: string;
  downloadCount: number;
}

export interface ClientPortal {
  id: string;
  userId: string;
  clientName: string;
  clientEmail: string;
  slug: string;
  description: string;
  createdAt: string;
  fileCount?: number;
  totalBytes?: number;
}

export type ActiveTab = 'dashboard' | 'settings';
