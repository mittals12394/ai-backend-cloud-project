const { Queue } = require('bullmq');

const {
  redisConnection
} = require('../config/redis');

const summaryQueue = new Queue(
  'summary-queue',
  {
    connection: redisConnection
  }
);

module.exports = summaryQueue;