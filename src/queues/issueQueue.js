const { Queue } = require('bullmq');

const {
  redisConnection
} = require('../config/redis');

const issueQueue = new Queue(
  'issue-queue',
  {
    connection: redisConnection
  }
);

module.exports = issueQueue;