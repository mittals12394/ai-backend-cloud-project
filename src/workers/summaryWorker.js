require('dotenv').config();

const { Worker } = require('bullmq');

const prisma = require('../config/prisma');

const {
  redisConnection,
  redisClient,
  connectRedis
} = require('../config/redis');

const logger = require('../utils/logger');

const deadLetterQueue = require(
  '../queues/deadLetterQueue'
);

const WORKER_HEALTH_KEY =
  'worker:summary:health';

const WORKER_METRICS_KEY =
  'metrics:summary-worker';

const HEALTH_TTL_SECONDS = 60;

let worker;
let healthHeartbeat;

/*
 * Generates a rule-based summary.
 *
 * This is the v0 implementation. Later, this function
 * can be replaced with an Azure OpenAI or another AI call
 * without changing the queue and worker architecture.
 */
const generateHeuristicSummary = (issue) => {
  const allLines = issue.logs.flatMap((log) => {
    if (!log.rawText) {
      return [];
    }

    return log.rawText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  });

  const errorLines = allLines.filter((line) => {
    const lower = line.toLowerCase();

    return (
      lower.includes('error') ||
      lower.includes('exception') ||
      lower.includes('failed') ||
      lower.includes('failure') ||
      lower.includes('timeout')
    );
  });

  /*
   * Remove duplicate error lines while preserving
   * their original order.
   */
  const uniqueErrors = [...new Set(errorLines)];

  const topErrors = uniqueErrors.slice(0, 5);

  return {
    totalLines: allLines.length,
    totalErrors: errorLines.length,
    uniqueErrorCount: uniqueErrors.length,
    topErrors
  };
};

/*
 * Saves worker health in Redis.
 *
 * The health record has a TTL. If the worker stops
 * unexpectedly and no longer refreshes this record,
 * the key expires and the API can treat the worker
 * as unavailable.
 */
const saveWorkerHealth = async (data) => {
  try {
    if (!redisClient.isReady) {
      return;
    }

    const normalizedData = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [
        key,
        value === null || value === undefined
          ? ''
          : String(value)
      ])
    );

    await redisClient.hSet(
      WORKER_HEALTH_KEY,
      normalizedData
    );

    await redisClient.expire(
      WORKER_HEALTH_KEY,
      HEALTH_TTL_SECONDS
    );
  } catch (error) {
    logger.error(
      'Unable to update summary worker health',
      {
        error: error.message
      }
    );
  }
};

/*
 * Stores counters in Redis because the API and worker
 * run in different Node.js processes.
 *
 * An in-memory object would not be shared between them.
 */
const incrementMetric = async (metricName) => {
  try {
    if (!redisClient.isReady) {
      return;
    }

    await redisClient.hIncrBy(
      WORKER_METRICS_KEY,
      metricName,
      1
    );
  } catch (error) {
    logger.error(
      'Unable to increment worker metric',
      {
        metricName,
        error: error.message
      }
    );
  }
};

/*
 * Updates both BullMQ job progress and the durable
 * Summary progress stored in PostgreSQL.
 */
const updateProgress = async (
  job,
  summaryId,
  progress
) => {
  await job.updateProgress(progress);

  await prisma.summary.update({
    where: {
      id: summaryId
    },

    data: {
      progress
    }
  });
};

/*
 * Determines whether the current failure is the final
 * permitted BullMQ attempt.
 *
 * attemptsMade is zero-based before the first failure,
 * so we use attemptsMade + 1.
 */
const isFinalAttempt = (job) => {
  const maximumAttempts =
    job.opts.attempts || 1;

  const currentAttempt =
    job.attemptsMade + 1;

  return currentAttempt >= maximumAttempts;
};

/*
 * Adds a permanently failed job to the dead-letter queue.
 *
 * The DLQ has no worker intentionally. It acts as a
 * holding area for inspection and manual redrive.
 */
