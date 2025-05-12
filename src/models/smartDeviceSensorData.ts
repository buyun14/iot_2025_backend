import mongoose, { Document, Schema } from 'mongoose';
import { DeviceType } from './smartDeviceModel';

// 基础接口 - 所有设备共有的字段
export interface IBaseDeviceSensorData extends Document {
  device_id: string;
  device_type: DeviceType;
  timestamp: Date;
}

// 设备特定字段接口
export interface IDeviceSpecificFields {
  // 智能灯字段
  brightness?: number;        // 亮度 (0-100%)
  color_temp?: number;        // 色温 (2700K-6500K)
  
  // 温控器字段
  current_temp?: number;      // 当前温度 (°C)
  target_temp?: number;       // 目标温度 (16-30°C)
  humidity?: number;          // 湿度 (%)
  mode?: string;             // 运行模式 (auto/heat/cool)
  fan_speed?: string;        // 风速 (auto/low/medium/high)
  heating_power?: number;     // 加热功率 (W)
  cooling_power?: number;     // 制冷功率 (W)
  runtime_minutes?: number;   // 运行时间 (分钟)
  energy_efficiency?: number; // 能效比
  
  // 门锁字段
  locked?: boolean;          // 锁定状态
  battery_level?: number;    // 电池电量 (%)
  last_lock_time?: Date;     // 最后上锁时间
  last_unlock_time?: Date;   // 最后解锁时间
  
  // 窗帘字段
  position?: number;         // 位置 (0-100%)
  tilt?: number;            // 倾斜角度 (0-180°)
  moving?: boolean;         // 移动状态
  last_move_time?: Date;    // 最后移动时间
  
  // 空调字段
  ac_on?: boolean;          // 开关状态
  ac_temp?: number;         // 设定温度 (16-30°C)
  ac_mode?: string;         // 运行模式 (cool/heat/dry/fan)
  ac_fan_speed?: string;    // 风速 (auto/low/medium/high)
  ac_swing?: boolean;       // 摆风状态
  
  // 烟雾报警器字段
  alarm?: boolean;          // 报警状态
  smoke_level?: number;     // 烟雾浓度 (0-100)
  last_test_time?: Date;    // 最后测试时间
  
  // 风扇字段
  fan_on?: boolean;         // 开关状态
  speed?: number;           // 风速档位 (1-3)
  oscillate?: boolean;      // 摆头状态
  timer?: number;           // 定时时间 (分钟)
  
  // 智能插座字段
  plug_on?: boolean;        // 开关状态
  voltage?: number;         // 电压 (V)
  current?: number;         // 电流 (A)
  power_factor?: number;    // 功率因数 (0.8-1)
  plug_timer?: number;      // 定时时间 (分钟)
  
  // 通用字段
  power_consumption?: number; // 功率消耗 (W)
}

// 完整的设备传感器数据接口
export interface ISmartDeviceSensorData extends IBaseDeviceSensorData, IDeviceSpecificFields {}

