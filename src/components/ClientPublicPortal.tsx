import React, { useState, useEffect, useRef } from 'react';
import { FolderLock, UploadCloud, File, X, CheckCircle2, Shield, ArrowLeft, AlertCircle } from 'lucide-react';
import { formatBytes } from '../utils/file-utils.ts';
import { getPublicPortal, uploadPublicPortalFiles } from '../api.ts';

interface ClientPublicPortalProps {
  slug: string;
  onExitPortal: () => void;
}

export const ClientPublicPortal: React.FC<ClientPublicPortalProps> = ({ slug, onExitPortal }) => {
  const [portalInfo, setPortalInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploaderName, setUploaderName] = useState('');
  const [notes, setNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsLoading(true);
    getPublicPortal(slug)
      .then((data) => {
        setPortalInfo(data);
        setUploaderName(data.clientName);
      })
      .catch((err) => {
        setErrorMsg(err.message || 'Could not load client portal.');
      })
      .finally(() => setIsLoading(false));
  }, [slug]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
      setErrorMsg(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...Array.from(e.target.files)]);
      setErrorMsg(null);
    }
  };

  const removeFile = (idx: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      setErrorMsg('Please select at least one file to upload.');
      return;
    }

    try {
      setIsUploading(true);
      setErrorMsg(null);
      const res = await uploadPublicPortalFiles(slug, selectedFiles, uploaderName, notes);
      setUploadSuccess(res.message || 'Files securely uploaded!');
      setSelectedFiles([]);
      setNotes('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Opening secure client portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Bar for client portal */}
      <header className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600/30 text-blue-400 flex items-center justify-center">
            <FolderLock className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight">ClientVault</h1>
            <p className="text-[10px] text-slate-400">Secure Client File Drop</p>
          </div>
        </div>

        <button
          onClick={onExitPortal}
          className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="max-w-2xl w-full mx-auto p-6 py-10 flex-1">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-8">
          {/* Header Info */}
          <div className="mb-6 pb-6 border-b border-slate-100">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">
              Client Portal
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              {portalInfo?.clientName || 'Client Portal'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Managed by <span className="font-medium text-slate-700">{portalInfo?.freelancerName}</span> ({portalInfo?.company})
            </p>
            {portalInfo?.description && (
              <p className="text-xs text-slate-600 mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                {portalInfo.description}
              </p>
            )}
          </div>

          {errorMsg && (
            <div className="mb-5 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {uploadSuccess && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-emerald-900">{uploadSuccess}</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Your files have been safely stored in the designer's vault.
                </p>
                <button
                  onClick={() => setUploadSuccess(null)}
                  className="mt-2 text-xs text-emerald-800 underline font-medium"
                >
                  Upload more files
                </button>
              </div>
            </div>
          )}

          {/* Upload Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/70'
                  : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mb-3">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-800">
                Choose files or drop them here
              </p>
              <p className="text-xs text-slate-500 mt-1">
                High-resolution assets, images, documents, PDFs, zip archives
              </p>
            </div>

            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase text-slate-500 flex justify-between">
                  <span>Selected files ({selectedFiles.length})</span>
                  <button
                    type="button"
                    onClick={() => setSelectedFiles([])}
                    className="text-slate-400 hover:text-slate-600 normal-case font-normal text-xs"
                  >
                    Clear
                  </button>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                  {selectedFiles.map((f, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <File className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-800 truncate">{f.name}</span>
                        <span className="text-slate-400 font-mono tabular-nums shrink-0">
                          {formatBytes(f.size)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="text-slate-400 hover:text-rose-500 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Your Name or Department
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Marketing Team"
                  value={uploaderName}
                  onChange={(e) => setUploaderName(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Message or Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Assets for November campaign"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isUploading || selectedFiles.length === 0}
                className={`w-full py-2.5 px-4 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2 ${
                  isUploading || selectedFiles.length === 0
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                }`}
              >
                {isUploading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Sending files to vault...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>Upload {selectedFiles.length > 0 ? `${selectedFiles.length} File(s)` : 'Files'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-slate-400 border-t border-slate-200 bg-white">
        <div className="flex items-center justify-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-blue-600" />
          <span>Powered by ClientVault · Direct & End-to-End Isolated File Transfer</span>
        </div>
      </footer>
    </div>
  );
};
