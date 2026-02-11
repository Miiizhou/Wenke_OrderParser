export interface OrderRow {
  id: string;                   // Unique ID for React keys and editing
  customerOrderNo: string;      // 客户订单号
  customerTrackingNo: string;   // 客户快递单号 (Empty)
  recipientName: string;        // 收件人姓名
  address1: string;             // 收件人街道地址1 (Merged)
  address2: string;             // 收件人街道地址2
  address3?: string;            // 收件人街道地址3 (For Bham export)
  city: string;                 // 收件人城市
  empty1: string;               // 空字段
  zip: string;                  // 收件人邮编
  empty2: string;               // 空字段
  phone: string;                // 收件人电话
  productNameEng: string;       // 商品英文品名 (Empty)
  productNameCn: string;        // 商品中文品名 (Exact)
  quantity: string;             // 数量
  remarks: string;              // 备注
  specs: string;                // 规格
  
  // New fields for AU Export
  street?: string;              // Street address only (e.g. "Unit 5, 3 Brewery Ln")
  state?: string;               // State/Province code (e.g. "VIC")

  // Internal flags for logic
  isBlacklisted: boolean;
  warehouse: string;            // Extracted warehouse location (e.g. 诺丁汉, 伯明翰, 澳大利亚)
  originalRawOrderIndex: number; // To track unique orders for stats
}

export interface ProcessingStats {
  rawOrderCount: number;
  processedRowCount: number;
  auRowCount: number; // New field for AU SKU count
}

export interface ChangeLogEntry {
  timestamp: number;
  customerOrderNo: string;
  field: string;
  oldValue: string;
  newValue: string;
}

export interface ParsingResult {
  orders: OrderRow[];
  stats: ProcessingStats;
  changeLog: ChangeLogEntry[];
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  result: ParsingResult;
}