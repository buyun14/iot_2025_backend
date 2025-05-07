import { Request, Response, NextFunction } from 'express';

const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.headers.authorization;

  if (!token || token !== process.env.YOUR_SECRET_TOKEN) {
    res.status(401).json({ message: '未授权访问' });
    return;
  }

  next();
};

export default authMiddleware; 