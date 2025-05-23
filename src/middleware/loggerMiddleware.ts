import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import winston from 'winston';

// 创建日志记录器
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({ format: winston.format.simple() })
  ]
});

// 使用 Morgan 记录 HTTP 请求
const morganLogger = morgan(':method :url :status :res[content-length] - :response-time ms');

interface LogEntry {
  timestamp: string;
  method: string;
  url: string;
  params: any;
  body: any;
  ip: string | undefined;
}

const loggerMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // 记录 HTTP 请求基础信息
  morganLogger(req, res, () => {});

  // 记录请求详细内容（方法、URL、Body）
  const logEntry: LogEntry = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    params: req.params,
    body: req.body,
    ip: req.ip
  };
  logger.info('API Request:', logEntry);

  // 在响应结束时记录状态码和耗时
  const startAt = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - startAt;
    logger.info({
      message: 'API Response',
      status: res.statusCode,
      duration: `${duration}ms`,
      url: req.url
    });
  });

  next();
};

export default loggerMiddleware; 