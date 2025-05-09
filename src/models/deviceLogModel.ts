import mongoose, { Document, Schema } from 'mongoose';
import { DeviceType } from './smartDeviceModel';

// 日志级别枚举
export enum LogLevel {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG'
}

// 日志类型枚举
export enum LogType {
  STATE_CHANGE = 'STATE_CHANGE',
  COMMAND = 'COMMAND',
  ERROR = 'ERROR',
  MAINTENANCE = 'MAINTENANCE',
  SENSOR_DATA = 'SENSOR_DATA'
}

// 设备日志接口
export interface IDeviceLog extends Document {
  deviceId: string;
  deviceType: DeviceType;
  timestamp: Date;
  level: LogLevel;
  type: LogType;
  message: string;
  details?: Record<string, any>;
  sensorData?: {
    temperature?: number;
    humidity?: number;
    power?: number;
    [key: string]: any;
  };
}

// 设备日志模式
const deviceLogSchema = new Schema<IDeviceLog>({
  deviceId: {
    type: String,
    required: true,
    index: true
  },
  deviceType: {
    type: String,
    enum: Object.values(DeviceType),
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  level: {
    type: String,
    enum: Object.values(LogLevel),
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: Object.values(LogType),
    required: true,
    index: true
  },
  message: {
    type: String,
    required: true
  },
  details: {
    type: Schema.Types.Mixed
  },
  sensorData: {
    temperature: Number,
    humidity: Number,
    power: Number
  }
});

// 添加复合索引
deviceLogSchema.index({ deviceId: 1, timestamp: -1 });
deviceLogSchema.index({ deviceType: 1, type: 1, timestamp: -1 });
deviceLogSchema.index({ level: 1, timestamp: -1 });

// 创建模型
export const DeviceLog = mongoose.model<IDeviceLog>('DeviceLog', deviceLogSchema); 