import mongoose, { Document, Schema } from 'mongoose';

export interface ISensorData extends Document {
  device_id: string;
  timestamp: Date;
  value: number;
  status: string;
}

const sensorDataSchema = new Schema<ISensorData>({
  device_id: { type: String, required: true, index: true },
  timestamp: { type: Date, default: Date.now, index: true },
  value: { type: Number, required: true },
  status: { type: String, enum: ['on', 'off', 'offline'], required: true }
});

export default mongoose.model<ISensorData>('SensorData', sensorDataSchema); 