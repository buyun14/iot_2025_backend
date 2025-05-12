import { SmartDevice, DeviceType, DeviceState, DeviceCommand, ISmartDevice, ThermostatState } from '../models/smartDeviceModel';
import { SmartDeviceSensorData } from '../models/smartDeviceSensorData';
import { MqttClient } from 'mqtt';
import { EventEmitter } from 'events';
import { FilterQuery } from 'mongoose';
import { DeviceStateProcessorFactory } from './deviceStateProcessor';
import { DeviceCommandProcessorFactory } from './deviceCommandProcessor';
import { DeviceStateValidatorFactory } from './deviceStateValidator';
import { DeviceStateHistory } from '../models/deviceStateHistoryModel';
import { DeviceLog, LogLevel, LogType } from '../models/deviceLogModel';

// 设备类型映射（模拟器类型 -> 后端类型）
const DEVICE_TYPE_MAP: { [key: string]: DeviceType } = {
  'light': DeviceType.LIGHT,
  'thermostat': DeviceType.THERMOSTAT,
  'doorlock': DeviceType.DOOR_LOCK,
  'blind': DeviceType.BLIND,
  'ac': DeviceType.AIR_CONDITIONER,
  'airconditioner': DeviceType.AIR_CONDITIONER,//同ac
  'smoke_detector': DeviceType.SMOKE_DETECTOR,
  'smokedetector': DeviceType.SMOKE_DETECTOR,//同smoke_detector
  'fan': DeviceType.FAN,
  'plug': DeviceType.PLUG
};

export class SmartDeviceManager extends EventEmitter {
  private mqttClient: MqttClient;
  private devicePrefix: string;

  constructor(mqttClient: MqttClient, devicePrefix: string) {
    super();
    this.mqttClient = mqttClient;
    this.devicePrefix = devicePrefix;
    this.setupMqttHandlers();
  }

  private setupMqttHandlers() {
    // 订阅设备状态主题
    this.mqttClient.subscribe(`${this.devicePrefix}/status/#`);
    
    // 处理接收到的消息
    this.mqttClient.on('message', async (topic: string, message: Buffer) => {
      await this.handleDeviceMessage(topic, message);
    });
  }

  async handleDeviceMessage(topic: string, message: Buffer): Promise<void> {
    let deviceId: string | undefined;
    try {
      // 解析主题格式：{device_prefix}/status/{device_id}
      const parts = topic.split('/');
      if (parts.length < 3 || parts[parts.length - 2] !== 'status') {
        throw new Error(`Invalid topic format: ${topic}`);
      }

      // 从消息内容中获取设备类型和ID
      const rawState = JSON.parse(message.toString());
      const deviceType = DEVICE_TYPE_MAP[rawState.type.toLowerCase()];
      if (!deviceType) {
        throw new Error(`Invalid device type: ${rawState.type}`);
      }

      // 构造设备ID：{type}-{id}
      deviceId = `${rawState.type}-${parts[parts.length - 1]}`;
      console.log(`Processing device message for: ${deviceId}`);

      // 获取或创建设备
      let device = await this.getDevice(deviceId);
      if (!device) {
        try {
          console.log(`Device not found: ${deviceId}, creating new device`);
          device = await SmartDevice.findOneAndUpdate(
            { deviceId },
            {
              deviceId,
              type: deviceType,
              name: `${rawState.type}-${parts[parts.length - 1]}`,
              description: `Auto-created ${rawState.type} device`,
              state: {
                online: true,
                lastUpdate: new Date(),
                errorState: null
              }
            },
            { upsert: true, new: true }
          );
        } catch (error) {
          console.error('Error creating device:', error);
          throw error;
        }
      }
      
      // 处理设备状态
      const processor = DeviceStateProcessorFactory.getProcessor(deviceType);
      const newState = processor.processState(rawState);

      // 验证设备状态
      const validationErrors = DeviceStateValidatorFactory.getValidationErrors(deviceType, newState);
      if (validationErrors.length > 0) {
        throw new Error(`Invalid device state: ${validationErrors.map(e => e.message).join(', ')}`);
      }

      // 更新设备状态
      await this.updateDeviceState(deviceId, newState);

      // 记录状态历史
      await this.recordStateHistory(deviceId, deviceType, newState);

      // 记录传感器数据
      await this.recordSensorData(deviceId, deviceType, rawState);

      // 发送状态更新确认
      this.emit('deviceStateUpdated', deviceId, newState);

    } catch (error) {
      console.error('Error handling device message:', error);
      if (deviceId) {
        await this.updateDeviceErrorState(deviceId, error instanceof Error ? error.message : 'Unknown error');
      }
    }
  }

