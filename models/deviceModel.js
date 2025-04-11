// models/deviceModel.js

const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  device_id: { type: String, unique: true, required: true }, // 唯一设备 ID
  type: { type: String, enum: ['light', 'soil']}, // 设备类型
  name: String, // 设备名称
  thresholds: {
    lower: Number,
    upper: Number,
  },
  status: String, // 当前状态
  current_value: Number, // 当前值
});

module.exports = mongoose.model('Device', deviceSchema);