import { User, StoredFile, ClientPortal } from './types.ts';

const TOKEN_KEY = 'clientvault_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  const contentType = res.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const errorMsg = (data && data.error) || (typeof data === 'string' ? data : 'Request failed');
    throw new Error(errorMsg);
  }

  return data as T;
}

export async function login(email: string, password: string): Promise<{ user: User; token: string }> {
  const data = await request<{ user: User; token: string }>('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  setStoredToken(data.token);
  return data;
}

export async function register(
  email: string,
  password: string,
  name: string,
  company?: string
): Promise<{ user: User; token: string }> {
  const data = await request<{ user: User; token: string }>('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name, company }),
  });
  setStoredToken(data.token);
  return data;
}

export async function getCurrentUser(): Promise<User | null> {
  const token = getStoredToken();
  if (!token) return null;
  try {
    const data = await request<{ user: User }>('/api/auth/me');
    return data.user;
  } catch (err) {
    setStoredToken(null);
    return null;
  }
}

export async function logout(): Promise<void> {
  try {
    await request('/api/auth/logout', { method: 'POST' });
  } finally {
    setStoredToken(null);
  }
}

export async function getFiles(): Promise<StoredFile[]> {
  const data = await request<{ files: StoredFile[] }>('/api/files');
  return data.files;
}

export async function uploadFiles(
  files: File[],
  clientName: string,
  notes: string
): Promise<{ message: string; files: StoredFile[] }> {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  formData.append('clientName', clientName);
  formData.append('notes', notes);

  return request<{ message: string; files: StoredFile[] }>('/api/files/upload', {
    method: 'POST',
    body: formData,
  });
}

export async function deleteFile(id: string): Promise<void> {
  await request(`/api/files/${id}`, {
    method: 'DELETE',
  });
}

export function getFileDownloadUrl(id: string): string {
  const token = getStoredToken();
  return `/api/files/${id}/download?token=${encodeURIComponent(token || '')}`;
}

export function getFilePreviewUrl(id: string): string {
  const token = getStoredToken();
  return `/api/files/${id}/preview?token=${encodeURIComponent(token || '')}`;
}

export async function getPortals(): Promise<ClientPortal[]> {
  const data = await request<{ portals: ClientPortal[] }>('/api/portals');
  return data.portals;
}

export async function createPortal(
  clientName: string,
  clientEmail?: string,
  description?: string
): Promise<ClientPortal> {
  const data = await request<{ portal: ClientPortal }>('/api/portals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientName, clientEmail, description }),
  });
  return data.portal;
}

export async function getPublicPortal(slug: string): Promise<{
  clientName: string;
  slug: string;
  description: string;
  createdAt: string;
  freelancerName: string;
  company: string;
}> {
  const data = await request<{ portal: any }>(`/api/public/portal/${slug}`);
  return data.portal;
}

export async function uploadPublicPortalFiles(
  slug: string,
  files: File[],
  uploaderName: string,
  notes: string
): Promise<{ message: string; count: number }> {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  formData.append('uploaderName', uploaderName);
  formData.append('notes', notes);

  return request<{ message: string; count: number }>(`/api/public/portal/${slug}/upload`, {
    method: 'POST',
    body: formData,
  });
}
