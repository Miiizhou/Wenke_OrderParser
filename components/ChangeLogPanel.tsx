import React from 'react';
import { ChangeLogEntry } from '../types';

interface ChangeLogPanelProps {
  logs: ChangeLogEntry[];
}

const FIELD_MAP: Record<string, string> = {
  customerOrderNo: "客户订单号",
  recipientName: "收件人姓名",
  address1: "收件人街道地址1",
  address2: "收件人街道地址2",
  city: "城市",
  zip: "邮编",
  phone: "电话",
  productNameCn: "中文品名",
  quantity: "数量",
  remarks: "备注",
  specs: "规格",
  warehouse: "仓库分类"
};

export const ChangeLogPanel: React.FC<ChangeLogPanelProps> = ({ logs }) => {
  if (!logs || logs.length === 0) return null;

  // Sort logs by timestamp descending (newest first)
  const sortedLogs = [...logs].sort((a, b) => b.timestamp - a.timestamp);

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(/\//g, '-');
  };

  return (
    <div className="mt-8 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          Modification Log
        </h3>
      </div>
      <div className="max-h-64 overflow-y-auto">
        <ul className="divide-y divide-slate-100">
          {sortedLogs.map((log, idx) => (
            <li key={idx} className="px-4 py-3 text-sm hover:bg-slate-50 transition-colors">
              <span className="text-slate-500 font-mono mr-2">[{formatDate(log.timestamp)}]</span>
              <span className="font-semibold text-slate-800 mr-2">{log.customerOrderNo}</span>
              <span className="text-slate-600 mr-2">
                 Modified <span className="font-medium text-indigo-600">{FIELD_MAP[log.field] || log.field}</span>:
              </span>
              <span className="line-through text-red-400 mr-2">{log.oldValue || "(empty)"}</span>
              <span className="text-slate-400 mr-2">→</span>
              <span className="text-green-600 font-medium">{log.newValue || "(empty)"}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};