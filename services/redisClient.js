// services\redisClient.js

const redis = require('redis');

// 创建 Redis 客户端
const client = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

client.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

// 连接 Redis
(async () => {
  await client.connect();
})();

module.exports = client;