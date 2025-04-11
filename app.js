// app.js

// 配置环境变量
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const deviceRoutes = require('./routes/deviceRoutes');
const authMiddleware = require('./middleware/authMiddleware');
const mqttHandler = require('./services/mqttHandler'); // 引入 MQTT 处理模块
const cors = require('cors'); // 引入 cors 模块

const app = express();

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
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/iot_platform', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB 已连接');
}).catch((err) => {
  console.error('MongoDB 连接失败:', err);
});

// 启动 MQTT 客户端
mqttHandler.on('connect', () => {
  console.log('MQTT 客户端已连接');
});

// 路由
app.use('/api', deviceRoutes);

module.exports = app;