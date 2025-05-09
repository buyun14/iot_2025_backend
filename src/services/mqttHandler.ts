import mqtt from 'mqtt';
import redisClient from './redisClient';
import Device, { IDevice } from '../models/deviceModel';
import SensorData from '../models/sensorDataModel';
import MqttTopic from '../models/mqttTopicModel';
import { Document } from 'mongoose';
import { SmartDeviceManager } from './smartDeviceManager';

// 基础传感器消息格式
interface BaseSensorMessage {
  type: string;
  id: string;
  value: number;
}

type DeviceDocument = Document & IDevice;

// 打印 MQTT_BROKER_URL
console.log('MQTT_BROKER_URL:', process.env.MQTT_BROKER_URL);

class MqttHandler {
  private client: mqtt.MqttClient;
  private subscribedTopics: Set<string> = new Set();
  private smartDeviceManager: SmartDeviceManager | null = null;

  constructor() {
    this.client = mqtt.connect(process.env.MQTT_BROKER_URL || 'mqtt://localhost');
    this.setupEventHandlers();
  }

  public setSmartDeviceManager(manager: SmartDeviceManager) {
    this.smartDeviceManager = manager;
  }

  private setupEventHandlers() {
    this.client.on('connect', async () => {
      console.log('MQTT 连接成功');
      await this.subscribeToActiveTopics();
    });

    this.client.on('error', (err) => {
      console.error('MQTT 客户端错误:', err);
    });

    this.client.on('close', () => {
      console.log('MQTT 客户端已关闭');
    });

    this.client.on('message', this.handleMessage.bind(this));
  }

  private async subscribeToActiveTopics() {
    try {
      // 订阅传感器主题
      const activeTopics = await MqttTopic.find({ isActive: true });
      for (const topic of activeTopics) {
        await this.subscribeToTopic(topic.topic);
      }

      // 订阅智能设备主题
      if (process.env.DEVICE_PREFIX) {
        await this.subscribeToTopic(`${process.env.DEVICE_PREFIX}/status/#`);
      }
    } catch (error) {
      console.error('订阅主题失败:', error);
    }
  }

  public async subscribeToTopic(topic: string): Promise<void> {
    if (this.subscribedTopics.has(topic)) {
      return;
    }

    return new Promise((resolve, reject) => {
      this.client.subscribe(topic, (err) => {
        if (err) {
          console.error(`订阅主题 ${topic} 失败:`, err);
          reject(err);
        } else {
          console.log(`已订阅主题: ${topic}`);
          this.subscribedTopics.add(topic);
          resolve();
        }
      });
    });
  }

  public async unsubscribeFromTopic(topic: string): Promise<void> {
    if (!this.subscribedTopics.has(topic)) {
      return;
    }

    return new Promise((resolve, reject) => {
      this.client.unsubscribe(topic, (err) => {
        if (err) {
          console.error(`取消订阅主题 ${topic} 失败:`, err);
          reject(err);
        } else {
          console.log(`已取消订阅主题: ${topic}`);
          this.subscribedTopics.delete(topic);
          resolve();
        }
      });
    });
  }

  private async handleMessage(topic: string, message: Buffer) {
    try {
      // 检查是否是智能设备消息
      const devicePrefix = process.env.DEVICE_PREFIX;
      if (devicePrefix && topic.startsWith(`${devicePrefix}/`)) {
        if (this.smartDeviceManager) {
          console.log(`处理智能设备消息: ${topic}`);
          console.log(`消息内容: ${message.toString()}`);
          await this.smartDeviceManager.handleDeviceMessage(topic, message);
        } else {
          console.warn('SmartDeviceManager not initialized');
        }
        return;  // 智能设备消息处理完毕，直接返回
      }

      // 尝试解析为基础传感器消息
      try {
        const data = JSON.parse(message.toString()) as BaseSensorMessage;
        // 检查是否符合基础传感器消息格式
        if (!data.type || !data.id || typeof data.value !== 'number') {
          console.log('不是基础传感器消息格式，忽略处理');
          return;
        }

        const deviceId = `${data.type}-${data.id}`;
        const value = data.value;

        console.log(`收到基础传感器消息: ${JSON.stringify(data)}`);

        let device = await Device.findOne({ device_id: deviceId }) as DeviceDocument;
        if (!device) {
          console.log(`基础传感器未找到: ${deviceId}，正在创建新传感器`);
          device = new Device({
            device_id: deviceId,
            thresholds: { lower: 0, upper: 100 },
            status: 'off',
          });
          await device.save();
          console.log(`新基础传感器已创建: ${deviceId}`);
        }

        await redisClient.set(`device:${deviceId}:current_value`, value.toString(), { EX: 3600 });

        this.updateDeviceStatus(device, value);
        await device.save();

        const sensorData = new SensorData({ device_id: deviceId, value });
        await sensorData.save();

        console.log(`基础传感器状态更新完成: ${deviceId}, 当前值: ${value}`);
      } catch (parseError) {
        console.log('消息格式无法解析，忽略处理');
        return;
      }
    } catch (error) {
      console.error('MQTT 数据处理失败:', error);
    }
  }

  private updateDeviceStatus(device: DeviceDocument, value: number): DeviceDocument {
    const STATUS = { ON: 'on', OFF: 'off' } as const;
    if (value <= device.thresholds.lower) {
      device.status = STATUS.ON;
    } else if (value >= device.thresholds.upper) {
      device.status = STATUS.OFF;
    }
    return device;
  }

  public async publishMessage(topic: string, message: any): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.publish(topic, JSON.stringify(message), (err) => {
        if (err) {
          console.error(`发布消息到主题 ${topic} 失败:`, err);
          reject(err);
        } else {
          console.log(`消息已发布到主题: ${topic}`);
          resolve();
        }
      });
    });
  }

  public getMqttClient(): mqtt.MqttClient {
    return this.client;
  }
}

// 创建单例实例
const mqttHandler = new MqttHandler();
export { mqttHandler, MqttHandler };
export default mqttHandler;