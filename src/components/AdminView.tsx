import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Users, 
  Files, 
  HardDrive, 
  Search, 
  ArrowLeft, 
  ExternalLink, 
  Download, 
  Trash2, 
  Eye, 
  Calendar, 
  Mail, 
  Building, 
  RefreshCw, 
  FileText, 
  Image as ImageIcon, 
  FileArchive, 
  Code, 
  File as FileGeneric, 
  Check, 
  Copy,
  AlertTriangle,
  FolderOpen,
  Database
} from 'lucide-react';
import { User, AdminUserListItem, StoredFile } from '../types.ts';
import { getAdminUsers, getAdminUserFiles, deleteFile, getFileDownloadUrl } from '../api.ts';
import { getFirestoreUsers } from '../firebase.ts';
import { formatBytes, getFileCategory } from '../utils/file-utils.ts';

interface AdminViewProps {
  currentUser: User;
  onPreviewFile: (file: StoredFile) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ currentUser, onPreviewFile }) => {
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'freelancer' | 'client' | 'admin'>('all');
  const [selectedUser, setSelectedUser] = useState<AdminUserListItem | null>(null);
  const [userFiles, setUserFiles] = useState<StoredFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteTargetFile, setDeleteTargetFile] = useState<StoredFile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load all users from Firestore & Server
  const loadUsers = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Fetch users via API
      const serverUsers = await getAdminUsers();
      
      // Also query Firestore direct collection to ensure real-time Firestore sync
      try {
        const firestoreUsers = await getFirestoreUsers();
        if (firestoreUsers && firestoreUsers.length > 0) {
          // Merge any users unique to Firestore
          const existingIds = new Set(serverUsers.map((u) => u.id));
          firestoreUsers.forEach((fu) => {
            if (!existingIds.has(fu.id)) {
              serverUsers.push({
                id: fu.id || fu.userId,
                email: fu.email || 'unknown@clientvault.app',
                name: fu.name || 'Firestore User',
                company: fu.company || '',
                role: fu.role || 'freelancer',
                createdAt: fu.createdAt || new Date().toISOString(),
                fileCount: 0,
                totalSizeBytes: 0,
              });
            }
          });
        }
      } catch (e) {
        console.warn('Firestore direct fetch fallback:', e);
      }

      setUsers(serverUsers);
    } catch (err) {
      console.error('Failed to load admin users:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Load files for selected user
  const handleSelectUser = async (user: AdminUserListItem) => {
    setSelectedUser(user);
    setIsLoadingFiles(true);
    try {
      const data = await getAdminUserFiles(user.id);
      setUserFiles(data.files || []);
    } catch (err) {
      console.error('Error fetching user files:', err);
      setUserFiles([]);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const confirmDeleteFile = async () => {
    if (!deleteTargetFile) return;
    try {
      setIsDeleting(true);
      await deleteFile(deleteTargetFile.id);
      setUserFiles((prev) => prev.filter((f) => f.id !== deleteTargetFile.id));
      // Update local fileCount on selected user
      if (selectedUser) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === selectedUser.id
              ? {
                  ...u,
                  fileCount: Math.max(0, u.fileCount - 1),
                  totalSizeBytes: Math.max(0, u.totalSizeBytes - deleteTargetFile.sizeBytes),
                }
              : u
          )
        );
      }
      setDeleteTargetFile(null);
    } catch (err) {
      console.error('Failed to delete file:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter users
  const filteredUsers = users.filter((u) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !query ||
      u.email.toLowerCase().includes(query) ||
      u.name.toLowerCase().includes(query) ||
      u.id.toLowerCase().includes(query) ||
      (u.company && u.company.toLowerCase().includes(query));

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesQuery && matchesRole;
  });

  const totalUsersCount = users.length;
  const totalFilesCount = users.reduce((acc, u) => acc + (u.fileCount || 0), 0);
  const totalStorageBytes = users.reduce((acc, u) => acc + (u.totalSizeBytes || 0), 0);

  const getCategoryIcon = (mimeType: string, filename: string) => {
    const category = getFileCategory(mimeType, filename);
    switch (category) {
      case 'image':
        return <ImageIcon className="w-4 h-4 text-emerald-500" />;
      case 'pdf':
        return <FileText className="w-4 h-4 text-rose-500" />;
      case 'document':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'archive':
        return <FileArchive className="w-4 h-4 text-amber-500" />;
      case 'code':
        return <Code className="w-4 h-4 text-purple-500" />;
      default:
        return <FileGeneric className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Banner with prominent Admin Indicator */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-7 shadow-lg border border-indigo-900/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-xs">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                ADMIN VIEW ACTIVE
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono text-indigo-300 bg-indigo-950/80 border border-indigo-800/60">
                UID: 1z0gjTL5wFcUnv6ibzmp70L7DW63
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-800/60">
                <Database className="w-3 h-3 text-emerald-400" />
                Firestore Security Rules Read Access
              </span>
            </div>

            <h2 className="text-2xl font-black tracking-tight text-white">ClientVault Global Admin Portal</h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              You are authenticated with full administrator privileges. You have complete read access across all user accounts and can inspect client files from the Firestore database.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <button
              onClick={loadUsers}
              disabled={isRefreshing}
              className="px-4 py-2 bg-indigo-600/60 hover:bg-indigo-600 text-white text-xs font-semibold rounded-xl border border-indigo-400/30 flex items-center gap-2 transition-all shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh Database'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Admin Summary Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Registered Users</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{totalUsersCount}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Stored in Firestore / Auth</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Files className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Total Vault Files</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{totalFilesCount}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Across all client vaults</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Total Storage</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{formatBytes(totalStorageBytes)}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Aggregate file payload</p>
          </div>
        </div>
      </div>

      {/* Main Content: If a user is selected, show their uploaded files inspection */}
      {selectedUser ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          {/* User inspection header */}
          <div className="p-6 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <button
                onClick={() => setSelectedUser(null)}
                className="p-2 bg-white hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-colors shadow-xs"
                title="Back to all users"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">{selectedUser.name}</h3>
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {selectedUser.role}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {selectedUser.email}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1 font-mono text-[11px] text-slate-400">
                    ID: {selectedUser.id}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Joined {new Date(selectedUser.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs font-semibold text-slate-400 uppercase">Uploaded Files</p>
                <p className="text-sm font-bold text-slate-900">
                  {userFiles.length} file{userFiles.length === 1 ? '' : 's'} ({formatBytes(userFiles.reduce((acc, f) => acc + f.sizeBytes, 0))})
                </p>
              </div>
            </div>
          </div>

          {/* Files List Table */}
          {isLoadingFiles ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-500 font-medium">Fetching user files from Firestore & storage...</p>
            </div>
          ) : userFiles.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <FolderOpen className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">No files uploaded yet</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {selectedUser.name} ({selectedUser.email}) has not uploaded any files to ClientVault yet.
              </p>
              <button
                onClick={() => setSelectedUser(null)}
                className="mt-4 px-4 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
              >
                Return to Users List
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200">
                    <th className="py-3 px-5">File Name & Client</th>
                    <th className="py-3 px-4">Size</th>
                    <th className="py-3 px-4">Upload Date</th>
                    <th className="py-3 px-4">Notes</th>
                    <th className="py-3 px-5 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {userFiles.map((file) => (
                    <tr key={file.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0">
                            {getCategoryIcon(file.mimeType, file.originalName)}
                          </div>
                          <div className="min-w-0 max-w-xs md:max-w-md">
                            <button
                              onClick={() => onPreviewFile(file)}
                              className="font-bold text-slate-900 hover:text-indigo-600 transition-colors truncate block text-left"
                              title={file.originalName}
                            >
                              {file.originalName}
                            </button>
                            <span className="text-[11px] font-medium text-slate-400">
                              Client: {file.clientName || 'General'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                        {formatBytes(file.sizeBytes)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(file.uploadedAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 max-w-[200px] truncate" title={file.notes || ''}>
                        {file.notes || '—'}
                      </td>
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onPreviewFile(file)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Preview file"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <a
                            href={getFileDownloadUrl(file.id)}
                            download={file.originalName}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors inline-block"
                            title="Download file"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => setDeleteTargetFile(file)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete file as Admin"
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
      ) : (
        /* Users Table View */
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          {/* Table Header and Search Bar */}
          <div className="p-5 sm:p-6 border-b border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">Firestore Users Directory</h3>
                <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-blue-50 text-blue-700">
                  {filteredUsers.length} of {totalUsersCount} users
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Click on any user row or "View Files" button to inspect their uploaded documents and storage.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search Bar */}
              <div className="relative min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by email, name, UID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900"
                />
              </div>

              {/* Role filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 font-medium"
              >
                <option value="all">All Roles</option>
                <option value="freelancer">Freelancers</option>
                <option value="client">Clients</option>
                <option value="admin">Admins</option>
              </select>
            </div>
          </div>

          {/* Table Body */}
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-500 font-medium">Loading user records from Firestore...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <p className="text-sm font-semibold">No users matching search query</p>
              <button
                onClick={() => { setSearchQuery(''); setRoleFilter('all'); }}
                className="mt-2 text-xs text-indigo-600 hover:underline"
              >
                Clear search filters
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200">
                    <th className="py-3 px-5">User & Details</th>
                    <th className="py-3 px-4">Email Address</th>
                    <th className="py-3 px-4">Account Created</th>
                    <th className="py-3 px-4">Uploaded Files</th>
                    <th className="py-3 px-4">Storage Used</th>
                    <th className="py-3 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredUsers.map((user) => {
                    const isCurrentAdmin = user.id === '1z0gjTL5wFcUnv6ibzmp70L7DW63' || user.role === 'admin';
                    const initials = (user.name || 'User')
                      .split(' ')
                      .filter(Boolean)
                      .map((p) => p[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase();

                    return (
                      <tr
                        key={user.id}
                        onClick={() => handleSelectUser(user)}
                        className="hover:bg-indigo-50/40 cursor-pointer transition-colors group"
                      >
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                              isCurrentAdmin
                                ? 'bg-rose-100 text-rose-700 ring-2 ring-rose-300'
                                : 'bg-indigo-100 text-indigo-700'
                            }`}>
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                  {user.name}
                                </span>
                                {isCurrentAdmin && (
                                  <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase rounded bg-rose-50 text-rose-700 border border-rose-200">
                                    ADMIN
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-xs">
                                {user.company || 'Freelancer'}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-medium text-slate-900 truncate max-w-[200px]" title={user.email}>
                              {user.email}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-[10px] font-mono text-slate-400 truncate max-w-[140px]" title={user.id}>
                              {user.id}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(user.id, user.id);
                              }}
                              className="text-slate-400 hover:text-slate-700"
                              title="Copy UID"
                            >
                              {copiedId === user.id ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>
                              {new Date(user.createdAt).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                            user.fileCount > 0
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            <Files className="w-3 h-3" />
                            <span>{user.fileCount} file{user.fileCount === 1 ? '' : 's'}</span>
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                          {formatBytes(user.totalSizeBytes || 0)}
                        </td>

                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectUser(user);
                            }}
                            className="px-3 py-1.5 bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white text-slate-700 text-xs font-semibold rounded-xl transition-all shadow-xs flex items-center gap-1.5 ml-auto"
                          >
                            <span>Inspect Files</span>
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal for Admin */}
      {deleteTargetFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-900 text-center">
              Delete File as Admin?
            </h3>
            <p className="text-xs text-slate-500 text-center mt-1.5 mb-5">
              Are you sure you want to permanently delete <strong className="text-slate-800">{deleteTargetFile.originalName}</strong>? This will remove the file from both Firestore and disk storage.
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteTargetFile(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteFile}
                disabled={isDeleting}
                className="flex-1 py-2.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2"
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
