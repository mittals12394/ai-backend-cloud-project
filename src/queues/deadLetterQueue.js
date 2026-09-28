const { Queue } = require('bullmq');

const {
  redisConnection
} = require('../config/redis');

const deadLetterQueue = new Queue(
  'summary-dlq',
  {
    connection: redisConnection
  }
);

module.exports = deadLetterQueue;