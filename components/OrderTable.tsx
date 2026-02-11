import React, { useMemo, useState, useEffect, useRef } from 'react';
import { OrderRow } from '../types';

interface OrderTableProps {
  orders: OrderRow[];
  onUpdateOrder?: (id: string, field: keyof OrderRow, value: any) => void;
  onViewAuOrders?: () => void;
  onViewBhamOrders?: (selectedIds: string[]) => void;
}

// Editable Cell Sub-component
const EditableCell = ({ 
  value, 
  isEditing, 
  onDoubleClick, 
  onSave, 
  onCancel,
  type = "text"
}: { 
  value: string | number; 
  isEditing: boolean; 
  onDoubleClick: () => void; 
  onSave: (val: string) => void; 
  onCancel: () => void;
  type?: string;
}) => {
  const [tempValue, setTempValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      setTempValue(value);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isEditing, value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSave(String(tempValue));
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type={type}
        className="w-full p-1 text-sm border-2 border-indigo-500 rounded focus:outline-none"
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={() => onSave(String(tempValue))}
        onKeyDown={handleKeyDown}
      />
    );
  }

  return (
    <div 
      onDoubleClick={onDoubleClick} 
      className="w-full h-full min-h-[1.5rem] cursor-pointer hover:bg-indigo-50/50 rounded px-1 -ml-1 flex items-center truncate"
      title="Double click to edit"
    >
      {value}
    </div>
  );
};

