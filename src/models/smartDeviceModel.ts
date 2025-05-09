import mongoose, { Document, Schema } from 'mongoose';

// 设备类型枚举
export enum DeviceType {
  LIGHT = 'LIGHT',
  THERMOSTAT = 'THERMOSTAT',
  DOOR_LOCK = 'DOOR_LOCK',
  BLIND = 'BLIND',
  AIR_CONDITIONER = 'AIR_CONDITIONER',
  SMOKE_DETECTOR = 'SMOKE_DETECTOR',
  FAN = 'FAN',
  PLUG = 'PLUG'
}

// 基础设备状态接口
export interface BaseDeviceState {
  online: boolean;
  lastUpdate: Date;
  errorState: string | null;
}

// 智能灯状态
export interface LightState extends BaseDeviceState {
  state: 'on' | 'off';
  brightness: number; // 0-100
  color_temp: number; // 2700-6500K
  power_consumption: number;
}

// 温控器状态
export interface ThermostatState extends BaseDeviceState {
  current_temp: number;
  target_temp: number;
  humidity: number;
  mode: 'auto' | 'heat' | 'cool';
  fan_speed: 'auto' | 'low' | 'medium' | 'high';
  power_consumption: number;
}

// 智能门锁状态
export interface DoorLockState extends BaseDeviceState {
  locked: boolean;
  battery_level: number;
  last_lock_time: Date;
  last_unlock_time: Date;
}

// 智能窗帘状态
export interface BlindState extends BaseDeviceState {
  position: number; // 0-100
  tilt: number; // 0-180
  moving: boolean;
  last_move_time: Date;
}

// 空调状态
export interface AirConditionerState extends BaseDeviceState {
  on: boolean;
  temp: number;
  mode: 'cool' | 'heat' | 'dry' | 'fan';
  fan_speed: 'auto' | 'low' | 'medium' | 'high';
  swing: boolean;
  power_consumption: number;
}

// 烟雾报警器状态
export interface SmokeDetectorState extends BaseDeviceState {
  alarm: boolean;
  battery_level: number;
  smoke_level: number; // 0-100
  last_test_time: Date;
}

// 风扇状态
export interface FanState extends BaseDeviceState {
  on: boolean;
  speed: number; // 1-3
  oscillate: boolean;
  timer: number; // 0-120 minutes
  power_consumption: number;
}

// 智能插座状态
export interface PlugState extends BaseDeviceState {
  on: boolean;
  power_consumption: number;
  voltage: number;
  current: number;
  power_factor: number;
  timer: number; // 0-120 minutes
}

// 设备状态联合类型
export type DeviceState =
  | LightState
  | ThermostatState
  | DoorLockState
  | BlindState
  | AirConditionerState
  | SmokeDetectorState
  | FanState
  | PlugState;

// 设备命令接口
export interface DeviceCommand {
  command: string;
  params?: Record<string, any>;
  timestamp?: Date;
}

// 智能设备接口
export interface ISmartDevice extends Document {
  deviceId: string;
  type: DeviceType;
  name: string;
  description?: string;
  location?: string;
  state: DeviceState;
  createdAt: Date;
  updatedAt: Date;
}

// 智能设备Schema
const smartDeviceSchema = new Schema<ISmartDevice>({
  deviceId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  type: {
    type: String,
    enum: Object.values(DeviceType),
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  location: {
    type: String
  },
  state: {
    type: Schema.Types.Mixed,
    required: true,
    default: {
      online: true,
      lastUpdate: new Date(),
      errorState: null
    }
  }
}, {
  timestamps: true
});

// 添加索引
smartDeviceSchema.index({ type: 1 });
smartDeviceSchema.index({ location: 1 });

// 添加验证方法
smartDeviceSchema.pre('save', function(next) {
  if (this.isModified('state')) {
    this.state.lastUpdate = new Date();
  }
  next();
});

// 创建模型
export const SmartDevice = mongoose.model<ISmartDevice>('SmartDevice', smartDeviceSchema); 