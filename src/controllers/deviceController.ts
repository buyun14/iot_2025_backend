import { Request, Response } from 'express';
import Device from '../models/deviceModel';
import SensorData from '../models/sensorDataModel';
import Log from '../models/logModel';

/**
 * @api {get} /api/devices 获取设备列表
 * @apiName GetDevices
 * @apiGroup Device
 * @apiVersion 1.0.0
 *
 * @apiSuccess {Object[]} devices 设备列表
 * @apiSuccess {String} devices.device_id 设备ID
 * @apiSuccess {Object} devices.thresholds 设备阈值
 * @apiSuccess {Number} devices.thresholds.lower 下限阈值
 * @apiSuccess {Number} devices.thresholds.upper 上限阈值
 * @apiSuccess {String} devices.status 设备状态
 *
 * @apiError (500) {String} message 服务器内部错误
 */
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

/**
 * @api {get} /api/devices/:id 获取单个设备详情
 * @apiName GetDeviceById
 * @apiGroup Device
 * @apiVersion 1.0.0
 *
 * @apiParam {String} id 设备ID
 *
 * @apiSuccess {Object} device 设备信息
 * @apiSuccess {String} device.device_id 设备ID
 * @apiSuccess {Object} device.thresholds 设备阈值
 * @apiSuccess {String} device.status 设备状态
 *
 * @apiError (404) {String} message 设备未找到
 * @apiError (500) {String} message 服务器内部错误
 */
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

/**
 * @api {put} /api/devices/:id/config 更新设备参数
 * @apiName UpdateDeviceConfig
 * @apiGroup Device
 * @apiVersion 1.0.0
 *
 * @apiParam {String} id 设备ID
 * @apiBody {Number} temperature_threshold_low 温度下限阈值
 * @apiBody {Number} temperature_threshold_high 温度上限阈值
 *
 * @apiSuccess {String} message 参数更新成功
 *
 * @apiError (404) {String} message 设备未找到
 * @apiError (500) {String} message 服务器内部错误
 */
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

/**
 * @api {post} /api/devices 创建新设备
 * @apiName CreateDevice
 * @apiGroup Device
 * @apiVersion 1.0.0
 *
 * @apiBody {String} device_id 设备ID
 * @apiBody {Object} thresholds 设备阈值
 * @apiBody {Number} thresholds.lower 下限阈值
 * @apiBody {Number} thresholds.upper 上限阈值
 * @apiBody {String} status 设备状态
 *
 * @apiSuccess {Object} device 新创建的设备信息
 *
 * @apiError (400) {String} message 请求参数错误
 */
export const createDevice = async (req: Request, res: Response): Promise<void> => {
  const newDevice = new Device(req.body);
  try {
    await newDevice.save();
    res.status(201).json(newDevice);
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : String(error) });
  }
};

/**
 * @api {delete} /api/devices/:id 删除设备
 * @apiName DeleteDevice
 * @apiGroup Device
 * @apiVersion 1.0.0
 *
 * @apiParam {String} id 设备ID
 *
 * @apiSuccess {String} message 删除成功消息
 *
 * @apiError (404) {String} message 设备不存在
 * @apiError (500) {String} message 服务器内部错误
 */
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

/**
 * @api {delete} /api/devices/batch 批量删除设备
 * @apiName BatchDeleteDevices
 * @apiGroup Device
 * @apiVersion 1.0.0
 *
 * @apiBody {String[]} ids 设备ID数组
 *
 * @apiSuccess {String} message 删除成功消息
 *
 * @apiError (500) {String} error 删除失败
 */
export const batchDeleteDevices = async (req: Request, res: Response): Promise<void> => {
  const { ids } = req.body;
  try {
    await Device.deleteMany({ device_id: { $in: ids } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: '删除失败' });
  }
};

/**
 * @api {post} /api/devices/:id/firmware 触发固件更新
 * @apiName TriggerFirmwareUpdate
 * @apiGroup Device
 * @apiVersion 1.0.0
 *
 * @apiParam {String} id 设备ID
 * @apiBody {String} version 固件版本
 * @apiBody {String} url 固件下载地址
 *
 * @apiSuccess {String} message 固件更新已触发
 *
 * @apiError (404) {String} message 设备未找到
 * @apiError (500) {String} message 服务器内部错误
 */
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

/**
 * @api {get} /api/devices/:id/sensor-data 获取设备历史传感器数据
 * @apiName GetSensorDataHistory
 * @apiGroup Device
 * @apiVersion 1.0.0
 *
 * @apiParam {String} id 设备ID
 * @apiQuery {String} startTime 开始时间 (ISO格式)
 * @apiQuery {String} endTime 结束时间 (ISO格式)
 *
 * @apiSuccess {Object[]} data 传感器数据列表
 * @apiSuccess {String} data.device_id 设备ID
 * @apiSuccess {Number} data.value 传感器值
 * @apiSuccess {Date} data.timestamp 时间戳
 * @apiSuccess {String} data.status 设备状态
 *
 * @apiError (500) {String} message 服务器内部错误
 */
export const getSensorDataHistory = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { startTime, endTime } = req.query;

  try {
    // 构建查询条件
    const query: any = { device_id: id };
    
    // 添加时间范围条件
    if (startTime && endTime) {
      query.timestamp = {
        $gte: new Date(startTime as string),
        $lte: new Date(endTime as string)
      };
    }

    // 查询传感器数据并按时间倒序排列
    const data = await SensorData.find(query)
      .sort({ timestamp: -1 }) // 最新数据优先
      .limit(100); // 默认限制返回数量（可扩展分页参数）

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
  }
}; 