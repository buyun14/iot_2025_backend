import express from 'express';
import cameraController from '../controllers/cameraController';
import authMiddleware from '../middleware/authMiddleware';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Camera management routes
// 获取所有摄像头  
router.get('/', cameraController.getAllCameras);
// 获取单个摄像头
router.get('/:id', cameraController.getCameraById);
// 创建摄像头
router.post('/', cameraController.createCamera);
// 更新摄像头
router.put('/:id', cameraController.updateCamera);
// 删除摄像头
router.delete('/:id', cameraController.deleteCamera);

// 流管理路由
router.post('/sync', cameraController.syncStreams);
// 获取流URL
router.get('/:id/streams', cameraController.getStreamUrls);

export default router; 