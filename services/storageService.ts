import { HistoryItem } from '../types';

// 使用相对路径，这样请求会通过 Vite 的代理转发到 3001 端口
// 避免了直接访问 localhost:3001 可能产生的跨域或网络问题
const API_URL = '/api/history';
const LOCAL_STORAGE_KEY = 'orderParserHistory';

/**
 * storageService
 * 负责保存和读取历史记录。
 * 逻辑：优先尝试连接本地 Node.js 后端。
 * 如果后端离线（fetch 失败），则降级使用浏览器的 localStorage。
 */
export const storageService = {
  
  async getAll(): Promise<HistoryItem[]> {
    try {
      // 尝试从本地后端 API 获取数据
      const response = await fetch(API_URL, { 
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log("Loaded history from Local Server");
      return data;

    } catch (error) {
      console.warn("Local Server unavailable, falling back to LocalStorage.", error);
      // 降级：读取 LocalStorage
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    }
  },

  async save(item: HistoryItem): Promise<void> {
    try {
      // 尝试保存到本地后端
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });

      if (!response.ok) throw new Error('Failed to save to Server');

    } catch (error) {
      console.warn("Could not save to Server, saving to LocalStorage.", error);
      // 降级：保存到 LocalStorage
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      const history: HistoryItem[] = saved ? JSON.parse(saved) : [];
      // 将新条目加到最前面
      const newHistory = [item, ...history];
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newHistory));
    }
  },

  async update(id: string, updatedResult: any): Promise<void> {
    try {
      // 尝试更新本地后端
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result: updatedResult })
      });

      if (!response.ok) throw new Error('Failed to update Server');

    } catch (error) {
      console.warn("Could not update Server, updating LocalStorage.", error);
      // 降级：更新 LocalStorage
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const history: HistoryItem[] = JSON.parse(saved);
        const newHistory = history.map(item => 
          item.id === id ? { ...item, result: updatedResult } : item
        );
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newHistory));
      }
    }
  }
};