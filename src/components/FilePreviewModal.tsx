import React, { useEffect, useState } from 'react';
import { X, Download, FileText, Image as ImageIcon, Calendar, HardDrive, User, Check, Copy } from 'lucide-react';
import { StoredFile } from '../types.ts';
import { formatBytes, getFileCategory } from '../utils/file-utils.ts';
import { getFileDownloadUrl, getFilePreviewUrl } from '../api.ts';

interface FilePreviewModalProps {
  file: StoredFile | null;
  onClose: () => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ file, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [isLoadingText, setIsLoadingText] = useState(false);

  useEffect(() => {
    if (!file) return;

    const cat = getFileCategory(file.mimeType, file.originalName);
    if (cat === 'document' && (file.originalName.endsWith('.txt') || file.originalName.endsWith('.md') || file.originalName.endsWith('.json') || file.mimeType === 'text/plain')) {
      setIsLoadingText(true);
      fetch(getFilePreviewUrl(file.id))
        .then((res) => (res.ok ? res.text() : 'Preview not available'))
        .then((txt) => setTextContent(txt))
        .catch(() => setTextContent('Error loading text preview'))
        .finally(() => setIsLoadingText(false));
    } else {
      setTextContent(null);
    }
  }, [file]);

  if (!file) return null;

  const category = getFileCategory(file.mimeType, file.originalName);
  const downloadUrl = getFileDownloadUrl(file.id);
  const previewUrl = getFilePreviewUrl(file.id);

  const handleCopyLink = () => {
    const fullUrl = `${window.location.origin}${downloadUrl}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="min-w-0 pr-4">
            <h3 className="text-sm font-semibold text-slate-900 truncate" title={file.originalName}>
              {file.originalName}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Client: <span className="font-medium text-slate-700">{file.clientName}</span> · {formatBytes(file.sizeBytes)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
            aria-label="Close Preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 flex items-center justify-center min-h-[260px]">
          {category === 'image' ? (
            <div className="max-h-[420px] flex items-center justify-center">
              <img
                src={previewUrl}
                alt={file.originalName}
                referrerPolicy="no-referrer"
                className="max-h-[400px] max-w-full object-contain rounded-lg shadow-sm border border-slate-200"
              />
            </div>
          ) : textContent !== null ? (
            <div className="w-full bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-[380px] whitespace-pre-wrap leading-relaxed">
              {isLoadingText ? 'Loading text preview...' : textContent}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
                {category === 'pdf' ? (
                  <FileText className="w-8 h-8" />
                ) : (
                  <FileText className="w-8 h-8" />
                )}
              </div>
              <p className="text-sm font-semibold text-slate-800">{file.originalName}</p>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                {file.notes || 'No description notes attached to this file.'}
              </p>
            </div>
          )}
        </div>

        {/* File Metadata Details */}
        <div className="px-6 py-3 bg-white border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-600">
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Uploaded</span>
            <span className="font-medium text-slate-800">
              {new Date(file.uploadedAt).toLocaleDateString()}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">File Size</span>
            <span className="font-mono tabular-nums text-slate-800">{formatBytes(file.sizeBytes)}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Format</span>
            <span className="truncate block font-mono text-[11px] text-slate-700">{file.mimeType || 'binary'}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Client</span>
            <span className="font-medium text-slate-800 truncate block">{file.clientName}</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
          <button
            onClick={handleCopyLink}
            className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-white transition-colors flex items-center gap-1.5"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Link Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy Download Link</span>
              </>
            )}
          </button>

          <a
            href={downloadUrl}
            download={file.originalName}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download File</span>
          </a>
        </div>
      </div>
    </div>
  );
};
