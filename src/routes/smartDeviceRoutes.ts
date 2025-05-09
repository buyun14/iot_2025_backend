import { Router } from 'express';
import { SmartDeviceController } from '../controllers/smartDeviceController';
import { SmartDeviceManager } from '../services/smartDeviceManager';
import { MqttClient } from 'mqtt';

export default function createSmartDeviceRoutes(mqttClient: MqttClient, devicePrefix: string) {
  const router = Router();
  const deviceManager = new SmartDeviceManager(mqttClient, devicePrefix);
  const deviceController = new SmartDeviceController(deviceManager);

  // 获取所有设备
  router.get('/devices', (req, res) => deviceController.getDevices(req, res));

  // 获取单个设备
  router.get('/devices/:deviceId', (req, res) => deviceController.getDevice(req, res));

  // 创建设备
  router.post('/devices', (req, res) => deviceController.createDevice(req, res));

  // 删除设备
  router.delete('/devices/:deviceId', (req, res) => deviceController.deleteDevice(req, res));

  // 发送设备命令
  router.post('/devices/:deviceId/command', (req, res) => deviceController.sendCommand(req, res));

  // 获取设备状态
  router.get('/devices/:deviceId/state', (req, res) => deviceController.getDeviceState(req, res));

  return router;
} 