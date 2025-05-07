// app.ts

// 配置环境变量
import dotenv from 'dotenv';
dotenv.config();

import express, { Express } from 'express';
import mongoose from 'mongoose';
import deviceRoutes from './routes/deviceRoutes';
import logRoutes from './routes/logRoutes';
import cameraRoutes from './routes/cameraRoutes'; // 添加摄像头路由
import authMiddleware from './middleware/authMiddleware';
import mqttHandler from './services/mqttHandler'; // 引入 MQTT 处理模块
import cors from 'cors'; // 引入 cors 模块
import loggerMiddleware from './middleware/loggerMiddleware'; // 新增

// 添加类型声明
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      FRONTEND_URL?: string;
      REDIS_URL?: string;
      MQTT_BROKER_URL?: string;
      MONGO_URI?: string;
    }
  }
}

const app: Express = express();

app.use(loggerMiddleware);

// 在所有路由之前添加 CORS 配置
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000', // 前端开发服务器地址
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

console.log('环境变量:', {
  REDIS_URL: process.env.REDIS_URL,
  MQTT_BROKER_URL: process.env.MQTT_BROKER_URL,
  MONGO_URI: process.env.MONGO_URI,
});

// 中间件
app.use(express.json());
app.use(authMiddleware); // 全局认证

// 连接数据库
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/iot_platform').then(() => {
  console.log('MongoDB 已连接');
}).catch((err) => {
  console.error('MongoDB 连接失败:', err);
});

// 启动 MQTT 客户端
mqttHandler.on('connect', () => {
  console.log('MQTT 客户端已连接');
});

// 路由
//app.use('/api/devices', deviceRoutes);
app.use('/api', deviceRoutes);
//app.use('/api/logs', logRoutes);
app.use('/api', logRoutes);
app.use('/api/video', cameraRoutes); // 添加视频相关路由，使用 /api/video 前缀

export default app; 