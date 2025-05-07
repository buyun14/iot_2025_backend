import { Request, Response } from 'express';
import Camera from '../models/cameraModel';
import srsService from '../services/srsService';

interface StreamUrls {
    flv: string;
    hls: string;
    webrtc: string;
}

const cameraController = {
    /**
     * @api {get} /api/cameras 获取所有摄像头
     * @apiName GetAllCameras
     * @apiGroup Camera
     * @apiVersion 1.0.0
     *
     * @apiSuccess {Object[]} cameras 摄像头列表
     * @apiSuccess {String} cameras._id 摄像头ID
     * @apiSuccess {String} cameras.name 摄像头名称
     * @apiSuccess {Object} cameras.streamInfo 流信息
     * @apiSuccess {String} cameras.streamInfo.stream 流标识
     *
     * @apiError (500) {String} error 服务器内部错误
     */
    async getAllCameras(_req: Request, res: Response): Promise<void> {
        try {
            const cameras = await Camera.find();
            res.json(cameras);
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    },

    /**
     * @api {get} /api/cameras/:id 获取单个摄像头
     * @apiName GetCameraById
     * @apiGroup Camera
     * @apiVersion 1.0.0
     *
     * @apiParam {String} id 摄像头ID
     *
     * @apiSuccess {Object} camera 摄像头信息
     * @apiSuccess {String} camera._id 摄像头ID
     * @apiSuccess {String} camera.name 摄像头名称
     * @apiSuccess {Object} camera.streamInfo 流信息
     *
     * @apiError (404) {String} error 摄像头未找到
     * @apiError (500) {String} error 服务器内部错误
     */
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

    /**
     * @api {post} /api/cameras 创建新摄像头
     * @apiName CreateCamera
     * @apiGroup Camera
     * @apiVersion 1.0.0
     *
     * @apiBody {String} name 摄像头名称
     * @apiBody {Object} streamInfo 流信息
     * @apiBody {String} streamInfo.stream 流标识
     *
     * @apiSuccess {Object} camera 新创建的摄像头信息
     *
     * @apiError (400) {String} error 请求参数错误
     */
    async createCamera(req: Request, res: Response): Promise<void> {
        try {
            const camera = new Camera(req.body);
            await camera.save();
            res.status(201).json(camera);
        } catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    },

    /**
     * @api {put} /api/cameras/:id 更新摄像头
     * @apiName UpdateCamera
     * @apiGroup Camera
     * @apiVersion 1.0.0
     *
     * @apiParam {String} id 摄像头ID
     * @apiBody {String} [name] 摄像头名称
     * @apiBody {Object} [streamInfo] 流信息
     *
     * @apiSuccess {Object} camera 更新后的摄像头信息
     *
     * @apiError (404) {String} error 摄像头未找到
     * @apiError (400) {String} error 请求参数错误
     */
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

    /**
     * @api {delete} /api/cameras/:id 删除摄像头
     * @apiName DeleteCamera
     * @apiGroup Camera
     * @apiVersion 1.0.0
     *
     * @apiParam {String} id 摄像头ID
     *
     * @apiSuccess {String} message 删除成功消息
     *
     * @apiError (404) {String} error 摄像头未找到
     * @apiError (500) {String} error 服务器内部错误
     */
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

    /**
     * @api {post} /api/cameras/sync-streams 与SRS服务器同步流
     * @apiName SyncStreams
     * @apiGroup Camera
     * @apiVersion 1.0.0
     *
     * @apiSuccess {String} message 同步成功消息
     * @apiSuccess {Object[]} streams 同步的流列表
     *
     * @apiError (500) {String} error 服务器内部错误
     */
    async syncStreams(_req: Request, res: Response): Promise<void> {
        try {
            const streams = await srsService.syncStreamsWithDatabase();
            res.json({ message: 'Streams synced successfully', streams });
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    },

    /**
     * @api {get} /api/cameras/:id/stream-urls 获取摄像头流URL
     * @apiName GetStreamUrls
     * @apiGroup Camera
     * @apiVersion 1.0.0
     *
     * @apiParam {String} id 摄像头ID
     *
     * @apiSuccess {Object} urls 流URL信息
     * @apiSuccess {String} urls.flv FLV流URL
     * @apiSuccess {String} urls.hls HLS流URL
     * @apiSuccess {String} urls.webrtc WebRTC流URL
     *
     * @apiError (404) {String} error 摄像头未找到
     * @apiError (500) {String} error 服务器内部错误
     */
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