// 智能设备传感器数据Schema
const smartDeviceSensorDataSchema = new Schema<ISmartDeviceSensorData>({
  device_id: {
    type: String,
    required: true,
    index: true
  },
  device_type: {
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
  
  // 智能灯字段
  brightness: {
    type: Number,
    min: 0,
    max: 100,
    sparse: true
  },
  color_temp: {
    type: Number,
    min: 2700,
    max: 6500,
    sparse: true
  },
  
  // 温控器字段
  current_temp: {
    type: Number,
    min: 16,
    max: 30,
    sparse: true
  },
  target_temp: {
    type: Number,
    min: 16,
    max: 30,
    sparse: true
  },
  humidity: {
    type: Number,
    min: 0,
    max: 100,
    sparse: true
  },
  mode: {
    type: String,
    enum: ['auto', 'heat', 'cool'],
    sparse: true
  },
  fan_speed: {
    type: String,
    enum: ['auto', 'low', 'medium', 'high'],
    sparse: true
  },
  heating_power: {
    type: Number,
    min: 0,
    sparse: true
  },
  cooling_power: {
    type: Number,
    min: 0,
    sparse: true
  },
  runtime_minutes: {
    type: Number,
    min: 0,
    sparse: true
  },
  energy_efficiency: {
    type: Number,
    min: 0,
    sparse: true
  },
  
  // 门锁字段
  locked: {
    type: Boolean,
    sparse: true
  },
  battery_level: {
    type: Number,
    min: 0,
    max: 100,
    sparse: true
  },
  last_lock_time: {
    type: Date,
    sparse: true
  },
  last_unlock_time: {
    type: Date,
    sparse: true
  },
  
  // 窗帘字段
  position: {
    type: Number,
    min: 0,
    max: 100,
    sparse: true
  },
  tilt: {
    type: Number,
    min: 0,
    max: 180,
    sparse: true
  },
  moving: {
    type: Boolean,
    sparse: true
  },
  last_move_time: {
    type: Date,
    sparse: true
  },
  
  // 空调字段
  ac_on: {
    type: Boolean,
    sparse: true
  },
  ac_temp: {
    type: Number,
    min: 16,
    max: 30,
    sparse: true
  },
  ac_mode: {
    type: String,
    enum: ['cool', 'heat', 'dry', 'fan'],
    sparse: true
  },
  ac_fan_speed: {
    type: String,
    enum: ['auto', 'low', 'medium', 'high'],
    sparse: true
  },
  ac_swing: {
    type: Boolean,
    sparse: true
  },
  
  // 烟雾报警器字段
  alarm: {
    type: Boolean,
    sparse: true
  },
  smoke_level: {
    type: Number,
    min: 0,
    max: 100,
    sparse: true
  },
  last_test_time: {
    type: Date,
    sparse: true
  },
  
  // 风扇字段
  fan_on: {
    type: Boolean,
    sparse: true
  },
  speed: {
    type: Number,
    min: 1,
    max: 3,
    sparse: true
  },
  oscillate: {
    type: Boolean,
    sparse: true
  },
  timer: {
    type: Number,
    min: 0,
    max: 120,
    sparse: true
  },
  
  // 智能插座字段
  plug_on: {
    type: Boolean,
    sparse: true
  },
  voltage: {
    type: Number,
    min: 100,
    max: 240,
    sparse: true
  },
  current: {
    type: Number,
    min: 0,
    sparse: true
  },
  power_factor: {
    type: Number,
    min: 0.8,
    max: 1,
    sparse: true
  },
  plug_timer: {
    type: Number,
    min: 0,
    max: 120,
    sparse: true
  },
  
  // 通用字段
  power_consumption: {
    type: Number,
    min: 0,
    sparse: true
  }
});

// 添加复合索引
smartDeviceSensorDataSchema.index({ device_id: 1, timestamp: -1 });
smartDeviceSensorDataSchema.index({ device_type: 1, timestamp: -1 });

// 添加验证中间件
smartDeviceSensorDataSchema.pre('validate', function(next) {
  const doc = this as ISmartDeviceSensorData;
  
  // 根据设备类型验证必需字段
  switch (doc.device_type) {
    case DeviceType.THERMOSTAT:
      if (!doc.current_temp || !doc.target_temp || !doc.humidity || !doc.mode || !doc.fan_speed) {
        next(new Error('温控器设备缺少必需字段'));
        return;
      }
      break;

    case DeviceType.LIGHT:
      if (typeof doc.brightness === 'undefined' || typeof doc.color_temp === 'undefined') {
        next(new Error('智能灯设备缺少必需字段'));
        return;
      }
      break;

    case DeviceType.DOOR_LOCK:
      if (typeof doc.locked === 'undefined' || typeof doc.battery_level === 'undefined') {
        next(new Error('智能门锁设备缺少必需字段'));
        return;
      }
      break;

    case DeviceType.BLIND:
      if (typeof doc.position === 'undefined' || typeof doc.tilt === 'undefined' || typeof doc.moving === 'undefined') {
        next(new Error('智能窗帘设备缺少必需字段'));
        return;
      }
      break;

    case DeviceType.AIR_CONDITIONER:
      if (typeof doc.ac_on === 'undefined' || !doc.ac_temp || !doc.ac_mode || !doc.ac_fan_speed) {
        next(new Error('空调设备缺少必需字段'));
        return;
      }
      break;

    case DeviceType.SMOKE_DETECTOR:
      if (typeof doc.alarm === 'undefined' || typeof doc.battery_level === 'undefined' || typeof doc.smoke_level === 'undefined') {
        next(new Error('烟雾报警器设备缺少必需字段'));
        return;
      }
      break;

    case DeviceType.FAN:
      if (typeof doc.fan_on === 'undefined' || typeof doc.speed === 'undefined' || typeof doc.oscillate === 'undefined') {
        next(new Error('风扇设备缺少必需字段'));
        return;
      }
      break;

    case DeviceType.PLUG:
      if (typeof doc.plug_on === 'undefined' || typeof doc.voltage === 'undefined' || 
          typeof doc.current === 'undefined' || typeof doc.power_factor === 'undefined') {
        next(new Error('智能插座设备缺少必需字段'));
        return;
      }
      break;
  }
  
  next();
});

// 创建模型
export const SmartDeviceSensorData = mongoose.model<ISmartDeviceSensorData>(
  'SmartDeviceSensorData',
  smartDeviceSensorDataSchema
); 