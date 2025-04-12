// models/logModel.js

const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  log_id: { type: String, required: true, unique: true },
  device_id: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  event_type: { type: String, required: true }, // 如 "parameter_update", "firmware_upgrade"
  details: { type: Object, required: true },
});

// 添加索引
logSchema.index({ device_id: 1, timestamp: -1 });

module.exports = mongoose.model('Log', logSchema);