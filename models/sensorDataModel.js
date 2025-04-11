// models/sensorDataModel.js

const mongoose = require('mongoose');

const sensorDataSchema = new mongoose.Schema({
  device_id: { type: String, required: true }, // 设备 ID
  timestamp: { type: Date, default: Date.now }, // 时间戳
  value: Number, // 数据值
});

module.exports = mongoose.model('SensorData', sensorDataSchema);