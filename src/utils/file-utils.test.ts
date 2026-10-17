import test from 'node:test';
import assert from 'node:assert/strict';
import { formatBytes, getFileCategory, canAccessFile, filterFiles } from './file-utils.ts';
import type { FileItem } from './file-utils.ts';

test('formatBytes formats file sizes correctly', () => {
  assert.equal(formatBytes(0), '0 B');
  assert.equal(formatBytes(1024), '1 KB');
  assert.equal(formatBytes(1048576), '1 MB');
  assert.equal(formatBytes(5242880), '5 MB');
  assert.equal(formatBytes(2621440), '2.5 MB');
});

test('getFileCategory identifies categories accurately', () => {
  assert.equal(getFileCategory('image/png', 'photo.png'), 'image');
  assert.equal(getFileCategory('image/jpeg', 'header.jpg'), 'image');
  assert.equal(getFileCategory('application/pdf', 'contract.pdf'), 'pdf');
  assert.equal(getFileCategory('text/plain', 'notes.txt'), 'document');
  assert.equal(getFileCategory('application/zip', 'assets.zip'), 'archive');
  assert.equal(getFileCategory('text/javascript', 'script.js'), 'code');
  assert.equal(getFileCategory('application/octet-stream', 'unknown.bin'), 'other');
});

test('canAccessFile enforces user ownership isolation and allows admin access', () => {
  assert.equal(canAccessFile('user-1', 'user-1'), true);
  assert.equal(canAccessFile('user-1', 'user-2'), false);
  assert.equal(canAccessFile('', 'user-1'), false);
  assert.equal(canAccessFile('user-1', ''), false);
  // Admin user ID [1z0gjTL5wFcUnv6ibzmp70L7DW63] has full access
  assert.equal(canAccessFile('user-1', '1z0gjTL5wFcUnv6ibzmp70L7DW63'), true);
  assert.equal(canAccessFile('user-2', 'user-3', true), true);
});

test('filterFiles filters by text query, category, and client', () => {
  const mockFiles: FileItem[] = [
    {
      id: '1',
      userId: 'u1',
      originalName: 'Brand Guidelines.pdf',
      storageName: 's1',
      mimeType: 'application/pdf',
      sizeBytes: 1048576,
      uploadedAt: new Date().toISOString(),
      clientName: 'Acme Corp',
    },
    {
      id: '2',
      userId: 'u1',
      originalName: 'Hero Mockup.png',
      storageName: 's2',
      mimeType: 'image/png',
      sizeBytes: 2097152,
      uploadedAt: new Date().toISOString(),
      clientName: 'Bloom Studio',
    },
    {
      id: '3',
      userId: 'u1',
      originalName: 'Contract.docx',
      storageName: 's3',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      sizeBytes: 524288,
      uploadedAt: new Date().toISOString(),
      clientName: 'Acme Corp',
    },
  ];

  // Query search
  const searchResults = filterFiles(mockFiles, 'Hero', 'all', 'all');
  assert.equal(searchResults.length, 1);
  assert.equal(searchResults[0].originalName, 'Hero Mockup.png');

  // Category filter
  const pdfResults = filterFiles(mockFiles, '', 'pdf', 'all');
  assert.equal(pdfResults.length, 1);
  assert.equal(pdfResults[0].originalName, 'Brand Guidelines.pdf');

  // Client filter
  const acmeResults = filterFiles(mockFiles, '', 'all', 'Acme Corp');
  assert.equal(acmeResults.length, 2);
});
