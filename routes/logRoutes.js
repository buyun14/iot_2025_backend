// routes/logRoutes.js

const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');

// 获取日志列表
router.get('/logs', logController.getLogs);

module.exports = router;