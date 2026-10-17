import React from 'react';
import { HardDrive, Shield, CheckCircle2, PieChart, Layers, Users } from 'lucide-react';
import { StoredFile } from '../types.ts';
import { formatBytes, getFileCategory } from '../utils/file-utils.ts';

interface StorageViewProps {
  files: StoredFile[];
  clients: string[];
}

export const StorageView: React.FC<StorageViewProps> = ({ files, clients }) => {
  const totalSizeBytes = files.reduce((acc, f) => acc + f.sizeBytes, 0);
  const maxStorageBytes = 500 * 1024 * 1024; // 500 MB demo quota
  const usagePercent = Math.min(100, Math.round((totalSizeBytes / maxStorageBytes) * 100));

  const categoryBreakdown = files.reduce((acc, f) => {
    const cat = getFileCategory(f.mimeType, f.originalName);
    if (!acc[cat]) {
      acc[cat] = { count: 0, bytes: 0 };
    }
    acc[cat].count += 1;
    acc[cat].bytes += f.sizeBytes;
    return acc;
  }, {} as Record<string, { count: number; bytes: number }>);

  const clientBreakdown = clients.map((c) => {
    const clientFiles = files.filter((f) => f.clientName === c);
    const bytes = clientFiles.reduce((acc, f) => acc + f.sizeBytes, 0);
    return {
      client: c,
      count: clientFiles.length,
      bytes,
    };
  }).sort((a, b) => b.bytes - a.bytes);

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Storage Overview</h2>
              <p className="text-xs text-slate-500">
                Encrypted disk allocation for your ClientVault workspace
              </p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-xl font-bold font-mono tabular-nums text-slate-900">
              {formatBytes(totalSizeBytes)}
            </span>
            <span className="text-xs text-slate-400"> of {formatBytes(maxStorageBytes)}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-3">
          <div
            className="bg-blue-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.max(2, usagePercent)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{usagePercent}% used</span>
          <span>{formatBytes(maxStorageBytes - totalSizeBytes)} available</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-900">Breakdown by File Type</h3>
          </div>

          <div className="space-y-3">
            {Object.keys(categoryBreakdown).length === 0 ? (
              <p className="text-xs text-slate-400">No files uploaded yet.</p>
            ) : (
              Object.entries(categoryBreakdown).map(([cat, stats]) => (
                <div key={cat} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-2 capitalize text-slate-700 font-medium">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>{cat}</span>
                    <span className="text-slate-400 font-normal">({stats.count})</span>
                  </div>
                  <span className="font-mono tabular-nums text-slate-600">
                    {formatBytes(stats.bytes)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Client Storage Allocation */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-900">Storage by Client</h3>
          </div>

          <div className="space-y-3">
            {clientBreakdown.length === 0 ? (
              <p className="text-xs text-slate-400">No clients created yet.</p>
            ) : (
              clientBreakdown.map((item) => (
                <div key={item.client} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-2 text-slate-700 font-medium truncate max-w-[180px]">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="truncate">{item.client}</span>
                    <span className="text-slate-400 font-normal">({item.count})</span>
                  </div>
                  <span className="font-mono tabular-nums text-slate-600">
                    {formatBytes(item.bytes)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Security Architecture Guarantee */}
      <div className="bg-slate-900 text-slate-200 p-6 rounded-xl border border-slate-800">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Strict Data Isolation & Security Rules</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Every file is strictly owned by your user ID. Requests to view, stream, download, or delete are verified against your active bearer authentication token. Other users have zero visibility into your assets or client files.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
