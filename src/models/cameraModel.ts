import mongoose, { Document, Schema } from 'mongoose';

interface IStreamInfo {
    vhost: string;
    app: string;
    stream: string;
    param: string;
    serverId: string;
    clientId: string;
    lastUpdate: Date;
}

interface IConfiguration {
    resolution: string;
    frameRate: number;
    bitrate: number;
    codec: string;
}

export interface ICamera extends Document {
    deviceId?: string;
    name: string;
    description?: string;
    location?: string;
    status: 'online' | 'offline' | 'error';
    streamInfo: IStreamInfo;
    rtmpUrl?: string;
    streamSecret?: string;
    configuration: IConfiguration;
    metadata: Map<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

const cameraSchema = new Schema<ICamera>({
    deviceId: {
        type: String,
        unique: true,
        sparse: true // 允许为空，但如果有值则必须唯一
    },
    name: {
        type: String,
        required: true
    },
    description: String,
    location: String,
    status: {
        type: String,
        enum: ['online', 'offline', 'error'],
        default: 'offline'
    },
    streamInfo: {
        vhost: String,
        app: String,
        stream: String,
        param: String,
        serverId: String,
        clientId: String,
        lastUpdate: Date
    },
    rtmpUrl: String,
    streamSecret: String,
    configuration: {
        resolution: String,
        frameRate: Number,
        bitrate: {
            type: Number,
            get: (v: number) => Math.round(v), // 确保是整数
            set: (v: string | number) => {
                // 处理带单位的字符串，如 "1024k"
                if (typeof v === 'string') {
                    const num = parseFloat(v);
                    if (v.toLowerCase().endsWith('k')) {
                        return num * 1024; // 转换为字节
                    } else if (v.toLowerCase().endsWith('m')) {
                        return num * 1024 * 1024;
                    }
                    return num;
                }
                return v;
            }
        },
        codec: String
    },
    metadata: {
        type: Map,
        of: Schema.Types.Mixed
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on save
cameraSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

export default mongoose.model<ICamera>('Camera', cameraSchema); 