import express from 'express';
import * as deviceController from '../controllers/deviceController';

const router = express.Router();

// 获取设备列表
router.get('/devices', deviceController.getDevices);

// 获取单个设备详情
router.get('/devices/:id', deviceController.getDeviceById);

// 更新设备参数
router.post('/devices/:id/config', deviceController.updateDeviceConfig);

// 触发固件更新
router.post('/devices/:id/firmware', deviceController.triggerFirmwareUpdate);

// 创建新设备
router.post('/devices', deviceController.createDevice);

// 删除设备
router.delete('/devices/:id', deviceController.deleteDevice);

// 批量删除设备
router.delete('/devices', deviceController.batchDeleteDevices);

// 获取设备历史数据
router.get('/devices/:id/history', deviceController.getSensorDataHistory);

export default router; 