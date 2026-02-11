import React from 'react';
import { HistoryItem } from '../types';

interface HistoryListProps {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onBack: () => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({ history, onSelect, onBack }) => {
  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    // Format: YYYY-MM-DD HH:mm:ss order
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} order`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">History Records</h2>
        <button 
          onClick={onBack}
          className="text-slate-500 hover:text-indigo-600 font-medium flex items-center gap-1 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Parser
        </button>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          No history found. Process some orders to see them here.
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((item) => (
            <div 
              key={item.id}
              onClick={() => onSelect(item)}
              className="group p-4 rounded-lg border border-slate-100 hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer transition-all flex justify-between items-center"
            >
              <div className="flex items-center gap-4">
                <div className="bg-indigo-100 text-indigo-600 p-2 rounded-lg">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 group-hover:text-indigo-700">
                    {formatDate(item.timestamp)}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {item.result.stats.rawOrderCount} original orders / {item.result.stats.processedRowCount} processed rows
                  </p>
                </div>
              </div>
              <div className="text-slate-300 group-hover:text-indigo-400">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};