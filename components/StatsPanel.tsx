import React from 'react';
import { ProcessingStats } from '../types';

interface StatsPanelProps {
  stats: ProcessingStats;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ stats }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-6 flex gap-8 items-center flex-wrap">
      <div>
        <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Original Orders</h3>
        <p className="text-3xl font-bold text-slate-800">{stats.rawOrderCount}</p>
      </div>
      <div className="h-10 w-px bg-slate-200 hidden sm:block"></div>
      <div>
        <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total SKU Rows</h3>
        <p className="text-3xl font-bold text-indigo-600">{stats.processedRowCount}</p>
      </div>
      
      <div className="h-10 w-px bg-slate-200 hidden sm:block"></div>
      <div>
        <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">AU SKU Rows</h3>
        <p className="text-3xl font-bold text-indigo-500">{stats.auRowCount || 0}</p>
      </div>

      <div className="flex-grow"></div>
      <div className="text-xs text-slate-400 italic">
        * SKU split applied automatically
      </div>
    </div>
  );
};