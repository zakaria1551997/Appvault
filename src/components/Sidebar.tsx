import React from 'react';
import { 
  LayoutGrid, 
  Settings, 
  LogOut, 
  Files,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { User, ActiveTab } from '../types.ts';

interface SidebarProps {
  user: User;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  totalSizeBytes: number;
  onSignOut: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  activeTab,
  setActiveTab,
  totalSizeBytes,
  onSignOut,
}) => {
  const isAdmin = user.id === '1z0gjTL5wFcUnv6ibzmp70L7DW63' || user.role === 'admin';
  // Max storage: 500 MB quota
  const maxStorageBytes = 500 * 1024 * 1024;
  const usagePercent = Math.min(100, Math.round((totalSizeBytes / maxStorageBytes) * 100));

  return (
    <aside className="w-64 bg-[#0B132B] text-slate-200 flex flex-col justify-between shrink-0 h-screen sticky top-0 border-r border-slate-800/80 p-5 select-none">
      {/* Top Branding & Menu */}
      <div className="flex flex-col">
        {/* Logo */}
        <div className="flex items-center justify-between mb-8 px-1 pt-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/25 ring-2 ring-indigo-500/20">
              <Files className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg text-white tracking-tight block leading-none">ClientVault</span>
              <span className="text-[10px] text-slate-400 font-medium">Secure File Vault</span>
            </div>
          </div>

          {isAdmin && (
            <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40">
              ADMIN
            </span>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          {isAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'admin'
                  ? 'bg-rose-950/60 text-rose-200 border border-rose-800/50 shadow-xs'
                  : 'text-rose-300/80 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Admin Console</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'dashboard'
                ? 'bg-slate-800/80 text-white shadow-xs'
                : 'text-slate-400 hover:bg-slate-800/40 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-4 h-4 text-slate-300" />
            <span>{isAdmin ? 'My Personal Files' : 'Dashboard'}</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'settings'
                ? 'bg-slate-800/80 text-white shadow-xs'
                : 'text-slate-400 hover:bg-slate-800/40 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Settings</span>
          </button>
        </nav>
      </div>

      {/* Bottom Storage & Sign Out */}
      <div className="space-y-4 pt-4">
        {/* Storage Widget */}
        <div className="bg-slate-900/60 rounded-xl p-3.5 border border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Storage</span>
            <span className="font-mono tabular-nums">{usagePercent}% Used</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-blue-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.max(2, usagePercent)}%` }}
            />
          </div>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={onSignOut}
          className="w-full py-2.5 px-4 rounded-xl border border-slate-700/60 bg-slate-800/40 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
