// backend/controllers/cameraController.js
const Camera = require('../models/cameraModel');
const srsService = require('../services/srsService');

const cameraController = {
    // Get all cameras
    // 获取所有摄像头
    async getAllCameras(req, res) {
        try {
            const cameras = await Camera.find();
            res.json(cameras);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Get camera by ID
    // 获取单个摄像头
    async getCameraById(req, res) {
        try {
            const camera = await Camera.findById(req.params.id);
            if (!camera) {
                return res.status(404).json({ error: 'Camera not found' });
            }
            res.json(camera);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // 创建新摄像头
    async createCamera(req, res) {
        try {
            const camera = new Camera(req.body);
            await camera.save();
            res.status(201).json(camera);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    // 更新摄像头
    async updateCamera(req, res) {
        try {
            const camera = await Camera.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true, runValidators: true }
            );
            if (!camera) {
                return res.status(404).json({ error: 'Camera not found' });
            }
            res.json(camera);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    // 删除摄像头
    async deleteCamera(req, res) {
        try {
            const camera = await Camera.findByIdAndDelete(req.params.id);
            if (!camera) {
                return res.status(404).json({ error: 'Camera not found' });
            }
            res.json({ message: 'Camera deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // 与SRS服务器同步流
    async syncStreams(req, res) {
        try {
            const streams = await srsService.syncStreamsWithDatabase();
            res.json({ message: 'Streams synced successfully', streams });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // 获取摄像头流URL
    async getStreamUrls(req, res) {
        try {
            const camera = await Camera.findById(req.params.id);
            if (!camera) {
                return res.status(404).json({ error: 'Camera not found' });
            }

            const urls = {
                flv: srsService.getStreamUrl(camera.streamInfo.stream, 'flv'),
                hls: srsService.getStreamUrl(camera.streamInfo.stream, 'hls'),
                webrtc: srsService.getStreamUrl(camera.streamInfo.stream, 'webrtc')
            };

            res.json(urls);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = cameraController; 