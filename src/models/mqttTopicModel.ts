import mongoose, { Schema, Document } from 'mongoose';

export interface IMqttTopic extends Document {
  topic: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const mqttTopicSchema = new Schema({
  topic: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model<IMqttTopic>('MqttTopic', mqttTopicSchema); 