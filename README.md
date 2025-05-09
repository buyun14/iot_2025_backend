# 智能家居后端系统

这是一个基于 Node.js 和 TypeScript 的智能家居后端系统，提供设备管理、状态监控、MQTT 通信等功能。

## 功能特点

- 支持多种智能家居设备类型
- 实时设备状态监控和验证
- MQTT 通信支持
- RESTful API 接口
- 设备状态历史记录
- 类型安全的状态处理

## 支持的设备类型

- 智能灯 (Light)
- 温控器 (Thermostat)
- 智能门锁 (DoorLock)
- 智能窗帘 (Blind)
- 空调 (AirConditioner)
- 烟雾报警器 (SmokeDetector)
- 风扇 (Fan)
- 智能插座 (Plug)

## 技术栈

- Node.js
- TypeScript
- Express.js
- MongoDB
- MQTT
- Mongoose

## 环境要求

- Node.js 16+
- MongoDB 4.4+
- MQTT Broker (如 Mosquitto)

## 安装步骤

1. 克隆项目：
```bash
git clone [项目地址]
cd backend
```

2. 安装依赖：
```bash
npm install
```

3. 配置环境变量：
创建 `.env` 文件并设置以下变量：
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/smart_home
MQTT_BROKER_URL=mqtt://localhost:1883
DEVICE_PREFIX=home/devices
JWT_SECRET=your_jwt_secret
```

4. 启动服务：
```bash
npm run dev
```

## 项目结构

```
backend/
├── src/
│   ├── models/              # 数据模型
│   │   ├── cameraModel.ts
│   │   ├── loggerModel.ts
│   │   ├── deviceModel.ts
│   │   ├── mqttTopicModel.ts           # MQTT主题
│   │   ├── sensorDataModel.ts
│   │   ├── smartDeviceModel.ts
│   │   └── deviceStateHistoryModel.ts  # （智能？）设备状态历史
|   |
│   ├── config/    
│   │   ├── mqtt.ts
│   │   ├── srsConfig.ts
│   │   └── db.ts
│   ├── controllers/        # 控制器
│   │   ├── cameraController.ts
│   │   ├── deviceController.ts
│   │   ├── logController.ts
│   │   ├── mqttTopicController.ts
│   │   └── smartDeviceController.ts
|   |
│   ├── services/           # 业务逻辑
│   │   ├── srsService.ts
│   │   ├── mqttHandler.ts
│   │   ├── redisClient.ts
│   │   ├── smartDeviceManager.ts            # 智能设备管理
│   │   ├── deviceStateProcessor.ts          # 处理设备状态
│   │   ├── deviceStateValidator.ts          # 设备状态验证
│   │   └── deviceCommandProcessor.ts        # 设备命令处理器
│   ├── routes/            # API 路由
│   │   ├── cameraRoutes.ts
│   │   ├── smartDeviceRoutes.ts             # 智能设备
│   │   ├── logRoutes.ts    
│   │   ├── deviceRoutes.ts
│   │   └── mqttTopicRoutes.ts
│   ├── middleware/        # 中间件
│   │   ├── authMiddleware.ts
│   │   └── loggerMiddleware.ts
│   └── app.ts            # 应用入口
├── .env
├── package.json
└── tsconfig.json
```

## API 文档

### 设备管理

- `GET /api/devices` - 获取所有设备
- `POST /api/devices` - 添加新设备
- `GET /api/devices/:deviceId` - 获取单个设备
- `PUT /api/devices/:deviceId` - 更新设备
- `DELETE /api/devices/:deviceId` - 删除设备

### 设备控制

- `POST /api/devices/:deviceId/command` - 发送设备命令
- `GET /api/devices/:deviceId/state` - 获取设备状态
- `GET /api/devices/:deviceId/history` - 获取设备状态历史

### MQTT 主题

- 设备状态主题：`{device_prefix}/status/{device_id}`
- 设备控制主题：`{device_prefix}/control/{device_id}`

## 设备状态验证

系统为每种设备类型提供了详细的状态验证规则：

- 基础状态验证（在线状态、更新时间等）
- 设备特定状态验证（数值范围、枚举值等）
- 类型安全的状态处理

## 开发指南

### 添加新设备类型

1. 在 `smartDeviceModel.ts` 中定义设备类型和状态接口
2. 在 `deviceStateValidator.ts` 中添加状态验证器
3. 在 `deviceStateProcessor.ts` 中添加状态处理器
4. 在 `deviceCommandProcessor.ts` 中添加命令处理器

### 运行测试

```bash
# 运行所有测试
npm test

# 运行特定测试
npm test -- -t "设备状态验证"
```

## 部署

1. 构建项目：
```bash
npm run build
```

2. 启动生产服务：
```bash
npm start
```

## 错误处理

系统提供多层错误处理机制：

- 设备状态验证错误
- MQTT 通信错误
- 数据库操作错误
- API 请求错误

## 性能优化

- 使用 MongoDB 索引优化查询
- 实现设备状态缓存
- 批量处理设备状态更新
- 异步处理非关键操作

## 安全措施

- JWT 认证
- 请求速率限制
- 数据验证和清理
- 错误日志记录

## 贡献指南

1. Fork 项目
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License

## 联系方式

如有问题或建议，请提交 Issue 或 Pull Request。 