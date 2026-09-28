const metrics =
  require('../utils/metrics');

const workerStatus =
  require('../utils/workerStatus');

const getHealth =
  async (
    req,
    res
  ) => {

    res.status(200).json({

      success: true,

      data: {

        api: 'UP',

        worker:
          workerStatus.healthy
            ? 'UP'
            : 'DOWN',

        lastProcessedJob:
          workerStatus.lastProcessedJob,

        lastCompletedAt:
          workerStatus.lastCompletedAt,

        metrics
      }
    });
};

module.exports = {
  getHealth
};