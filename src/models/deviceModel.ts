import mongoose, { Document, Schema } from 'mongoose';

interface IThresholds {
  lower: number;
  upper: number;
}

export interface IDevice extends Document {
  device_id: string;
  type?: 'light' | 'soil';
  name?: string;
  thresholds: IThresholds;
  status: string;
  current_value?: number;
}

const deviceSchema = new Schema<IDevice>({
  device_id: { type: String, unique: true, required: true }, // 唯一设备 ID
  type: { type: String, enum: ['light', 'soil']}, // 设备类型
  name: String, // 设备名称
  thresholds: {
    lower: Number,
    upper: Number,
  },
  status: String, // 当前状态
  current_value: Number, // 当前值
});

export default mongoose.model<IDevice>('Device', deviceSchema); 