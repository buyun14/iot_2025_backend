// controllers/logController.js

const Log = require('../models/logModel');

// 获取日志列表
exports.getLogs = async (req, res) => {
  const { start_date, end_date } = req.query;
  const query = {};

  if (start_date && end_date) {
    query.timestamp = { $gte: new Date(start_date), $lte: new Date(end_date) };
  }

  try {
    const logs = await Log.find(query);
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};