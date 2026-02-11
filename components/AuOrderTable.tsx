import React, { useState, useEffect, useRef, useMemo } from 'react';
import { OrderRow } from '../types';

interface AuOrderTableProps {
  orders: OrderRow[];
  onUpdateOrder: (id: string, field: keyof OrderRow, value: any) => void;
  onBack: () => void;
}

// Reusing EditableCell logic locally for this component
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

export const AuOrderTable: React.FC<AuOrderTableProps> = ({ orders, onUpdateOrder, onBack }) => {
  const [editingCell, setEditingCell] = useState<{ id: string, field: string } | null>(null);

  // Sorting: Similar logic, or just by date/order no? 
  // Requirement doesn't specify sort, but let's keep consistent with main table or just by order number.
  // Let's rely on the order passed in (which is usually sorted).
  
  const startEdit = (id: string, field: string) => {
    setEditingCell({ id, field });
  };

  const handleSave = (id: string, field: keyof OrderRow, val: string) => {
    onUpdateOrder(id, field, val);
    setEditingCell(null);
  };

  const copyToClipboard = () => {
    const headers = [
      "日期", "参考编号", "收件人姓名", "省/州/府/Province", "区/District", 
      "城市/区/City", "街道", "邮编", "收件人电话", "SKU", "数量", "规格"
    ];

    const today = new Date();
    const dateStr = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`;

    const rows = orders.map(o => [
      dateStr,
      o.customerOrderNo,
      o.recipientName,
      o.state || "",
      o.city, // District
      o.city, // City
      o.street || o.address1, // Fallback to address1 if street is empty
      o.zip,
      o.phone,
      o.productNameCn,
      o.quantity,
      o.specs
    ].join("\t"));

    const text = [headers.join("\t"), ...rows].join("\n");
    navigator.clipboard.writeText(text).then(() => {
      alert(`Copied ${orders.length} AU orders to clipboard!`);
    });
  };

  const todayStr = useMemo(() => {
     const today = new Date();
     return `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`;
  }, []);

  return (
    <div className="space-y-4 animate-fade-in">
       <div className="flex justify-between items-center bg-indigo-50 p-4 rounded-lg border border-indigo-100">
        <div>
           <h2 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
             <span>🇦🇺</span> Australian Orders
           </h2>
           <p className="text-indigo-600 text-sm mt-1">
             Edits here sync with the main table. Showing {orders.length} orders.
           </p>
        </div>
        
        <div className="flex items-center gap-3">
            <button
            onClick={onBack}
            className="px-4 py-2 bg-white border border-indigo-200 text-indigo-700 rounded-lg font-medium hover:bg-indigo-100 transition-colors"
            >
            Back to All Orders
            </button>

            <button
            onClick={copyToClipboard}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 shadow-sm"
            >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
            Copy AU List
            </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-indigo-800 text-white font-semibold">
            <tr>
              <th className="p-3 w-16">日期</th>
              <th className="p-3 w-32">参考编号</th>
              <th className="p-3 w-32">收件人姓名</th>
              <th className="p-3 w-16">省/州</th>
              <th className="p-3 w-32">区/District</th>
              <th className="p-3 w-32">城市/City</th>
              <th className="p-3 w-64">街道</th>
              <th className="p-3 w-20">邮编</th>
              <th className="p-3 w-32">电话</th>
              <th className="p-3 w-32">SKU</th>
              <th className="p-3 w-16">数量</th>
              <th className="p-3 w-32">规格</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {orders.map((row) => (
              <tr key={row.id} className="hover:bg-indigo-50">
                <td className="p-3 text-slate-500 select-none">{todayStr}</td>
                
                {/* Reference No */}
                <td className="p-3">
                  <EditableCell
                    value={row.customerOrderNo}
                    isEditing={editingCell?.id === row.id && editingCell?.field === 'customerOrderNo'}
                    onDoubleClick={() => startEdit(row.id, 'customerOrderNo')}
                    onSave={(val) => handleSave(row.id, 'customerOrderNo', val)}
                    onCancel={() => setEditingCell(null)}
                  />
                </td>

                {/* Name */}
                <td className="p-3 font-medium">
                   <EditableCell
                    value={row.recipientName}
                    isEditing={editingCell?.id === row.id && editingCell?.field === 'recipientName'}
                    onDoubleClick={() => startEdit(row.id, 'recipientName')}
                    onSave={(val) => handleSave(row.id, 'recipientName', val)}
                    onCancel={() => setEditingCell(null)}
                  />
                </td>

                {/* State */}
                <td className="p-3">
                   <EditableCell
                    value={row.state || ""}
                    isEditing={editingCell?.id === row.id && editingCell?.field === 'state'}
                    onDoubleClick={() => startEdit(row.id, 'state')}
                    onSave={(val) => handleSave(row.id, 'state', val)}
                    onCancel={() => setEditingCell(null)}
                  />
                </td>

                {/* District (Maps to City) */}
                <td className="p-3">
                   <EditableCell
                    value={row.city}
                    isEditing={editingCell?.id === row.id && editingCell?.field === 'district_alias'}
                    onDoubleClick={() => startEdit(row.id, 'district_alias')}
                    onSave={(val) => handleSave(row.id, 'city', val)} // Updates 'city' field
                    onCancel={() => setEditingCell(null)}
                  />
                </td>

                 {/* City (Maps to City) */}
                 <td className="p-3">
                   <EditableCell
                    value={row.city}
                    isEditing={editingCell?.id === row.id && editingCell?.field === 'city'}
                    onDoubleClick={() => startEdit(row.id, 'city')}
                    onSave={(val) => handleSave(row.id, 'city', val)}
                    onCancel={() => setEditingCell(null)}
                  />
                </td>

                {/* Street (Maps to Street, fallback address1) */}
                <td className="p-3">
                   <EditableCell
                    value={row.street || row.address1}
                    isEditing={editingCell?.id === row.id && editingCell?.field === 'street'}
                    onDoubleClick={() => startEdit(row.id, 'street')}
                    onSave={(val) => handleSave(row.id, 'street', val)}
                    onCancel={() => setEditingCell(null)}
                  />
                </td>

                {/* Zip */}
                <td className="p-3">
                   <EditableCell
                    value={row.zip}
                    isEditing={editingCell?.id === row.id && editingCell?.field === 'zip'}
                    onDoubleClick={() => startEdit(row.id, 'zip')}
                    onSave={(val) => handleSave(row.id, 'zip', val)}
                    onCancel={() => setEditingCell(null)}
                  />
                </td>

                 {/* Phone */}
                 <td className="p-3 font-mono text-xs">
                   <EditableCell
                    value={row.phone}
                    isEditing={editingCell?.id === row.id && editingCell?.field === 'phone'}
                    onDoubleClick={() => startEdit(row.id, 'phone')}
                    onSave={(val) => handleSave(row.id, 'phone', val)}
                    onCancel={() => setEditingCell(null)}
                  />
                </td>

                 {/* SKU */}
                 <td className="p-3 text-xs">
                   <EditableCell
                    value={row.productNameCn}
                    isEditing={editingCell?.id === row.id && editingCell?.field === 'productNameCn'}
                    onDoubleClick={() => startEdit(row.id, 'productNameCn')}
                    onSave={(val) => handleSave(row.id, 'productNameCn', val)}
                    onCancel={() => setEditingCell(null)}
                  />
                </td>

                 {/* Quantity */}
                 <td className="p-3 text-center">
                   <EditableCell
                    value={row.quantity}
                    isEditing={editingCell?.id === row.id && editingCell?.field === 'quantity'}
                    onDoubleClick={() => startEdit(row.id, 'quantity')}
                    onSave={(val) => handleSave(row.id, 'quantity', val)}
                    onCancel={() => setEditingCell(null)}
                  />
                </td>

                 {/* Specs */}
                 <td className="p-3 text-xs text-slate-500">
                   <EditableCell
                    value={row.specs}
                    isEditing={editingCell?.id === row.id && editingCell?.field === 'specs'}
                    onDoubleClick={() => startEdit(row.id, 'specs')}
                    onSave={(val) => handleSave(row.id, 'specs', val)}
                    onCancel={() => setEditingCell(null)}
                  />
                </td>

              </tr>
            ))}
            {orders.length === 0 && (
                 <tr>
                    <td colSpan={12} className="p-8 text-center text-slate-500">
                        No Australian orders found in the current dataset.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};