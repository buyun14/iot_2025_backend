const express = require('express');
const mongoose = require('mongoose');
const deviceRoutes = require('./routes/deviceRoutes');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();

// 配置环境变量
require('dotenv').config();

// 中间件
app.use(express.json());
app.use(authMiddleware); //全局认证

// 连接数据库
mongoose.connect('mongodb://localhost:27017/iot_platform', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// 路由
app.use('/api', deviceRoutes);

module.exports = app;