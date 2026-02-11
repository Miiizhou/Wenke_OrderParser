import React, { useState, useEffect, useRef } from 'react';
import { OrderRow } from '../types';

interface BhamOrderTableProps {
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
        className="w-full p-1 text-sm border-2 border-emerald-500 rounded focus:outline-none"
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
      className="w-full h-full min-h-[1.5rem] cursor-pointer hover:bg-emerald-50/50 rounded px-1 -ml-1 flex items-center truncate"
      title="Double click to edit"
    >
      {value}
    </div>
  );
};

export const BhamOrderTable: React.FC<BhamOrderTableProps> = ({ orders, onUpdateOrder, onBack }) => {
  const [editingCell, setEditingCell] = useState<{ id: string, field: string } | null>(null);

  const startEdit = (id: string, field: string) => {
    setEditingCell({ id, field });
  };

  const handleSave = (id: string, field: keyof OrderRow, val: string) => {
    onUpdateOrder(id, field, val);
    setEditingCell(null);
  };

  const copyToClipboard = () => {
    // Format: 客户订单号	收件人姓名	收件人城市	收件人电话	收件人邮编	收件人地址 1	收件人地址 2	收件人地址 3	空字段	商品数量	规格	商品中文品名 1
    const headers = [
      "客户订单号", "收件人姓名", "收件人城市", "收件人电话", "收件人邮编", 
      "收件人地址 1", "收件人地址 2", "收件人地址 3", "空字段", 
      "商品数量", "规格", "商品中文品名 1"
    ];

    const rows = orders.map(o => [
      o.customerOrderNo,
      o.recipientName,
      o.city,
      o.phone,
      o.zip,
      o.address1,
      o.address2,
      o.address3 || "",
      "", // Empty field
      o.quantity,
      o.specs,
      o.productNameCn
    ].join("\t"));

    const text = [headers.join("\t"), ...rows].join("\n");
    navigator.clipboard.writeText(text).then(() => {
      alert(`Copied ${orders.length} Birmingham orders to clipboard!`);
    });
  };

  return (
    <div className="space-y-4 animate-fade-in">
       <div className="flex justify-between items-center bg-emerald-50 p-4 rounded-lg border border-emerald-100">
        <div>
           <h2 className="text-xl font-bold text-emerald-900 flex items-center gap-2">
             <span>UK</span> Birmingham Orders
           </h2>
           <p className="text-emerald-700 text-sm mt-1">
             Manually selected orders. Edits here sync with the main table.
           </p>
        </div>
        
        <div className="flex items-center gap-3">
            <button
            onClick={onBack}
            className="px-4 py-2 bg-white border border-emerald-200 text-emerald-700 rounded-lg font-medium hover:bg-emerald-100 transition-colors"
            >
            Back to All Orders
            </button>

            <button
            onClick={copyToClipboard}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 shadow-sm"
            >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
            Copy Bham List
            </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-emerald-800 text-white font-semibold">
            <tr>
              <th className="p-3 w-32">客户订单号</th>
              <th className="p-3 w-32">收件人姓名</th>
              <th className="p-3 w-32">收件人城市</th>
              <th className="p-3 w-32">收件人电话</th>
              <th className="p-3 w-24">收件人邮编</th>
              <th className="p-3 w-48">收件人地址 1</th>
              <th className="p-3 w-32">收件人地址 2</th>
              <th className="p-3 w-32">收件人地址 3</th>
              <th className="p-3 w-16 text-emerald-300">空字段</th>
              <th className="p-3 w-16">商品数量</th>
              <th className="p-3 w-32">规格</th>
              <th className="p-3 w-32">商品中文品名 1</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {orders.map((row) => (
              <tr key={row.id} className="hover:bg-emerald-50">
                
                {/* Order No */}
                <td className="p-3 font-mono">
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

                {/* City */}
                <td className="p-3">
                   <EditableCell
                    value={row.city}
                    isEditing={editingCell?.id === row.id && editingCell?.field === 'city'}
                    onDoubleClick={() => startEdit(row.id, 'city')}
                    onSave={(val) => handleSave(row.id, 'city', val)}
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

                {/* Address 1 */}
                <td className="p-3">
                   <EditableCell
                    value={row.address1}
                    isEditing={editingCell?.id === row.id && editingCell?.field === 'address1'}
                    onDoubleClick={() => startEdit(row.id, 'address1')}
                    onSave={(val) => handleSave(row.id, 'address1', val)}
                    onCancel={() => setEditingCell(null)}
                  />
                </td>

                 {/* Address 2 */}
                 <td className="p-3">
                   <EditableCell
                    value={row.address2}
                    isEditing={editingCell?.id === row.id && editingCell?.field === 'address2'}
                    onDoubleClick={() => startEdit(row.id, 'address2')}
                    onSave={(val) => handleSave(row.id, 'address2', val)}
                    onCancel={() => setEditingCell(null)}
                  />
                </td>

                {/* Address 3 (New) */}
                 <td className="p-3">
                   <EditableCell
                    value={row.address3 || ""}
                    isEditing={editingCell?.id === row.id && editingCell?.field === 'address3'}
                    onDoubleClick={() => startEdit(row.id, 'address3')}
                    onSave={(val) => handleSave(row.id, 'address3', val)}
                    onCancel={() => setEditingCell(null)}
                  />
                </td>

                {/* Empty */}
                <td className="p-3 bg-slate-50"></td>

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

                 {/* Product Name CN */}
                 <td className="p-3 text-xs">
                   <EditableCell
                    value={row.productNameCn}
                    isEditing={editingCell?.id === row.id && editingCell?.field === 'productNameCn'}
                    onDoubleClick={() => startEdit(row.id, 'productNameCn')}
                    onSave={(val) => handleSave(row.id, 'productNameCn', val)}
                    onCancel={() => setEditingCell(null)}
                  />
                </td>

              </tr>
            ))}
            {orders.length === 0 && (
                 <tr>
                    <td colSpan={12} className="p-8 text-center text-slate-500">
                        No orders selected. Go back and select orders to extract.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};