import express from 'express';
import * as logController from '../controllers/logController';

const router = express.Router();

// 获取日志列表
router.get('/logs', logController.getLogs);

export default router; 