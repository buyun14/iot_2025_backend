import mongoose, { Document, Schema } from 'mongoose';

interface IThresholds {
  lower: number;
  upper: number;
}

interface ILocation {
  floor: string;
  room: string;
  coordinates: [number, number, number];
}

export const SensorType = [
  'temperature',
  'humidity',
  'soil_moisture',
  'light_intensity',
  'air_quality_index',
  'co2_level',
  'pressure'
] as const;

export type SensorType = typeof SensorType[number];

export interface IDevice extends Document {
  device_id: string;
  type?: SensorType;
  name?: string;
  thresholds: IThresholds;
  status: string;
  current_value?: number;
  location?: ILocation;
  last_message_time?: Date;
}

const deviceSchema = new Schema<IDevice>({
  device_id: { type: String, unique: true, required: true }, // 唯一设备 ID
  type: { type: String, enum: [...SensorType]}, // 设备类型
  name: String, // 设备名称
  thresholds: {
    lower: Number,
    upper: Number,
  },
  status: String, // 当前状态
  current_value: Number, // 当前值
  location: {
    floor: String,
    room: String,
    coordinates: [Number]
  },
  last_message_time: Date // 最后消息时间
});

export default mongoose.model<IDevice>('Device', deviceSchema); 