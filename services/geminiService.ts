import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ParsingResult, OrderRow } from "../types";

const ORDER_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    rawOrderCount: { type: Type.INTEGER, description: "Total number of unique order numbers found in the input." },
    orders: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          customerOrderNo: { type: Type.STRING },
          recipientName: { type: Type.STRING, description: "Extracted from Remarks. If Chinese, convert to Pinyin." },
          address1: { type: Type.STRING, description: "Merged address (House/Room No, Apt, Street, City). Comma separated. Exclude Name/Phone." },
          street: { type: Type.STRING, description: "Street part ONLY (House/Unit + Street Name). Used for AU export." },
          city: { type: Type.STRING, description: "Extracted city/suburb from Remarks." },
          state: { type: Type.STRING, description: "State/Province code (e.g., VIC, NSW, QLD) for AU orders." },
          zip: { type: Type.STRING, description: "Extracted postcode from Remarks." },
          phone: { type: Type.STRING, description: "Extracted phone from Remarks. Remove +44/0 prefix." },
          productNameCn: { type: Type.STRING, description: "Exact product Chinese name found in text." },
          quantity: { type: Type.STRING, description: "e.g. '1', '2'" },
          remarks: { type: Type.STRING, description: "Any special remarks like '合箱', '自提'" },
          specs: { type: Type.STRING, description: "Content after '规格：' or '规格ID：'" },
          isBlacklisted: { type: Type.BOOLEAN, description: "True if address contains Campus House, Westfield Court, Cottingham Road, or Hull." },
          warehouse: { type: Type.STRING, description: "Extracted warehouse name from Product Name (e.g. '诺丁汉', '伯明翰', '澳大利亚', '德国'). Default to 'Other'." }
        },
        required: ["customerOrderNo", "recipientName", "address1", "productNameCn", "quantity", "isBlacklisted", "warehouse"],
      },
    },
  },
  required: ["rawOrderCount", "orders"],
};

export const parseOrdersWithGemini = async (text: string): Promise<ParsingResult> => {
  // 懒加载初始化
  // 增加调试日志
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    console.error("Debug Info: process.env is", process.env);
    throw new Error("System Error: API_KEY is missing. Please check your .env.local file and restart the server.");
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });

  const prompt = `
    You are a strict data parsing engine for e-commerce logistics. 
    Analyze the following raw text containing multiple order information. 
    
    CRITICAL RULES:
    1.  **Strict Address Extraction**: IGNORE the system-generated domestic address (e.g., "广东省 东莞市..."). ONLY extract recipient info (Name, Phone, Address) from "商家备注" (Merchant Remark) or "用户备注" (User Remark). If these remarks are empty or do not contain address info, leave the address/name/phone fields EMPTY.
    2.  **Address 1 Field**: The 'address1' field must contain the FULL merged address: House/Room Number, Apartment Name, Street Name, and City/Suburb. Comma separated.
    3.  **Address Splits (Crucial for AU)**: In addition to 'address1', you MUST separately extract:
        *   **street**: The House/Unit number and Street Name only.
        *   **city**: The Suburb or City name.
        *   **state**: The State/Province code (e.g., VIC, NSW, QLD, WA) especially for Australian orders.
    4.  **Name Pinyin**: If the extracted 'recipientName' is in Chinese characters, you MUST translate it into Hanyu Pinyin (e.g., "张三" -> "Zhang San").
    5.  **Blacklist Check**: Set 'isBlacklisted' to true if address contains: "Campus House", "Westfield Court", "Cottingham Road", or "Hull".
    6.  **Product Name**: Extract the Chinese product name EXACTLY as it appears. Do not summarize.
    7.  **Splitting**: If an order has multiple products or specs, create separate objects for each SKU.
    8.  **Punctuation**: Replace all Chinese punctuation (，：／（）) with English equivalents or spaces.
    9.  **Phone Cleaning**: Remove international codes (+44, +61) and leading zeros from the extracted phone number.
    10. **Warehouse Extraction**: Analyze the 'productNameCn'. Identify the warehouse or origin location (e.g., '诺丁汉' (Nottingham), '伯明翰' (Birmingham), '澳大利亚' (Australia), '德国' (Germany)). Extract just the location name. If unknown, use 'Other'.
    11. **STRICT EMPTY FILLING**: If any information (Recipient Name, Address, Phone) is missing from the *Remarks*, YOU MUST LEAVE THE FIELD EMPTY string (""). DO NOT infer data. DO NOT use "Unknown". DO NOT fill with the domestic address.
    
    Input Text:
    ${text}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: ORDER_SCHEMA,
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No data returned from AI");

    const data = JSON.parse(jsonText);

    // Post-processing to ensure all fields match OrderRow interface and apply specific defaults
    const processedOrders: OrderRow[] = data.orders.map((o: any, index: number) => ({
      id: crypto.randomUUID(), // Generate unique ID for editing/tracking
      customerOrderNo: o.customerOrderNo || "",
      customerTrackingNo: "", // Rule 8: Empty
      recipientName: o.recipientName || "",
      address1: o.address1 || "",
      address2: "", // Rule 5 implies this column exists, but Rule 1 merges everything to Address 1.
      address3: "", // New for Bham
      street: o.street || "", // New for AU
      city: o.city || "",
      state: o.state || "",   // New for AU
      empty1: "", // Rule 8
      zip: o.zip || "",
      empty2: "", // Rule 8
      phone: o.phone || "",
      productNameEng: "", // Rule 8
      productNameCn: o.productNameCn || "",
      quantity: o.quantity || "1",
      remarks: o.remarks || "",
      specs: o.specs || "",
      isBlacklisted: o.isBlacklisted || false,
      warehouse: o.warehouse || "Other",
      originalRawOrderIndex: index, // Approximation for tracking
    }));

    // Calculate AU Row Count based on specific keywords: "澳大利亚", "澳洲", "悉尼"
    const auKeywords = ["澳大利亚", "澳洲", "悉尼", "Australia", "Sydney"];
    const auRowCount = processedOrders.filter(o => {
        const textToCheck = (
            (o.warehouse || "") + 
            (o.productNameCn || "") + 
            (o.address1 || "") + 
            (o.city || "") + 
            (o.state || "")
        ).toLowerCase();
        return auKeywords.some(k => textToCheck.includes(k.toLowerCase()));
    }).length;

    return {
      orders: processedOrders,
      stats: {
        rawOrderCount: data.rawOrderCount || 0,
        processedRowCount: processedOrders.length,
        auRowCount: auRowCount,
      },
      changeLog: [] // Initialize empty change log
    };
  } catch (error) {
    console.error("Gemini Parsing Error:", error);
    throw new Error("Failed to process orders. " + (error as Error).message);
  }
};