// models/sensorDataModel.js

const mongoose = require('mongoose');

const sensorDataSchema = new mongoose.Schema({
  device_id: { type: String, required: true, index: true },
  timestamp: { type: Date, default: Date.now, index: true },
  value: { type: Number, required: true },
});

module.exports = mongoose.model('SensorData', sensorDataSchema);