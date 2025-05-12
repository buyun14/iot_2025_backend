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
import cors from 'cors'; // 引入 cors 模块
import loggerMiddleware from './middleware/loggerMiddleware'; // 新增
import mqttTopicRoutes from './routes/mqttTopicRoutes';
import createSmartDeviceRoutes from './routes/smartDeviceRoutes';
import mqtt from 'mqtt';
import { SmartDeviceManager } from './services/smartDeviceManager';
import { mqttHandler } from './services/mqttHandler';

// 添加类型声明
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      FRONTEND_URL?: string;
      REDIS_URL?: string;
      MQTT_BROKER_URL?: string;
      MONGO_URI?: string;
      DEVICE_PREFIX?: string;
    }
  }
}

const app: Express = express();

app.use(loggerMiddleware);

// 在所有路由之前添加 CORS 配置
app.use(cors({
    //origin: process.env.FRONTEND_URL || 'http://localhost:3000', // 前端开发服务器地址
    origin: '*', // 允许所有源
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

console.log('环境变量:', {
  REDIS_URL: process.env.REDIS_URL,
  MQTT_BROKER_URL: process.env.MQTT_BROKER_URL,
  MONGO_URI: process.env.MONGO_URI,
  DEVICE_PREFIX: process.env.DEVICE_PREFIX
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

// 创建MQTT客户端
const mqttClient = mqtt.connect(process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883');

mqttClient.on('connect', () => {
  console.log('MQTT Broker 已连接');
});

mqttClient.on('error', (err) => {
  console.error('MQTT 连接错误:', err);
});

// 路由
app.use('/api', deviceRoutes);
app.use('/api', logRoutes);
app.use('/api/video', cameraRoutes);
app.use('/api/mqtt-topics', mqttTopicRoutes);

// 添加智能设备路由
const devicePrefix = process.env.DEVICE_PREFIX || 'home/devices';
const smartDeviceManager = new SmartDeviceManager(mqttHandler.getMqttClient(), devicePrefix);
mqttHandler.setSmartDeviceManager(smartDeviceManager);
app.use('/api/smart', createSmartDeviceRoutes(mqttHandler.getMqttClient(), devicePrefix));

export default app; 