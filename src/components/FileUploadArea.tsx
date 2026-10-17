import React, { useState, useRef } from 'react';
import { Plus, File, X, CheckCircle2, AlertCircle, UploadCloud } from 'lucide-react';
import { formatBytes } from '../utils/file-utils.ts';
import { uploadFiles } from '../api.ts';

interface FileUploadAreaProps {
  clients: string[];
  onUploadSuccess: () => void;
  defaultClient?: string;
}

export const FileUploadArea: React.FC<FileUploadAreaProps> = ({
  clients,
  onUploadSuccess,
  defaultClient,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [clientName, setClientName] = useState<string>(
    defaultClient && defaultClient !== 'all' ? defaultClient : (clients[0] || 'ClientVault')
  );
  const [isCustomClient, setIsCustomClient] = useState(false);
  const [customClientInput, setCustomClientInput] = useState('');
  const [notes, setNotes] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const dropped = Array.from(e.dataTransfer.files);
      setSelectedFiles((prev) => [...prev, ...dropped]);
      setErrorMsg(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const picked = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...picked]);
      setErrorMsg(null);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      setErrorMsg('Please select at least one file to upload.');
      return;
    }

    const finalClient = isCustomClient ? customClientInput.trim() : clientName;
    if (!finalClient) {
      setErrorMsg('Please specify or choose a client name for these files.');
      return;
    }

    try {
      setIsUploading(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const result = await uploadFiles(selectedFiles, finalClient, notes);
      setSuccessMsg(result.message || 'Files uploaded successfully!');
      setSelectedFiles([]);
      setNotes('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onUploadSuccess();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to upload files. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs mb-8">
      {errorMsg && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Large Dashed Dropzone matching screenshot */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl py-12 px-6 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50/60 scale-[1.005]'
            : 'border-indigo-200/90 hover:border-indigo-400 bg-white hover:bg-slate-50/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Plus circle icon */}
        <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </div>

        <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
          Upload your files
        </h3>

        <p className="text-xs sm:text-sm text-slate-500 mb-3">
          Drag and drop or{' '}
          <span className="text-indigo-600 hover:text-indigo-700 font-semibold underline underline-offset-2">
            browse locally
          </span>
        </p>

        <p className="text-[11px] text-slate-400 italic">
          Max file size: 500MB • PDF, JPG, PNG, ZIP, DOCX
        </p>
      </div>

      {/* Selected files & Upload form */}
      {selectedFiles.length > 0 && (
        <form onSubmit={handleUploadSubmit} className="mt-6 pt-5 border-t border-slate-100 space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <span>Selected Files ({selectedFiles.length})</span>
            <button
              type="button"
              onClick={() => setSelectedFiles([])}
              className="text-slate-400 hover:text-slate-600 font-normal"
            >
              Clear all
            </button>
          </div>

          <div className="max-h-44 overflow-y-auto space-y-2 pr-1">
            {selectedFiles.map((file, idx) => (
              <div
                key={`${file.name}-${idx}`}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <File className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span className="font-medium text-slate-800 truncate">{file.name}</span>
                  <span className="text-slate-400 font-mono tabular-nums shrink-0">
                    {formatBytes(file.size)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="p-1 text-slate-400 hover:text-rose-500"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Client / Project Tag
              </label>
              {!isCustomClient ? (
                <div className="flex items-center gap-2">
                  <select
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {clients.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    {clients.length === 0 && <option value="ClientVault">ClientVault</option>}
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsCustomClient(true)}
                    className="px-3 py-2 text-xs border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 shrink-0 whitespace-nowrap"
                  >
                    + New
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Enter client name"
                    value={customClientInput}
                    onChange={(e) => setCustomClientInput(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => { setIsCustomClient(false); setCustomClientInput(''); }}
                    className="text-xs text-slate-500 hover:text-slate-800 px-2"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Approved mockup, client deliverable"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isUploading}
            className={`w-full sm:w-auto px-6 py-2.5 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
              isUploading
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
            }`}
          >
            {isUploading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <span>Upload {selectedFiles.length} File(s)</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
};
