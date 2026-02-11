import fs from 'fs/promises';
import path from 'path';
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;
const DB_FILE = path.resolve('history_db.json');

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// 初始化：确保数据库文件存在
async function initDB() {
    try {
        await fs.access(DB_FILE);
    } catch {
        console.log('📦 创建本地数据库文件: history_db.json');
        await fs.writeFile(DB_FILE, '[]');
    }
}
initDB();

console.log('===================================================');
console.log('✅ 后端服务已启动 (文件存储模式)');
console.log(`   数据存储在: ${DB_FILE}`);
console.log('===================================================');

// API 路由

// 1. 获取所有历史记录
app.get('/api/history', async (req, res) => {
    try {
        const data = await fs.readFile(DB_FILE, 'utf-8');
        const history = JSON.parse(data || '[]');
        // 按时间倒序
        history.sort((a, b) => b.timestamp - a.timestamp);
        res.json(history);
    } catch (err) {
        console.error('读取记录失败:', err);
        res.json([]);
    }
});

// 2. 保存新记录
app.post('/api/history', async (req, res) => {
    const newItem = req.body;
    if (!newItem || !newItem.id) {
        return res.status(400).send('Missing data');
    }

    try {
        const data = await fs.readFile(DB_FILE, 'utf-8');
        const history = JSON.parse(data || '[]');
        
        history.unshift(newItem); // 加到最前面

        await fs.writeFile(DB_FILE, JSON.stringify(history, null, 2));
        res.json({ success: true });
    } catch (err) {
        console.error('保存记录失败:', err);
        res.status(500).send('Server Error');
    }
});

// 3. 更新现有记录
app.put('/api/history/:id', async (req, res) => {
    const { id } = req.params;
    const { result } = req.body; 

    try {
        const data = await fs.readFile(DB_FILE, 'utf-8');
        let history = JSON.parse(data || '[]');

        const index = history.findIndex(item => item.id === id);
        if (index !== -1) {
            history[index].result = result;
            await fs.writeFile(DB_FILE, JSON.stringify(history, null, 2));
            res.json({ success: true });
        } else {
            res.status(404).send('Not found');
        }
    } catch (err) {
        console.error('更新记录失败:', err);
        res.status(500).send('Server Error');
    }
});

app.listen(PORT, () => {
    console.log(`🚀 API 服务运行在: http://localhost:${PORT}`);
});