  // 更新设备状态
  async updateDeviceState(deviceId: string, newState: DeviceState): Promise<void> {
    try {
      const device = await SmartDevice.findOne({ deviceId });
      if (!device) {
        throw new Error(`Device not found: ${deviceId}`);
      }

      // 验证设备状态
      const validationErrors = DeviceStateValidatorFactory.getValidationErrors(device.type, newState);
      if (validationErrors.length > 0) {
        throw new Error(`Invalid device state: ${validationErrors.join(', ')}`);
      }

      device.state = newState;
      device.state.lastUpdate = new Date();
      await device.save();
      this.emit('deviceStateUpdated', deviceId, device.state);
    } catch (error) {
      console.error('Error updating device state:', error);
      throw error;
    }
  }

  // 发送设备命令
  async sendDeviceCommand(deviceId: string, command: DeviceCommand): Promise<void> {
    try {
      const device = await SmartDevice.findOne({ deviceId });
      if (!device) {
        throw new Error('Device not found');
      }

      // 使用命令处理器验证命令
      const processor = DeviceCommandProcessorFactory.getProcessor(device.type);
      if (!processor.validateCommand(command)) {
        throw new Error('Invalid command format');
      }

      // 从设备ID中提取MQTT主题ID部分
      const mqttId = deviceId.split('-')[1];
      if (!mqttId) {
        throw new Error(`Invalid device ID format: ${deviceId}`);
      }

      // 发送到正确的控制主题
      const topic = `${this.devicePrefix}/control/${mqttId}`;
      this.mqttClient.publish(topic, JSON.stringify(command));
      this.emit('deviceCommandSent', deviceId, command);
    } catch (error) {
      console.error('Error sending device command:', error);
      throw error;
    }
  }

  // 创建设备
  async createDevice(deviceData: {
    deviceId: string;
    type: DeviceType;
    name: string;
    description?: string;
    location?: string;
  }): Promise<ISmartDevice> {
    try {
      // 验证设备类型是否支持
      DeviceStateProcessorFactory.getProcessor(deviceData.type);
      DeviceCommandProcessorFactory.getProcessor(deviceData.type);

      const device = new SmartDevice({
        ...deviceData,
        state: {
          online: true,
          lastUpdate: new Date(),
          errorState: null
        } as DeviceState
      });

      await device.save();
      this.emit('deviceCreated', device);
      return device;
    } catch (error) {
      console.error('Error creating device:', error);
      throw error;
    }
  }

  // 删除设备
  async deleteDevice(deviceId: string): Promise<void> {
    try {
      const device = await SmartDevice.findOne({ deviceId });
      if (!device) {
        throw new Error('Device not found');
      }

      await device.deleteOne();
      this.emit('deviceDeleted', deviceId);
    } catch (error) {
      console.error('Error deleting device:', error);
      throw error;
    }
  }

  // 获取设备列表
  async getDevices(filter: FilterQuery<ISmartDevice> = {}): Promise<ISmartDevice[]> {
    try {
      return await SmartDevice.find(filter);
    } catch (error) {
      console.error('Error getting devices:', error);
      throw error;
    }
  }

  // 获取单个设备
  async getDevice(deviceId: string): Promise<ISmartDevice | null> {
    try {
      return await SmartDevice.findOne({ deviceId });
    } catch (error) {
      console.error('Error getting device:', error);
      throw error;
    }
  }

  async updateDeviceErrorState(deviceId: string, errorMessage: string): Promise<void> {
    try {
      const device = await SmartDevice.findOne({ deviceId });
      if (!device) {
        throw new Error(`Device not found: ${deviceId}`);
      }

      const errorState: DeviceState = {
        ...device.state,
        online: false,
        errorState: errorMessage,
        lastUpdate: new Date()
      };

      await this.updateDeviceState(deviceId, errorState);
    } catch (error) {
      console.error('Error updating device error state:', error);
    }
  }

