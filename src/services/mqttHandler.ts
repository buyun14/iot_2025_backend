import mqtt from 'mqtt';
import redisClient from './redisClient';
import Device, { IDevice } from '../models/deviceModel';
import SensorData from '../models/sensorDataModel';
import MqttTopic from '../models/mqttTopicModel';
import { Document } from 'mongoose';

interface MQTTMessage {
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

  constructor() {
    this.client = mqtt.connect(process.env.MQTT_BROKER_URL || 'mqtt://localhost');
    this.setupEventHandlers();
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
      const activeTopics = await MqttTopic.find({ isActive: true });
      for (const topic of activeTopics) {
        await this.subscribeToTopic(topic.topic);
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

  private async handleMessage(_topic: string, message: Buffer) {
    try {
      const data = JSON.parse(message.toString()) as MQTTMessage;

      if (!data.type || !data.id || typeof data.value !== 'number') {
        console.error('无效的消息格式:', data);
        return;
      }

      const deviceId = `${data.type}-${data.id}`;
      const value = data.value;

      console.log(`收到消息: ${JSON.stringify(data)}`);

      let device = await Device.findOne({ device_id: deviceId }) as DeviceDocument;
      if (!device) {
        console.log(`设备未找到: ${deviceId}，正在创建新设备`);
        device = new Device({
          device_id: deviceId,
          thresholds: { lower: 0, upper: 100 },
          status: 'off',
        });
        await device.save();
        console.log(`新设备已创建: ${deviceId}`);
      }

      await redisClient.set(`device:${deviceId}:current_value`, value.toString(), { EX: 3600 });

      this.updateDeviceStatus(device, value);
      await device.save();

      const sensorData = new SensorData({ device_id: deviceId, value });
      await sensorData.save();

      console.log(`设备状态更新完成: ${deviceId}, 当前值: ${value}`);
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
}

export const mqttHandler = new MqttHandler();
export default mqttHandler; 