const moveToDeadLetterQueue = async (
  job,
  error
) => {
  const {
    summaryId,
    issueId
  } = job.data;

  await deadLetterQueue.add(
    'failed-summary',

    {
      originalJobId: String(job.id),
      originalJobName: job.name,
      summaryId,
      issueId,
      errorMessage: error.message,
      stack: error.stack || '',
      attemptsMade: job.attemptsMade + 1,
      failedAt: new Date().toISOString()
    },

    {
      /*
       * Makes the DLQ entry unique for this original job.
       */
      jobId: `dlq-${job.id}`,

      removeOnComplete: false,
      removeOnFail: false
    }
  );

  await incrementMetric('jobsMovedToDlq');

  logger.error(
    'Summary job moved to dead-letter queue',
    {
      jobId: job.id,
      summaryId,
      issueId,
      attemptsMade: job.attemptsMade + 1,
      error: error.message
    }
  );
};

const startWorker = async () => {
  /*
   * This connects the node-redis client used for health
   * records and metrics.
   *
   * BullMQ uses redisConnection separately through
   * its own connection.
   */
  await connectRedis();

  await saveWorkerHealth({
    status: 'UP',
    workerName: 'summary-worker',
    currentJobId: '',
    currentIssueId: '',
    startedAt: new Date().toISOString(),
    lastHeartbeatAt: new Date().toISOString()
  });

  /*
   * Refresh health while the worker is idle.
   *
   * Without this heartbeat, the 60-second Redis key
   * would expire even when the worker was healthy but
   * had no jobs to process.
   */
  healthHeartbeat = setInterval(async () => {
    await saveWorkerHealth({
      status: 'UP',
      workerName: 'summary-worker',
      lastHeartbeatAt: new Date().toISOString()
    });
  }, 20000);

  worker = new Worker(
    'summary-queue',

    async (job) => {
      const {
        summaryId,
        issueId
      } = job.data;

      const startedAt = Date.now();

      const currentAttempt =
        job.attemptsMade + 1;

      const maximumAttempts =
        job.opts.attempts || 1;

      logger.info(
        'Summary job processing started',
        {
          jobId: job.id,
          jobName: job.name,
          summaryId,
          issueId,
          attempt: currentAttempt,
          maximumAttempts
        }
      );

      await incrementMetric('jobsStarted');

      await saveWorkerHealth({
        status: 'UP',
        currentJobId: job.id,
        currentIssueId: issueId,
        lastStartedAt:
          new Date().toISOString(),
        lastHeartbeatAt:
          new Date().toISOString()
      });

      await prisma.summary.update({
        where: {
          id: summaryId
        },

        data: {
          status: 'PROCESSING',
          progress: 10,
          errorMessage: null,
          completedAt: null
        }
      });

      await job.updateProgress(10);

      try {
        const issue =
          await prisma.issue.findUnique({
            where: {
              id: issueId
            },

            include: {
              logs: {
                orderBy: {
                  createdAt: 'asc'
                }
              },

              tags: true
            }
          });

        if (!issue) {
          throw new Error(
            `Issue ${issueId} was not found`
          );
        }

        /*
         * Issue and related data were loaded.
         */
        await updateProgress(
          job,
          summaryId,
          30
        );

        const result =
          generateHeuristicSummary(issue);

        /*
         * Log analysis completed.
         */
        await updateProgress(
          job,
          summaryId,
          60
        );

        const topErrorText =
          result.topErrors.length > 0
            ? result.topErrors
                .map(
                  (errorLine, index) =>
                    `${index + 1}. ${errorLine}`
                )
                .join('\n')
            : 'No error lines were detected.';

        const tagNames =
          issue.tags.length > 0
            ? issue.tags
                .map((tag) => tag.name)
                .join(', ')
            : 'No tags';

        /*
         * At this stage all data has been processed
         * and the output is ready to be stored.
         */
        await updateProgress(
          job,
          summaryId,
          90
        );

        const summaryText = `
Issue Summary

Issue:
${issue.title}

Description:
${issue.description || 'No description provided'}

Status:
${issue.status}

Severity:
${issue.severity}

Tags:
${tagNames}

Total Log Lines:
${result.totalLines}

Error Line Count:
${result.totalErrors}

Unique Error Count:
${result.uniqueErrorCount}

Top Error Lines:
${topErrorText}
`.trim();

        const completedSummary =
          await prisma.summary.update({
            where: {
              id: summaryId
            },

            data: {
              status: 'COMPLETED',
              progress: 100,
              content: summaryText,
              errorMessage: null,
              completedAt: new Date()
            }
          });

        await job.updateProgress(100);

        await incrementMetric(
          'jobsProcessed'
        );

        await incrementMetric(
          'summariesGenerated'
        );

        const durationMs =
          Date.now() - startedAt;

        await saveWorkerHealth({
          status: 'UP',
          currentJobId: '',
          currentIssueId: '',
          lastProcessedJobId: job.id,
          lastCompletedAt:
            new Date().toISOString(),
          lastDurationMs: durationMs,
          lastHeartbeatAt:
            new Date().toISOString()
        });

        logger.info(
          'Summary processing completed',
          {
            jobId: job.id,
            summaryId,
            issueId,
            durationMs,
            totalLogLines:
              result.totalLines,
            errorLineCount:
              result.totalErrors,
            uniqueErrorCount:
              result.uniqueErrorCount
          }
        );

        /*
         * The return value is stored by BullMQ as the
         * job's return value and is available through
         * BullMQ's job inspection APIs.
         */
        return {
          success: true,
          summaryId:
            completedSummary.id,
          issueId,
          status:
            completedSummary.status,
          durationMs
        };
      } catch (error) {
        const finalAttempt =
          isFinalAttempt(job);

        await incrementMetric(
          'jobAttemptsFailed'
        );

        if (finalAttempt) {
          /*
           * Mark the durable Summary record as FAILED
           * only after all retry attempts are exhausted.
           */
          await prisma.summary.update({
            where: {
              id: summaryId
            },

            data: {
              status: 'FAILED',
              progress: 0,
              errorMessage: error.message,
              completedAt: new Date()
            }
          });

          await incrementMetric(
            'jobsFailed'
          );

          /*
           * Only permanently failed jobs belong in the DLQ.
           * Adding the job during every failed attempt would
           * create misleading duplicate DLQ entries.
           */
          try {
            await moveToDeadLetterQueue(
              job,
              error
            );
          } catch (dlqError) {
            logger.error(
              'Unable to move summary job to dead-letter queue',
              {
                jobId: job.id,
                summaryId,
                issueId,
                originalError:
                  error.message,
                dlqError:
                  dlqError.message
              }
            );
          }

          await saveWorkerHealth({
            status: 'DEGRADED',
            currentJobId: '',
            currentIssueId: '',
            lastFailedJobId: job.id,
            lastFailedAt:
              new Date().toISOString(),
            lastError: error.message,
            lastHeartbeatAt:
              new Date().toISOString()
          });
        } else {
          /*
           * Keep the summary available for another BullMQ
           * retry. The next attempt will set PROCESSING again.
           */
          await prisma.summary.update({
            where: {
              id: summaryId
            },

            data: {
              status: 'PENDING',
              progress: 0,
              errorMessage:
                `Attempt ${currentAttempt} failed: ${error.message}`,
              completedAt: null
            }
          });

          await incrementMetric(
            'jobsRetried'
          );

          logger.warn(
            'Summary job attempt failed and will be retried',
            {
              jobId: job.id,
              summaryId,
              issueId,
              attempt:
                currentAttempt,
              maximumAttempts,
              error:
                error.message
            }
          );

          await saveWorkerHealth({
            status: 'UP',
            currentJobId: '',
            currentIssueId: '',
            lastRetryJobId: job.id,
            lastRetryAt:
              new Date().toISOString(),
            lastError:
              error.message,
            lastHeartbeatAt:
              new Date().toISOString()
          });
        }

        /*
         * Critical: rethrow the error.
         *
         * BullMQ needs the rejected processor promise to
         * recognize failure and schedule the next retry.
         */
        throw error;
      }
    },

    {
      connection: redisConnection,

      /*
       * Two jobs may run concurrently in this worker process.
       * Adjust after load testing and monitoring.
       */
      concurrency: 2
    }
  );

  worker.on('ready', async () => {
    logger.info(
      'Summary worker is ready',
      {
        queueName: 'summary-queue',
        concurrency: 2
      }
    );

    await saveWorkerHealth({
      status: 'UP',
      workerName: 'summary-worker',
      readyAt: new Date().toISOString(),
      lastHeartbeatAt:
        new Date().toISOString()
    });
  });

  worker.on('active', (job) => {
    logger.info(
      'Summary job became active',
      {
        jobId: job.id,
        summaryId:
          job.data.summaryId,
        issueId:
          job.data.issueId,
        attempt:
          job.attemptsMade + 1
      }
    );
  });

  worker.on(
    'progress',
    (job, progress) => {
      logger.info(
        'Summary job progress updated',
        {
          jobId: job.id,
          summaryId:
            job.data.summaryId,
          issueId:
            job.data.issueId,
          progress
        }
      );
    }
  );

  worker.on(
    'completed',
    (job, result) => {
      logger.info(
        'Summary job completed event received',
        {
          jobId: job.id,
          summaryId:
            job.data.summaryId,
          issueId:
            job.data.issueId,
          result
        }
      );
    }
  );

  worker.on(
    'failed',
    (job, error) => {
      logger.error(
        'Summary job failed event received',
        {
          jobId:
            job ? job.id : null,
          summaryId:
            job
              ? job.data.summaryId
              : null,
          issueId:
            job
              ? job.data.issueId
              : null,
          attemptsMade:
            job
              ? job.attemptsMade
              : null,
          maximumAttempts:
            job
              ? job.opts.attempts || 1
              : null,
          error: error.message
        }
      );
    }
  );

  worker.on('stalled', (jobId) => {
    logger.warn(
      'Summary job stalled',
      {
        jobId
      }
    );
  });

  worker.on('error', async (error) => {
    logger.error(
      'Summary worker error',
      {
        error: error.message,
        stack: error.stack
      }
    );

    await incrementMetric(
      'workerErrors'
    );

    await saveWorkerHealth({
      status: 'DEGRADED',
      lastWorkerError:
        error.message,
      lastWorkerErrorAt:
        new Date().toISOString(),
      lastHeartbeatAt:
        new Date().toISOString()
    });
  });

  logger.info(
    'Summary worker process started',
    {
      queueName: 'summary-queue'
    }
  );
};

