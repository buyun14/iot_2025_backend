import { Request, Response } from 'express';
import Device from '../models/deviceModel';
import SensorData from '../models/sensorDataModel';
import Log from '../models/logModel';

// 获取设备列表
export const getDevices = async (_req: Request, res: Response): Promise<void> => {
  try {
    const devices = await Device.find();
    res.status(200).json(devices);
  } catch (error) {
    if (error instanceof Error && error.name === 'CastError') {
      res.status(400).json({ message: '无效的设备 ID 格式' });
      return;
    }
    res.status(500).json({ message: '服务器内部错误', error: error instanceof Error ? error.message : String(error) });
  }
};

// 获取单个设备详情
export const getDeviceById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const device = await Device.findOne({ device_id: id });
    if (!device) {
      res.status(404).json({ message: '设备未找到' });
      return;
    }
    res.status(200).json(device);
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
  }
};

// 更新设备参数(阈值)
export const updateDeviceConfig = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { temperature_threshold_low, temperature_threshold_high } = req.body;

  try {
    const oldDevice = await Device.findOne({ device_id: id });
    if (!oldDevice) {
      res.status(404).json({ message: '设备未找到' });
      return;
    }

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
    res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
  }
};

// 创建新设备
export const createDevice = async (req: Request, res: Response): Promise<void> => {
  const newDevice = new Device(req.body);
  try {
    await newDevice.save();
    res.status(201).json(newDevice);
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : String(error) });
  }
};

// 删除设备
export const deleteDevice = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const result = await Device.deleteOne({ device_id: id });
    if (result.deletedCount === 0) {
      res.status(404).json({ message: '设备不存在' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
  }
};

// 批量删除设备
export const batchDeleteDevices = async (req: Request, res: Response): Promise<void> => {
  const { ids } = req.body;
  try {
    await Device.deleteMany({ device_id: { $in: ids } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: '删除失败' });
  }
};

// 触发固件更新
export const triggerFirmwareUpdate = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { version, url } = req.body;

  try {
    const device = await Device.findOne({ device_id: id });
    if (!device) {
      res.status(404).json({ message: '设备未找到' });
      return;
    }

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
    res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
  }
};

// 获取设备历史传感器数据
export const getSensorDataHistory = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    // 查询传感器数据并按时间倒序排列
    const data = await SensorData.find({ device_id: id })
      .sort({ timestamp: -1 }) // 最新数据优先
      .limit(100); // 默认限制返回数量（可扩展分页参数）

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
  }
}; 