import React, { useState } from 'react';
import { User, ClientPortal, StoredFile } from '../types.ts';
import { formatBytes } from '../utils/file-utils.ts';
import { createPortal } from '../api.ts';
import { User as UserIcon, Building, Mail, Shield, Plus, ExternalLink, Copy, Check, HardDrive, KeyRound } from 'lucide-react';

interface SettingsViewProps {
  user: User;
  portals: ClientPortal[];
  files: StoredFile[];
  onRefreshPortals: () => void;
  onOpenClientPortalPreview: (slug: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  portals,
  files,
  onRefreshPortals,
  onOpenClientPortalPreview,
}) => {
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [isCreatingPortal, setIsCreatingPortal] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  const totalSizeBytes = files.reduce((acc, f) => acc + f.sizeBytes, 0);

  const handleCopyLink = (slug: string) => {
    const url = `${window.location.origin}?portal=${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const handleCreatePortal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    try {
      setIsSubmitting(true);
      setPortalError(null);
      await createPortal(newClientName, newClientEmail, newDescription);
      setNewClientName('');
      setNewClientEmail('');
      setNewDescription('');
      setIsCreatingPortal(false);
      onRefreshPortals();
    } catch (err: any) {
      setPortalError(err.message || 'Could not create portal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Profile & Account Details */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Account & Profile</h2>
        <p className="text-xs text-slate-500 mb-6">Your personal account credentials and studio settings</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase text-slate-400">Account Name</p>
              <p className="text-sm font-bold text-slate-900">{user.name}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase text-slate-400">Email Address</p>
              <p className="text-sm font-bold text-slate-900 truncate">{user.email}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase text-slate-400">Studio / Company</p>
              <p className="text-sm font-bold text-slate-900">{user.company || 'Independent Studio'}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase text-slate-400">Database & Security</p>
              <p className="text-sm font-bold text-slate-900">Firestore Encrypted</p>
            </div>
          </div>
        </div>
      </div>

      {/* Client Portals Section */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Client Upload Portals</h2>
            <p className="text-xs text-slate-500 mt-0.5">Share these links with clients to let them upload directly to your vault</p>
          </div>
          <button
            onClick={() => setIsCreatingPortal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Portal</span>
          </button>
        </div>

        {isCreatingPortal && (
          <form onSubmit={handleCreatePortal} className="mb-6 p-5 bg-indigo-50/50 rounded-xl border border-indigo-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">New Client Link</h3>
              <button
                type="button"
                onClick={() => setIsCreatingPortal(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Cancel
              </button>
            </div>

            {portalError && <p className="text-xs text-rose-600">{portalError}</p>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                required
                placeholder="Client name (e.g. Acme Corp)"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
              />
              <input
                type="email"
                placeholder="Client email (optional)"
                value={newClientEmail}
                onChange={(e) => setNewClientEmail(e.target.value)}
                className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
              />
            </div>
            <textarea
              rows={2}
              placeholder="Custom instructions or welcome note for client..."
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreatingPortal(false)}
                className="px-3 py-1.5 text-xs text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg"
              >
                {isSubmitting ? 'Saving...' : 'Save Portal'}
              </button>
            </div>
          </form>
        )}

        <div className="divide-y divide-slate-100">
          {portals.map((portal) => (
            <div key={portal.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-900">{portal.clientName}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{portal.description || 'Dedicated client drop link'}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyLink(portal.slug)}
                  className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  {copiedSlug === portal.slug ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => onOpenClientPortalPreview(portal.slug)}
                  className="px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg flex items-center gap-1 transition-colors"
                >
                  <span>Preview</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
