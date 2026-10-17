import React, { useState } from 'react';
import { Users, Plus, ExternalLink, Copy, Check, FolderLock, FileText, ArrowRight, Shield } from 'lucide-react';
import { ClientPortal } from '../types.ts';
import { formatBytes } from '../utils/file-utils.ts';
import { createPortal } from '../api.ts';

interface PortalsViewProps {
  portals: ClientPortal[];
  onRefreshPortals: () => void;
  onOpenClientPortalPreview: (slug: string) => void;
  onFilterByClient: (clientName: string) => void;
}

export const PortalsView: React.FC<PortalsViewProps> = ({
  portals,
  onRefreshPortals,
  onOpenClientPortalPreview,
  onFilterByClient,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [description, setDescription] = useState('');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCopyLink = (slug: string) => {
    const portalUrl = `${window.location.origin}?portal=${slug}`;
    navigator.clipboard.writeText(portalUrl);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const handleCreatePortal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      setErrorMsg('Please enter a client name.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await createPortal(clientName, clientEmail, description);
      setClientName('');
      setClientEmail('');
      setDescription('');
      setIsCreating(false);
      onRefreshPortals();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create client portal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200/90 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Client Portals</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Give each client their own dedicated upload link. Files they upload are automatically deposited into your vault organized by client name.
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Client Portal</span>
        </button>
      </div>

      {/* Creation Modal / Form */}
      {isCreating && (
        <div className="bg-white p-6 rounded-xl border border-blue-200 shadow-sm animate-in fade-in duration-150">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900">Create New Client Upload Portal</h3>
            <button
              onClick={() => setIsCreating(false)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Cancel
            </button>
          </div>

          {errorMsg && (
            <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleCreatePortal} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Client or Company Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Studio Vista"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Client Contact Email (Optional)
                </label>
                <input
                  type="email"
                  placeholder="e.g. client@studiovista.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Welcome Message or Upload Instructions
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Please upload your high-resolution logos, brand assets, and feedback files here."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-3 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
              >
                {isSubmitting ? 'Creating...' : 'Create Portal'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid of Portals */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {portals.map((portal) => (
          <div
            key={portal.id}
            className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-5 flex flex-col justify-between hover:border-slate-300 transition-all group"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-semibold text-xs">
                  {portal.clientName.charAt(0).toUpperCase()}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono tabular-nums">
                  <span>{portal.fileCount || 0} files</span>
                  <span>·</span>
                  <span>{formatBytes(portal.totalBytes || 0)}</span>
                </div>
              </div>

              <h3 className="text-sm font-semibold text-slate-900">{portal.clientName}</h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                {portal.description || 'Secure client upload link.'}
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={() => handleCopyLink(portal.slug)}
                  className="flex-1 py-1.5 px-2.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 truncate"
                  title="Copy client share link"
                >
                  {copiedSlug === portal.slug ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="text-emerald-700 truncate">Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">Copy Client Link</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => onOpenClientPortalPreview(portal.slug)}
                  className="py-1.5 px-2.5 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/70 border border-blue-200 rounded-lg transition-colors flex items-center gap-1 shrink-0"
                  title="Open and preview what the client sees"
                >
                  <span>Client View</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              <button
                onClick={() => onFilterByClient(portal.clientName)}
                className="w-full text-center text-[11px] text-slate-500 hover:text-slate-900 py-1 font-medium transition-colors"
              >
                View files in vault →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
