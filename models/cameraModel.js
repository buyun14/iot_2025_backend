// backend/models/cameraModel.js
const mongoose = require('mongoose');

const cameraSchema = new mongoose.Schema({
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
            get: v => Math.round(v), // 确保是整数
            set: v => {
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
        of: mongoose.Schema.Types.Mixed
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
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Camera', cameraSchema); 