  // 记录设备日志
  private async logDeviceEvent(
    deviceId: string,
    deviceType: DeviceType,
    level: LogLevel,
    type: LogType,
    message: string,
    details?: Record<string, any>,
    sensorData?: Record<string, any>
  ): Promise<void> {
    try {
      await DeviceLog.create({
        deviceId,
        deviceType,
        level,
        type,
        message,
        details,
        sensorData,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error logging device event:', error);
    }
  }

  async recordStateHistory(deviceId: string, type: DeviceType, state: DeviceState): Promise<void> {
    try {
      // 添加状态变化原因和详细信息
      let reason = '状态更新';
      let details = {};
      
      if (state.errorState) {
        reason = `错误状态: ${state.errorState}`;
      } else if (!state.online) {
        reason = '设备离线';
      }

      // 对于温控器，添加更详细的状态变化记录
      if (type === DeviceType.THERMOSTAT) {
        const thermostatState = state as ThermostatState;
        const prevState = await DeviceStateHistory.findOne({ 
          deviceId, 
          type 
        }).sort({ timestamp: -1 });

        if (prevState) {
          const prevThermostatState = prevState.state as ThermostatState;
          
          // 记录温度变化
          if (prevThermostatState.current_temp !== thermostatState.current_temp) {
            details = {
              ...details,
              temp_change: {
                from: prevThermostatState.current_temp,
                to: thermostatState.current_temp,
                diff: thermostatState.current_temp - prevThermostatState.current_temp
              }
            };
            reason = '温度变化';
          }

          // 记录模式变化
          if (prevThermostatState.mode !== thermostatState.mode) {
            details = {
              ...details,
              mode_change: {
                from: prevThermostatState.mode,
                to: thermostatState.mode
              }
            };
            reason = '模式变化';
          }

          // 记录风速变化
          if (prevThermostatState.fan_speed !== thermostatState.fan_speed) {
            details = {
              ...details,
              fan_speed_change: {
                from: prevThermostatState.fan_speed,
                to: thermostatState.fan_speed
              }
            };
            reason = '风速变化';
          }
        }
      }

      // 创建状态历史记录
      await DeviceStateHistory.create({
        deviceId,
        type,
        state,
        timestamp: new Date(),
        reason,
        details
      });

      // 对于温控器，记录详细的传感器数据和日志
      if (type === DeviceType.THERMOSTAT) {
        const thermostatState = state as ThermostatState;
        
        // 计算运行时间和能效
        const runtime = await this.calculateDeviceRuntime(deviceId);
        const efficiency = await this.calculateEnergyEfficiency(thermostatState);
        
        // 记录传感器数据
        await SmartDeviceSensorData.create({
          device_id: deviceId,
          device_type: type,
          timestamp: new Date(),
          current_temp: thermostatState.current_temp,
          target_temp: thermostatState.target_temp,
          humidity: thermostatState.humidity,
          mode: thermostatState.mode,
          fan_speed: thermostatState.fan_speed,
          power_consumption: thermostatState.power_consumption || 0,
          runtime_minutes: runtime,
          energy_efficiency: efficiency,
          heating_power: thermostatState.mode === 'heat' ? thermostatState.power_consumption : 0,
          cooling_power: thermostatState.mode === 'cool' ? thermostatState.power_consumption : 0
        });

        // 记录设备日志
        await this.logDeviceEvent(
          deviceId,
          type,
          LogLevel.INFO,
          LogType.SENSOR_DATA,
          `温控器状态更新：温度=${thermostatState.current_temp}°C, 湿度=${thermostatState.humidity}%`,
          details,
          {
            temperature: thermostatState.current_temp,
            humidity: thermostatState.humidity,
            target_temp: thermostatState.target_temp,
            mode: thermostatState.mode,
            fan_speed: thermostatState.fan_speed,
            power: thermostatState.power_consumption,
            efficiency,
            runtime
          }
        );

        // 检查异常情况
        if (Math.abs(thermostatState.current_temp - thermostatState.target_temp) > 5) {
          await this.logDeviceEvent(
            deviceId,
            type,
            LogLevel.WARNING,
            LogType.STATE_CHANGE,
            `温度偏差过大：当前=${thermostatState.current_temp}°C, 目标=${thermostatState.target_temp}°C`,
            { temp_diff: thermostatState.current_temp - thermostatState.target_temp }
          );
        }

        if (thermostatState.power_consumption > 2000) { // 假设 2000W 为功率阈值
          await this.logDeviceEvent(
            deviceId,
            type,
            LogLevel.WARNING,
            LogType.STATE_CHANGE,
            `功率消耗过高：${thermostatState.power_consumption}W`,
            { power_consumption: thermostatState.power_consumption }
          );
        }
      }
    } catch (error) {
      console.error('Error recording state history:', error);
      // 记录错误日志
      await this.logDeviceEvent(
        deviceId,
        type,
        LogLevel.ERROR,
        LogType.ERROR,
        `记录状态历史失败：${error instanceof Error ? error.message : '未知错误'}`,
        { error: error instanceof Error ? error.message : '未知错误' }
      );
      throw error;
    }
  }

  // 计算设备运行时间（分钟）
  private async calculateDeviceRuntime(deviceId: string): Promise<number> {
    try {
      const lastRecord = await SmartDeviceSensorData.findOne({
        device_id: deviceId,
        runtime_minutes: { $exists: true }
      }).sort({ timestamp: -1 });

      if (!lastRecord || typeof lastRecord.runtime_minutes === 'undefined') return 0;
      
      const timeDiff = Date.now() - lastRecord.timestamp.getTime();
      return lastRecord.runtime_minutes + Math.floor(timeDiff / (1000 * 60));
    } catch (error) {
      console.error('Error calculating device runtime:', error);
      return 0;
    }
  }

  // 计算能效比
  private async calculateEnergyEfficiency(state: ThermostatState): Promise<number> {
    try {
      if (!state.power_consumption || state.power_consumption === 0) return 0;
      
      const tempDiff = Math.abs(state.current_temp - state.target_temp);
      if (tempDiff === 0) return 0;
      
      // 能效比 = 温度变化 / 功率消耗
      return tempDiff / state.power_consumption;
    } catch (error) {
      console.error('Error calculating energy efficiency:', error);
      return 0;
    }
  }

  // 记录传感器数据
  private async recordSensorData(deviceId: string, deviceType: DeviceType, rawState: any): Promise<void> {
    try {
      const sensorData: any = {
        device_id: deviceId,
        device_type: deviceType,
        timestamp: new Date()
      };

      // 提取通用字段
      if ('power_consumption' in rawState) {
        sensorData.power_consumption = Number(rawState.power_consumption);
      }
      if ('battery_level' in rawState) {
        sensorData.battery_level = Number(rawState.battery_level);
      }

      // 根据设备类型提取特定字段
      switch (deviceType) {
        case DeviceType.LIGHT:
          sensorData.brightness = Number(rawState.brightness);
          sensorData.color_temp = Number(rawState.color_temp);
          break;

        case DeviceType.THERMOSTAT:
          sensorData.current_temp = Number(rawState.current_temp);
          sensorData.target_temp = Number(rawState.target_temp);
          sensorData.humidity = Number(rawState.humidity);
          sensorData.mode = rawState.mode;
          sensorData.fan_speed = rawState.fan_speed;
          break;

        case DeviceType.DOOR_LOCK:
          sensorData.locked = Boolean(rawState.locked);
          sensorData.battery_level = Number(rawState.battery_level);
          if (rawState.last_lock_time) {
            sensorData.last_lock_time = new Date(rawState.last_lock_time);
          }
          if (rawState.last_unlock_time) {
            sensorData.last_unlock_time = new Date(rawState.last_unlock_time);
          }
          break;

        case DeviceType.BLIND:
          sensorData.position = Number(rawState.position);
          sensorData.tilt = Number(rawState.tilt);
          sensorData.moving = Boolean(rawState.moving);
          if (rawState.last_move_time) {
            sensorData.last_move_time = new Date(rawState.last_move_time);
          }
          break;

        case DeviceType.AIR_CONDITIONER:
          sensorData.ac_on = Boolean(rawState.on);
          sensorData.ac_temp = Number(rawState.temp);
          sensorData.ac_mode = rawState.mode;
          sensorData.ac_fan_speed = rawState.fan_speed;
          sensorData.ac_swing = Boolean(rawState.swing);
          sensorData.power_consumption = Number(rawState.power_consumption);
          break;

        case DeviceType.SMOKE_DETECTOR:
          sensorData.alarm = Boolean(rawState.alarm);
          sensorData.battery_level = Number(rawState.battery_level);
          sensorData.smoke_level = Number(rawState.smoke_level);
          if (rawState.last_test_time) {
            sensorData.last_test_time = new Date(rawState.last_test_time);
          }
          break;

        case DeviceType.FAN:
          sensorData.fan_on = Boolean(rawState.on);
          sensorData.speed = Number(rawState.speed);
          sensorData.oscillate = Boolean(rawState.oscillate);
          sensorData.timer = Number(rawState.timer);
          sensorData.power_consumption = Number(rawState.power_consumption);
          break;

        case DeviceType.PLUG:
          sensorData.plug_on = Boolean(rawState.on);
          sensorData.power_consumption = Number(rawState.power_consumption);
          sensorData.voltage = Number(rawState.voltage);
          sensorData.current = Number(rawState.current);
          sensorData.power_factor = Number(rawState.power_factor);
          sensorData.plug_timer = Number(rawState.timer);
          break;
      }

      console.log(`Recording sensor data for ${deviceId}:`, sensorData);
      await SmartDeviceSensorData.create(sensorData);
    } catch (error) {
      console.error('Error recording sensor data:', error);
    }
  }
} 