/*
 * Graceful shutdown prevents the worker from abruptly
 * abandoning an active job when the process receives
 * Ctrl+C or a container termination signal.
 */
const shutdown = async (signal) => {
  logger.info(
    'Summary worker shutdown started',
    {
      signal
    }
  );

  if (healthHeartbeat) {
    clearInterval(healthHeartbeat);
  }

  try {
    await saveWorkerHealth({
      status: 'DOWN',
      currentJobId: '',
      currentIssueId: '',
      stoppedAt:
        new Date().toISOString()
    });

    if (worker) {
      await worker.close();
    }

    await deadLetterQueue.close();

    await prisma.$disconnect();

    if (redisClient.isOpen) {
      await redisClient.quit();
    }

    logger.info(
      'Summary worker shutdown completed',
      {
        signal
      }
    );

    process.exit(0);
  } catch (error) {
    logger.error(
      'Summary worker shutdown failed',
      {
        signal,
        error: error.message,
        stack: error.stack
      }
    );

    process.exit(1);
  }
};

process.on(
  'SIGINT',
  () => shutdown('SIGINT')
);

process.on(
  'SIGTERM',
  () => shutdown('SIGTERM')
);

process.on(
  'unhandledRejection',
  (reason) => {
    logger.error(
      'Unhandled promise rejection in summary worker',
      {
        error:
          reason instanceof Error
            ? reason.message
            : String(reason),

        stack:
          reason instanceof Error
            ? reason.stack
            : ''
      }
    );
  }
);

process.on(
  'uncaughtException',
  async (error) => {
    logger.error(
      'Uncaught exception in summary worker',
      {
        error: error.message,
        stack: error.stack
      }
    );

    await shutdown(
      'UNCAUGHT_EXCEPTION'
    );
  }
);

startWorker().catch((error) => {
  logger.error(
    'Unable to start summary worker',
    {
      error: error.message,
      stack: error.stack
    }
  );

  process.exit(1);
});