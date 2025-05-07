import { Request, Response } from 'express';
import Log from '../models/logModel';
import { SortOrder } from 'mongoose';

interface LogQuery {
  device_id?: string;
  start?: string;
  end?: string;
  page?: string;
  limit?: string;
  sort?: string;
}

// 获取日志
export const getLogs = async (req: Request<{}, {}, {}, LogQuery>, res: Response): Promise<void> => {
  try {
    const { device_id, start, end, page = '1', limit = '10', sort = '-timestamp' } = req.query;

    // 构建查询条件
    const query: Record<string, any> = {};
    if (device_id) query.device_id = device_id;
    if (start) query.timestamp = { ...query.timestamp, $gte: new Date(start) };
    if (end) query.timestamp = { ...query.timestamp, $lte: new Date(end) };

    // 分页和排序
    const sortField = sort.startsWith('-') ? sort.slice(1) : sort;
    const sortOrder: SortOrder = sort.startsWith('-') ? -1 : 1;
    const sortOptions: Record<string, SortOrder> = { [sortField]: sortOrder };
    const options = {
      sort: sortOptions,
      skip: (parseInt(page) - 1) * parseInt(limit),
      limit: parseInt(limit)
    };

    // 执行查询
    const logs = await Log.find(query)
      .select('-__v') // 排除虚拟字段
      .sort(sortOptions)
      .skip(options.skip)
      .limit(options.limit);

    // 获取总数
    const total = await Log.countDocuments(query);

    res.status(200).json({ total, logs });
  } catch (error) {
    res.status(500).json({ 
      message: '获取日志失败', 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
}; 