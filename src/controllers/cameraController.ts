import { Request, Response } from 'express';
import Camera from '../models/cameraModel';
import srsService from '../services/srsService';

interface StreamUrls {
    flv: string;
    hls: string;
    webrtc: string;
}

const cameraController = {
    // Get all cameras
    // 获取所有摄像头
    async getAllCameras(_req: Request, res: Response): Promise<void> {
        try {
            const cameras = await Camera.find();
            res.json(cameras);
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    },

    // Get camera by ID
    // 获取单个摄像头
    async getCameraById(req: Request, res: Response): Promise<void> {
        try {
            const camera = await Camera.findById(req.params.id);
            if (!camera) {
                res.status(404).json({ error: 'Camera not found' });
                return;
            }
            res.json(camera);
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    },

    // 创建新摄像头
    async createCamera(req: Request, res: Response): Promise<void> {
        try {
            const camera = new Camera(req.body);
            await camera.save();
            res.status(201).json(camera);
        } catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    },

    // 更新摄像头
    async updateCamera(req: Request, res: Response): Promise<void> {
        try {
            const camera = await Camera.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true, runValidators: true }
            );
            if (!camera) {
                res.status(404).json({ error: 'Camera not found' });
                return;
            }
            res.json(camera);
        } catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    },

    // 删除摄像头
    async deleteCamera(req: Request, res: Response): Promise<void> {
        try {
            const camera = await Camera.findByIdAndDelete(req.params.id);
            if (!camera) {
                res.status(404).json({ error: 'Camera not found' });
                return;
            }
            res.json({ message: 'Camera deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    },

    // 与SRS服务器同步流
    async syncStreams(_req: Request, res: Response): Promise<void> {
        try {
            const streams = await srsService.syncStreamsWithDatabase();
            res.json({ message: 'Streams synced successfully', streams });
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    },

    // 获取摄像头流URL
    async getStreamUrls(req: Request, res: Response): Promise<void> {
        try {
            const camera = await Camera.findById(req.params.id);
            if (!camera) {
                res.status(404).json({ error: 'Camera not found' });
                return;
            }

            const urls: StreamUrls = {
                flv: srsService.getStreamUrl(camera.streamInfo.stream, 'flv'),
                hls: srsService.getStreamUrl(camera.streamInfo.stream, 'hls'),
                webrtc: srsService.getStreamUrl(camera.streamInfo.stream, 'webrtc')
            };

            res.json(urls);
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    }
};

export default cameraController; 