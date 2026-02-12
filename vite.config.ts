import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

export default defineConfig(({ mode }) => {
  const root = path.resolve('.');
  // 1. 标准加载
  const env = loadEnv(mode, root, '');
  
  console.log("\n================ ENV DEBUG ================");
  console.log("工作目录:", root);
  
  // 2. 诊断文件列表，帮用户发现 .txt 问题
  try {
      const files = fs.readdirSync(root);
      const potentialEnvFiles = files.filter(f => f.startsWith('.env'));
      console.log("发现的环境变量文件:", potentialEnvFiles);

      // 检查是否包含 .txt (Windows 常见错误)
      const txtFiles = potentialEnvFiles.filter(f => f.endsWith('.txt'));
      if (txtFiles.length > 0) {
          console.error("\x1b[31m%s\x1b[0m", "🚨 重大警告: 你的文件有隐藏的 .txt 后缀!");
          console.error("\x1b[31m%s\x1b[0m", `   请将文件: [${txtFiles.join(', ')}] 重命名，去掉 .txt`);
      }
  } catch (e) {
      console.log("无法读取目录文件:", e);
  }

  // 3. 如果 loadEnv 没读到，尝试暴力读取 .env.local
  if (!env.API_KEY) {
     console.log("⚠️  loadEnv 未检测到 Key，尝试手动读取 .env.local ...");
     try {
        const localEnvPath = path.resolve(root, '.env.local');
        if (fs.existsSync(localEnvPath)) {
            const content = fs.readFileSync(localEnvPath, 'utf-8');
            // 简单的正则匹配
            const match = content.match(/API_KEY\s*=\s*([^\s]+)/);
            if (match && match[1]) {
                env.API_KEY = match[1].trim();
                console.log("\x1b[32m%s\x1b[0m", "✅ 成功: 通过手动解析读取到了 API_KEY");
            }
        }
     } catch (e) {
         console.error("   手动读取失败");
     }
  }

  // 4. 最终状态报告
  if (env.API_KEY) {
    console.log("\x1b[32m%s\x1b[0m", `✅ API_KEY 状态: 已加载 (长度: ${env.API_KEY.length})`);
  } else {
    console.log("\x1b[31m%s\x1b[0m", "❌ API_KEY 状态: 缺失 (应用将无法运行)");
  }
  console.log("===========================================\n");

  return {
    plugins: [react()],
    define: {
      'process.env': JSON.stringify(env),
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});