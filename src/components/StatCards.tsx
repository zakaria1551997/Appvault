import React from 'react';
import { formatBytes } from '../utils/file-utils.ts';

interface StatCardsProps {
  totalFiles: number;
  totalSizeBytes: number;
  status?: string;
}

export const StatCards: React.FC<StatCardsProps> = ({
  totalFiles,
  totalSizeBytes,
  status = 'ACTIVE',
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
      {/* Total Files Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
          Total Files
        </p>
        <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-mono tabular-nums">
          {totalFiles}
        </p>
      </div>

      {/* Storage Used Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
          Storage Used
        </p>
        <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-mono tabular-nums">
          {formatBytes(totalSizeBytes)}
        </p>
      </div>

      {/* Account Status Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
          Account Status
        </p>
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {status}
          </p>
        </div>
      </div>
    </div>
  );
};
