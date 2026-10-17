import React, { useState } from 'react';
import { 
  FileText, 
  Image as ImageIcon, 
  FileArchive, 
  Code, 
  File as FileGeneric, 
  Trash2, 
  Download, 
  Eye, 
  Search, 
  Filter, 
  AlertTriangle,
  FolderOpen,
  Calendar,
  HardDrive
} from 'lucide-react';
import { StoredFile } from '../types.ts';
import { formatBytes, getFileCategory, filterFiles } from '../utils/file-utils.ts';
import { getFileDownloadUrl } from '../api.ts';

interface FileListProps {
  files: StoredFile[];
  selectedClient: string;
  setSelectedClient: (client: string) => void;
  clients: string[];
  onDeleteFile: (id: string, name: string) => Promise<void>;
  onPreviewFile: (file: StoredFile) => void;
  onOpenUpload: () => void;
}

export const FileList: React.FC<FileListProps> = ({
  files,
  selectedClient,
  setSelectedClient,
  clients,
  onDeleteFile,
  onPreviewFile,
  onOpenUpload,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [fileToDelete, setFileToDelete] = useState<StoredFile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredFiles = filterFiles(files, searchQuery, categoryFilter, selectedClient);

  const getCategoryIcon = (mimeType: string, filename: string) => {
    const cat = getFileCategory(mimeType, filename);
    switch (cat) {
      case 'image':
        return <ImageIcon className="w-4 h-4 text-emerald-600" />;
      case 'pdf':
      case 'document':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'archive':
        return <FileArchive className="w-4 h-4 text-amber-600" />;
      case 'code':
        return <Code className="w-4 h-4 text-purple-600" />;
      default:
        return <FileGeneric className="w-4 h-4 text-slate-500" />;
    }
  };

  const handleConfirmDelete = async () => {
    if (!fileToDelete) return;
    try {
      setIsDeleting(true);
      await onDeleteFile(fileToDelete.id, fileToDelete.originalName);
      setFileToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const categories = [
    { id: 'all', label: 'All Files' },
    { id: 'image', label: 'Images' },
    { id: 'pdf', label: 'PDFs' },
    { id: 'document', label: 'Documents' },
    { id: 'archive', label: 'Archives' },
  ];

  return (
    <div className="space-y-4">
      {/* Recent Files Header Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Recent Files
        </h2>

        {/* Search & Category Filter */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search files..."
              aria-label="Search files"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-10 pr-3.5 py-2.5 bg-white border border-slate-200/90 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
            />
          </div>

          <div className="relative">
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              aria-label="Filter by client"
              className="text-xs bg-white border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-slate-700 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
            >
              <option value="all">All Clients</option>
              {clients.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* File Table Container */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
        {filteredFiles.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <FolderOpen className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">No files found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              {files.length === 0
                ? "Your vault is empty. Upload your first client deliverable or share an upload link."
                : "No files match your current search or category filter criteria."}
            </p>
            {files.length === 0 ? (
              <button
                onClick={onOpenUpload}
                className="px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                Upload File Now
              </button>
            ) : (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('all');
                  setSelectedClient('all');
                }}
                className="px-3 py-1.5 text-xs text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">File Name</th>
                  <th className="py-3 px-4">Client / Portal</th>
                  <th className="py-3 px-4 text-right">File Size</th>
                  <th className="py-3 px-4">Upload Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredFiles.map((file) => (
                  <tr
                    key={file.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* File Name & Type */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200/60 flex items-center justify-center shrink-0">
                          {getCategoryIcon(file.mimeType, file.originalName)}
                        </div>
                        <div className="min-w-0 max-w-xs md:max-w-md">
                          <button
                            onClick={() => onPreviewFile(file)}
                            className="font-medium text-slate-900 hover:text-blue-600 transition-colors truncate block text-left"
                            title={file.originalName}
                          >
                            {file.originalName}
                          </button>
                          {file.notes && (
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">
                              {file.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Client / Project Name */}
                    <td className="py-3 px-4 text-slate-600">
                      <span className="font-medium text-slate-800">{file.clientName || 'General'}</span>
                    </td>

                    {/* File Size (Tabular-nums) */}
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600">
                      {formatBytes(file.sizeBytes)}
                    </td>

                    {/* Upload Date */}
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(file.uploadedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Actions: Preview, Download, Delete */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onPreviewFile(file)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="Preview File"
                          aria-label={`Preview ${file.originalName}`}
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <a
                          href={getFileDownloadUrl(file.id)}
                          download={file.originalName}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                          title="Download File"
                          aria-label={`Download ${file.originalName}`}
                        >
                          <Download className="w-4 h-4" />
                        </a>

                        <button
                          onClick={() => setFileToDelete(file)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          title="Delete File"
                          aria-label={`Delete ${file.originalName}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {fileToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Delete File?</h3>
            <p className="text-xs text-slate-600 mt-2 mb-6">
              Are you sure you want to permanently delete{' '}
              <span className="font-semibold text-slate-800">"{fileToDelete.originalName}"</span>?
              This action cannot be undone and will free up {formatBytes(fileToDelete.sizeBytes)} from your vault.
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setFileToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                {isDeleting ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete File</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