export const OrderTable: React.FC<OrderTableProps> = ({ orders, onUpdateOrder, onViewAuOrders, onViewBhamOrders }) => {
  const [editingCell, setEditingCell] = useState<{ id: string, field: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Sorting Logic
  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      const wA = (a.warehouse || "").trim().toLowerCase();
      const wB = (b.warehouse || "").trim().toLowerCase();

      const pA = (a.productNameCn || "").toLowerCase();
      const pB = (b.productNameCn || "").toLowerCase();

      const isNottinghamA = wA.includes("诺丁汉") || wA.includes("nottingham") || pA.includes("诺丁汉");
      const isNottinghamB = wB.includes("诺丁汉") || wB.includes("nottingham") || pB.includes("诺丁汉");

      const isBirminghamA = wA.includes("伯明翰") || wA.includes("birmingham") || pA.includes("伯明翰");
      const isBirminghamB = wB.includes("伯明翰") || wB.includes("birmingham") || pB.includes("伯明翰");
      
      const isAustraliaA = wA.includes("澳大利亚") || wA.includes("australia") || pA.includes("澳大利亚");
      const isAustraliaB = wB.includes("澳大利亚") || wB.includes("australia") || pB.includes("澳大利亚");

      // Nottingham first
      if (isNottinghamA && !isNottinghamB) return -1;
      if (!isNottinghamA && isNottinghamB) return 1;

      // Australia last
      if (isAustraliaA && !isAustraliaB) return 1;
      if (!isAustraliaA && isAustraliaB) return -1;
      
      // Birmingham Logic
      if (isBirminghamA && !isBirminghamB) return -1;
      if (!isBirminghamA && isBirminghamB) return 1;

      if (wA !== wB) return wA.localeCompare(wB, "zh-CN");
      return pA.localeCompare(pB, "zh-CN");
    });
  }, [orders]);

  const copyToClipboard = () => {
    const headers = [
      "客户订单号", "客户快递单号", "收件人姓名", "收件人街道地址1", "收件人街道地址2",
      "收件人城市", "空字段", "收件人邮编", "空字段", "收件人电话",
      "商品英文品名", "商品中文品名", "数量", "备注", "规格"
    ];

    const rows = sortedOrders.map(o => [
      o.customerOrderNo,
      o.customerTrackingNo,
      o.recipientName,
      o.address1,
      o.address2,
      o.city,
      o.empty1,
      o.zip,
      o.empty2,
      o.phone,
      o.productNameEng,
      o.productNameCn,
      o.quantity,
      o.remarks,
      o.specs
    ].join("\t"));

    const text = [headers.join("\t"), ...rows].join("\n");
    navigator.clipboard.writeText(text).then(() => {
      alert("Standard table copied to clipboard!");
    });
  };

  const startEdit = (id: string, field: string) => {
    setEditingCell({ id, field });
  };

  const handleSave = (id: string, field: keyof OrderRow, val: string) => {
    if (onUpdateOrder) {
      onUpdateOrder(id, field, val);
    }
    setEditingCell(null);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(orders.map(o => o.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleBhamClick = () => {
    if (selectedIds.size === 0) {
      alert("Please select at least one order to generate the Birmingham list.");
      return;
    }
    if (onViewBhamOrders) {
      onViewBhamOrders(Array.from(selectedIds));
    }
  };

  if (orders.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-xl font-bold text-slate-800">Generated Table</h2>
        
        <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 hidden lg:inline-block mr-2">
                Double-click to edit • Sort: Birmingham ↑ · Australia ↓
            </span>
            
            {/* Birmingham Button */}
            <button
            onClick={handleBhamClick}
            className={`px-4 py-2 rounded-md font-medium text-sm transition-colors flex items-center gap-2 shadow-sm
              ${selectedIds.size > 0 
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
            >
            <span className="text-base">UK</span>
            Bham Orders ({selectedIds.size})
            </button>

            {/* AU Button */}
            <button
            onClick={onViewAuOrders}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors flex items-center gap-2 shadow-sm"
            >
            <span className="text-base">🇦🇺</span>
            Export AU Orders
            </button>

            <button
            onClick={copyToClipboard}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors flex items-center gap-2 shadow-sm"
            >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
            Copy Standard
            </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
            <tr>
              <th className="p-3 w-8 text-center">
                <input 
                  type="checkbox" 
                  onChange={handleSelectAll}
                  checked={orders.length > 0 && selectedIds.size === orders.length}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </th>
              <th className="p-3">Warnings</th>
              <th className="p-3 w-32">客户订单号</th>
              <th className="p-3 w-16 text-slate-400">快递单号</th>
              <th className="p-3 w-32">收件人姓名</th>
              <th className="p-3 w-64">收件人街道地址1</th>
              <th className="p-3 w-32">收件人街道地址2</th>
              <th className="p-3 w-32">城市</th>
              <th className="p-3 w-8 text-slate-400">空</th>
              <th className="p-3 w-24">邮编</th>
              <th className="p-3 w-8 text-slate-400">空</th>
              <th className="p-3 w-32">电话</th>
              <th className="p-3 w-16 text-slate-400">英文品名</th>
              <th className="p-3 w-64">中文品名 <span className="text-xs font-normal text-slate-400 ml-1">(Warehouse)</span></th>
              <th className="p-3 w-16">数量</th>
              <th className="p-3 w-32">备注</th>
              <th className="p-3 w-32">规格</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {sortedOrders.map((row) => (
              <tr key={row.id} className={`hover:bg-slate-50 ${row.isBlacklisted ? 'bg-red-50' : ''}`}>
                 <td className="p-3 text-center">
                   <input 
                    type="checkbox"
                    checked={selectedIds.has(row.id)}
                    onChange={() => handleSelectRow(row.id)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                   />
                 </td>
                 <td className="p-3">
                   {row.isBlacklisted && (
                     <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                       🔴 地址预警
                     </span>
                   )}
                 </td>
                 
                {[
                  { k: 'customerOrderNo', w: 'font-mono text-xs' },
                  { k: 'customerTrackingNo', w: 'bg-slate-50', readonly: true },
                  { k: 'recipientName', w: 'font-medium text-slate-900' },
                  { k: 'address1', w: 'max-w-xs' },
                  { k: 'address2', w: 'max-w-xs' },
                  { k: 'city', w: '' },
                  { k: 'empty1', w: 'bg-slate-50', readonly: true },
                  { k: 'zip', w: '' },
                  { k: 'empty2', w: 'bg-slate-50', readonly: true },
                  { k: 'phone', w: 'font-mono' },
                  { k: 'productNameEng', w: 'bg-slate-50', readonly: true },
                  { k: 'productNameCn', w: 'max-w-xs', customRender: (val: string) => (
                      <div className="flex items-center">
                        <span className="truncate">{val}</span>
                        {row.warehouse && row.warehouse !== "Other" && (
                            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 shrink-0">
                                {row.warehouse}
                            </span>
                        )}
                      </div>
                  )},
                  { k: 'quantity', w: 'text-center' },
                  { k: 'remarks', w: 'text-slate-500' },
                  { k: 'specs', w: 'text-slate-500' }
                ].map((col, cIdx) => (
                  <td key={cIdx} className={`p-3 ${col.w}`}>
                    {!col.readonly ? (
                      <EditableCell
                        value={(row as any)[col.k] || ""}
                        isEditing={editingCell?.id === row.id && editingCell?.field === col.k}
                        onDoubleClick={() => startEdit(row.id, col.k)}
                        onSave={(val) => handleSave(row.id, col.k as keyof OrderRow, val)}
                        onCancel={() => setEditingCell(null)}
                      />
                    ) : (
                      (col as any).customRender && (!editingCell || editingCell.id !== row.id || editingCell.field !== col.k) ? (
                         <div onDoubleClick={() => !col.readonly && startEdit(row.id, col.k)} className="cursor-pointer">
                           {(col as any).customRender((row as any)[col.k])}
                         </div>
                      ) : (
                         !col.readonly && (col.k === 'productNameCn') ? (
                           <EditableCell 
                              value={(row as any)[col.k]} 
                              isEditing={editingCell?.id === row.id && editingCell?.field === col.k}
                              onDoubleClick={() => startEdit(row.id, col.k)}
                              onSave={(val) => handleSave(row.id, col.k as keyof OrderRow, val)}
                              onCancel={() => setEditingCell(null)}
                           />
                         ) : (
                            (row as any)[col.k]
                         )
                      )
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};