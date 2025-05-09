import { Request, Response } from 'express';
import { SmartDeviceManager } from '../services/smartDeviceManager';
import { DeviceType, DeviceCommand } from '../models/smartDeviceModel';

export class SmartDeviceController {
  private deviceManager: SmartDeviceManager;

  constructor(deviceManager: SmartDeviceManager) {
    this.deviceManager = deviceManager;
  }

  // 获取所有设备
  async getDevices(_req: Request, res: Response): Promise<void> {
    try {
      const devices = await this.deviceManager.getDevices();
      res.json(devices);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get devices' });
    }
  }

  // 获取单个设备
  async getDevice(req: Request, res: Response): Promise<void> {
    try {
      const { deviceId } = req.params;
      const device = await this.deviceManager.getDevice(deviceId);
      
      if (!device) {
        res.status(404).json({ error: 'Device not found' });
        return;
      }
      
      res.json(device);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get device' });
    }
  }

  // 创建设备
  async createDevice(req: Request, res: Response): Promise<void> {
    try {
      const { deviceId, type, name, description, location } = req.body;

      // 验证设备类型
      if (!Object.values(DeviceType).includes(type)) {
        res.status(400).json({ error: 'Invalid device type' });
        return;
      }

      const device = await this.deviceManager.createDevice({
        deviceId,
        type,
        name,
        description,
        location
      });

      res.status(201).json(device);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create device' });
    }
  }

  // 删除设备
  async deleteDevice(req: Request, res: Response): Promise<void> {
    try {
      const { deviceId } = req.params;
      await this.deviceManager.deleteDevice(deviceId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete device' });
    }
  }

  // 发送设备命令
  async sendCommand(req: Request, res: Response): Promise<void> {
    try {
      const { deviceId } = req.params;
      const command: DeviceCommand = req.body;

      await this.deviceManager.sendDeviceCommand(deviceId, command);
      res.json({ message: 'Command sent successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to send command' });
    }
  }

  // 获取设备状态
  async getDeviceState(req: Request, res: Response): Promise<void> {
    try {
      const { deviceId } = req.params;
      const device = await this.deviceManager.getDevice(deviceId);
      
      if (!device) {
        res.status(404).json({ error: 'Device not found' });
        return;
      }
      
      res.json(device.state);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get device state' });
    }
  }
} 