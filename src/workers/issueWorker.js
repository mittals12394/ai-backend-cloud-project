const { Worker } = require('bullmq');

const {
  redisConnection
} = require('../config/redis');

const worker = new Worker(

  'issue-queue',

  async (job) => {

    console.log(
      `Processing Job ${job.id}`
    );

    console.log(
      'Job Name:',
      job.name
    );

    console.log(
      'Job Data:',
      job.data
    );

    await new Promise(
      (resolve) =>
        setTimeout(resolve, 3000)
    );

    console.log(
      `Completed Job ${job.id}`
    );

    return {
      success: true
    };
  },

  {
    connection: redisConnection
  }
);

worker.on(
  'completed',
  (job) => {

    console.log(
      `Job ${job.id} completed`
    );

  }
);

worker.on(
  'failed',
  (job, error) => {

    console.error(
      `Job ${job.id} failed`,
      error
    );

  }
);

console.log(
  'Issue Worker Started'
);