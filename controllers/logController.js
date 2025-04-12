// backend/controllers/logController.js
const Log = require('../models/logModel');

// 获取日志
exports.getLogs = async (req, res) => {
  try {
    const { device_id, start, end, page = 1, limit = 10, sort = '-timestamp' } = req.query;

    // 构建查询条件
    const query = {};
    if (device_id) query.device_id = device_id;
    if (start) query.timestamp = { ...query.timestamp, $gte: new Date(start) };
    if (end) query.timestamp = { ...query.timestamp, $lte: new Date(end) };

    // 分页和排序
    const options = {
      sort: { [sort]: sort.startsWith('-') ? -1 : 1 },
      skip: (page - 1) * limit,
      limit: parseInt(limit)
    };

    // 执行查询
    const logs = await Log.find(query)
      .select('-__v') // 排除虚拟字段
      .sort(options.sort)
      .skip(options.skip)
      .limit(options.limit);

    // 获取总数
    const total = await Log.countDocuments(query);

    res.status(200).json({ total, logs });
  } catch (error) {
    res.status(500).json({ message: '获取日志失败', error: error.message });
  }
};