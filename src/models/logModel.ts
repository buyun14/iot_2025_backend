import mongoose, { Document, Schema } from 'mongoose';

export interface ILog extends Document {
  log_id: string;
  device_id: string;
  timestamp: Date;
  event_type: string;
  details: Record<string, any>;
}

const logSchema = new Schema<ILog>({
  log_id: { type: String, required: true, unique: true },
  device_id: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  event_type: { type: String, required: true }, // 如 "parameter_update", "firmware_upgrade"
  details: { type: Object, required: true },
});

// 添加索引
logSchema.index({ device_id: 1, timestamp: -1 });

export default mongoose.model<ILog>('Log', logSchema); 