const { createClient } = require('redis');

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('connect', () => {
  console.log('Redis socket connected');
});

redisClient.on('ready', () => {
  console.log('Redis ready');
});

redisClient.on('reconnecting', () => {
  console.log('Redis reconnecting');
});

redisClient.on('error', (error) => {
  console.error('Redis client error:', error.message);
});

const connectRedis = async () => {
  if (redisClient.isOpen) {
    return;
  }

  await redisClient.connect();
};

const disconnectRedis = async () => {
  if (!redisClient.isOpen) {
    return;
  }

  await redisClient.quit();
};

const redisConnection = {
  host: '127.0.0.1',
  port: 6379
};

module.exports = {
  redisClient,
  connectRedis,
  disconnectRedis,
  redisConnection
};