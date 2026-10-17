import React, { useState, useEffect, useCallback } from 'react';
import { 
  Menu,
  X
} from 'lucide-react';
import { User, StoredFile, ClientPortal, ActiveTab } from './types.ts';
import { getCurrentUser, getFiles, getPortals, deleteFile, logout } from './api.ts';
import { Sidebar } from './components/Sidebar.tsx';
import { StatCards } from './components/StatCards.tsx';
import { FileUploadArea } from './components/FileUploadArea.tsx';
import { FileList } from './components/FileList.tsx';
import { FilePreviewModal } from './components/FilePreviewModal.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { AuthView } from './components/AuthView.tsx';
import { ClientPublicPortal } from './components/ClientPublicPortal.tsx';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [portals, setPortals] = useState<ClientPortal[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [previewFile, setPreviewFile] = useState<StoredFile | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Public client portal view state from URL query or manual preview
  const [activeClientPortalSlug, setActiveClientPortalSlug] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('portal');
  });

  // Check auth on load
  const loadUserData = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
      if (user) {
        const [fetchedFiles, fetchedPortals] = await Promise.all([
          getFiles(),
          getPortals(),
        ]);
        setFiles(fetchedFiles);
        setPortals(fetchedPortals);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setIsLoadingUser(false);
    }
  }, []);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const refreshFiles = async () => {
    try {
      const [fetchedFiles, fetchedPortals] = await Promise.all([
        getFiles(),
        getPortals(),
      ]);
      setFiles(fetchedFiles);
      setPortals(fetchedPortals);
    } catch (err) {
      console.error('Failed to refresh files:', err);
    }
  };

  const handleDeleteFile = async (id: string, name: string) => {
    await deleteFile(id);
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSignOut = async () => {
    await logout();
    setCurrentUser(null);
    setFiles([]);
    setPortals([]);
    setActiveTab('dashboard');
    setSelectedClient('all');
  };

  // Derive unique clients list
  const clientNames = Array.from(
    new Set([
      ...portals.map((p) => p.clientName),
      ...files.map((f) => f.clientName).filter(Boolean),
    ])
  ).filter((c) => c !== 'all');

  const totalFilesCount = files.length;
  const totalSizeBytes = files.reduce((acc, f) => acc + f.sizeBytes, 0);

  // If viewing a public client portal
  if (activeClientPortalSlug) {
    return (
      <ClientPublicPortal
        slug={activeClientPortalSlug}
        onExitPortal={() => {
          setActiveClientPortalSlug(null);
          const url = new URL(window.location.href);
          url.searchParams.delete('portal');
          window.history.pushState({}, '', url.toString());
          refreshFiles();
        }}
      />
    );
  }

  // Loading initial auth
  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-medium text-slate-500">Loading ClientVault...</p>
        </div>
      </div>
    );
  }

  // If not logged in, show Auth View
  if (!currentUser) {
    return (
      <AuthView
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          loadUserData();
        }}
      />
    );
  }

  // User initials
  const userInitials = (currentUser.name || 'User')
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Desktop Sidebar: Dark Navy */}
      <div className="hidden lg:block shrink-0">
        <Sidebar
          user={currentUser}
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
          }}
          totalSizeBytes={totalSizeBytes}
          onSignOut={handleSignOut}
        />
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10">
            <Sidebar
              user={currentUser}
              activeTab={activeTab}
              setActiveTab={(tab) => {
                setActiveTab(tab);
                setMobileMenuOpen(false);
              }}
              totalSizeBytes={totalSizeBytes}
              onSignOut={handleSignOut}
            />
          </div>
        </div>
      )}

      {/* Main Content Area: White & Light Gray */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header matching screenshot */}
        <header className="px-6 sm:px-10 py-5 bg-white border-b border-slate-200/90 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h1 className="text-2xl sm:text-[26px] font-extrabold text-slate-900 tracking-tight">
                {activeTab === 'dashboard' ? 'Client Dashboard' : 'Settings & Portals'}
              </h1>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                <span>Securely manage your files for</span>
                <span className="bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-md text-[11px] border border-indigo-100">
                  ClientVault
                </span>
              </div>
            </div>
          </div>

          {/* User Profile on right */}
          <div className="flex items-center gap-3.5">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-900 leading-tight">{currentUser.name}</p>
              <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[180px]">{currentUser.email}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-indigo-500 text-white font-bold flex items-center justify-center text-sm shadow-sm ring-2 ring-indigo-500/20">
              {userInitials}
            </div>
          </div>
        </header>

        {/* Dashboard Content Container */}
        <main className="flex-1 p-6 sm:p-10 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <>
              {/* 3 Stat Cards: TOTAL FILES, STORAGE USED, ACCOUNT STATUS */}
              <StatCards
                totalFiles={totalFilesCount}
                totalSizeBytes={totalSizeBytes}
                status="ACTIVE"
              />

              {/* Upload Dropzone Area */}
              <FileUploadArea
                clients={clientNames}
                defaultClient={selectedClient}
                onUploadSuccess={refreshFiles}
              />

              {/* Recent Files Table */}
              <FileList
                files={files}
                selectedClient={selectedClient}
                setSelectedClient={setSelectedClient}
                clients={clientNames}
                onDeleteFile={handleDeleteFile}
                onPreviewFile={(f) => setPreviewFile(f)}
                onOpenUpload={() => {}}
              />
            </>
          )}

          {activeTab === 'settings' && (
            <SettingsView
              user={currentUser}
              portals={portals}
              files={files}
              onRefreshPortals={refreshFiles}
              onOpenClientPortalPreview={(slug) => {
                setActiveClientPortalSlug(slug);
                const url = new URL(window.location.href);
                url.searchParams.set('portal', slug);
                window.history.pushState({}, '', url.toString());
              }}
            />
          )}
        </main>
      </div>

      {/* File Preview Modal */}
      <FilePreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
      />
    </div>
  );
}
