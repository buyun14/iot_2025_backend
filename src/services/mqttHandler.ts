import mqtt from 'mqtt';
import redisClient from './redisClient';
import Device, { IDevice } from '../models/deviceModel';
import SensorData from '../models/sensorDataModel';
import { Document } from 'mongoose';

interface MQTTMessage {
  type: string;
  id: string;
  value: number;
}

type DeviceDocument = Document & IDevice;

// 打印 MQTT_BROKER_URL
console.log('MQTT_BROKER_URL:', process.env.MQTT_BROKER_URL);

// 创建 MQTT 客户端
const mqttClient = mqtt.connect(process.env.MQTT_BROKER_URL || 'mqtt://localhost');

mqttClient.on('connect', () => {
  console.log('MQTT 连接成功');
  mqttClient.subscribe('AIOTSIM2APP', (err) => {
    if (err) {
      console.error('订阅失败:', err);
    } else {
      console.log('已订阅主题: AIOTSIM2APP');
    }
  });
});

mqttClient.on('error', (err) => {
  console.error('MQTT 客户端错误:', err);
});

mqttClient.on('close', () => {
  console.log('MQTT 客户端已关闭');
});

mqttClient.on('message', async (_topic: string, message: Buffer) => {
  try {
    const data = JSON.parse(message.toString()) as MQTTMessage;

    // 数据验证
    if (!data.type || !data.id || typeof data.value !== 'number') {
      console.error('无效的消息格式:', data);
      return;
    }

    const deviceId = `${data.type}-${data.id}`;
    const value = data.value;

    console.log(`收到消息: ${JSON.stringify(data)}`);

    // 查找设备，如果未找到则动态创建
    let device = await Device.findOne({ device_id: deviceId }) as DeviceDocument;
    if (!device) {
      console.log(`设备未找到: ${deviceId}，正在创建新设备`);
      device = new Device({
        device_id: deviceId,
        thresholds: { lower: 0, upper: 100 }, // 默认阈值
        status: 'off', // 默认状态
      });
      await device.save();
      console.log(`新设备已创建: ${deviceId}`);
    }

    // 更新 Redis 缓存
    await redisClient.set(`device:${deviceId}:current_value`, value.toString(), { EX: 3600 });

    // 更新设备状态
    updateDeviceStatus(device, value);
    await device.save();

    // 保存历史数据
    const sensorData = new SensorData({ device_id: deviceId, value });
    await sensorData.save();

    console.log(`设备状态更新完成: ${deviceId}, 当前值: ${value}`);
  } catch (error) {
    console.error('MQTT 数据处理失败:', error);
  }
});

// 状态更新函数
function updateDeviceStatus(device: DeviceDocument, value: number): DeviceDocument {
  const STATUS = { ON: 'on', OFF: 'off' } as const;
  if (value <= device.thresholds.lower) {
    device.status = STATUS.ON;
  } else if (value >= device.thresholds.upper) {
    device.status = STATUS.OFF;
  }
  return device;
}

export default mqttClient; 