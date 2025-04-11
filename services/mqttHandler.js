// services\redisClient.js

const mqtt = require('mqtt');
const redisClient = require('./redisClient');
const Device = require('../models/deviceModel');
const SensorData = require('../models/sensorDataModel');

// 创建 MQTT 客户端
const mqttClient = mqtt.connect(process.env.MQTT_BROKER_URL || 'mqtt://localhost');

mqttClient.on('connect', () => {
  console.log('MQTT 连接成功');
  mqttClient.subscribe('AIOTSIM2APP', (err) => {
    if (err) console.error('订阅失败:', err);
  });
});

mqttClient.on('message', async (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    const deviceId = `${data.type}-${data.id}`; // 格式：sensor_type-unique_id
    const value = data.value;

    // 更新 Redis 缓存
    await redisClient.hSet(`device:${deviceId}`, { current_value: value });

    // 更新 MongoDB 设备状态
    const device = await Device.findOne({ device_id: deviceId });
    if (!device) return;

    device.current_value = value;
    if (value <= device.thresholds.lower) {
      device.status = 'on';
    } else if (value >= device.thresholds.upper) {
      device.status = 'off';
    }
    await device.save();

    // 保存历史数据到 MongoDB
    const sensorData = new SensorData({ device_id: deviceId, value });
    await sensorData.save();
  } catch (error) {
    console.error('MQTT 数据处理失败:', error);
  }
});

module.exports = mqttClient;