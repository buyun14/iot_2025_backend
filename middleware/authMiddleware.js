// middleware/authMiddleware.js

const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization;
  
    if (!token || token !== 'your-secret-token') {
      return res.status(401).json({ message: '未授权访问' });
    }
  
    next();
  };
  
  module.exports = authMiddleware;