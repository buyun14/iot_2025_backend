import mongoose, { Document, Schema } from 'mongoose';
import { DeviceType, DeviceState } from './smartDeviceModel';

// 设备状态历史记录接口
export interface IDeviceStateHistory extends Document {
  deviceId: string;
  type: DeviceType;
  state: DeviceState;
  timestamp: Date;
  reason: string;
  details?: Record<string, any>;
}

// 设备状态历史记录模式
const deviceStateHistorySchema = new Schema<IDeviceStateHistory>({
  deviceId: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: Object.values(DeviceType),
    required: true,
    index: true
  },
  state: {
    type: Schema.Types.Mixed,
    required: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  reason: {
    type: String,
    required: true
  },
  details: {
    type: Schema.Types.Mixed
  }
});

// 添加复合索引
deviceStateHistorySchema.index({ deviceId: 1, timestamp: -1 });
deviceStateHistorySchema.index({ type: 1, timestamp: -1 });

// 创建模型
export const DeviceStateHistory = mongoose.model<IDeviceStateHistory>(
  'DeviceStateHistory',
  deviceStateHistorySchema
); 