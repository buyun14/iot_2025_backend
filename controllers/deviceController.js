// controllers/deviceController.js # 控制器逻辑

const Device = require('../models/deviceModel');
const Log = require('../models/logModel');

// 获取设备列表
exports.getDevices = async (req, res) => {
  try {
    const devices = await Device.find();
    res.status(200).json(devices);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: '无效的设备 ID 格式' });
    }
    res.status(500).json({ message: '服务器内部错误', error: error.message });
  }
};

// 获取单个设备详情
exports.getDeviceById = async (req, res) => {
  const { id } = req.params;
  try {
    const device = await Device.findOne({ device_id: id });
    if (!device) return res.status(404).json({ message: '设备未找到' });
    res.status(200).json(device);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 更新设备参数
exports.updateDeviceConfig = async (req, res) => {
  const { id } = req.params;
  const { temperature_threshold_low, temperature_threshold_high } = req.body;

  try {
    const oldDevice = await Device.findOne({ device_id: id });
    if (!oldDevice) return res.status(404).json({ message: '设备未找到' });

    await Device.updateOne(
      { device_id: id },
      { $set: { 
        'thresholds.lower': temperature_threshold_low,
        'thresholds.upper': temperature_threshold_high 
      } }
    );

    // 记录日志
    await Log.create({
      log_id: `${id}_config_${Date.now()}`,
      device_id: id,
      event_type: 'parameter_update',
      details: {
        old_value: oldDevice.thresholds,
        new_value: { lower: temperature_threshold_low, upper: temperature_threshold_high },
      },
    });

    res.status(200).json({ message: '参数更新成功' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 创建新设备
exports.createDevice = async (req, res) => {
  const newDevice = new Device(req.body);
  try {
    await newDevice.save();
    res.status(201).json(newDevice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 删除设备
exports.deleteDevice = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await Device.deleteOne({ device_id: id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: '设备不存在' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 触发固件更新
exports.triggerFirmwareUpdate = async (req, res) => {
  const { id } = req.params;
  const { version, url } = req.body;

  try {
    const device = await Device.findOne({ device_id: id });
    if (!device) return res.status(404).json({ message: '设备未找到' });

    // 更新固件版本
    await Device.updateOne({ device_id: id }, { firmware_version: version });

    // 记录日志
    await Log.create({
      log_id: `${id}_firmware_${Date.now()}`,
      device_id: id,
      event_type: 'firmware_upgrade',
      details: { version, url },
    });

    res.status(200).json({ message: '固件更新已触发' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};