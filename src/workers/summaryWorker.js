const { Worker } =
    require('bullmq');

const prisma =
    require('../config/prisma');

const {
    redisConnection
} =
    require('../config/redis');

const generateHeuristicSummary =
    (issue) => {

        const allLines =
            issue.logs.flatMap(log =>
                log.rawText.split('\n')
            );

        const errorLines =
            allLines.filter(line => {

                const lower =
                    line.toLowerCase();

                return (
                    lower.includes('error') ||
                    lower.includes('exception') ||
                    lower.includes('failed')
                );
            });

        const topErrors =
            errorLines.slice(0, 5);

        return {

            totalLines:
                allLines.length,

            totalErrors:
                errorLines.length,

            topErrors
        };
    };


const worker =
    new Worker(

        'summary-queue',

        async (job) => {

            const {
                summaryId,
                issueId
            } = job.data;

            await prisma.summary.update({
                where: {
                    id: summaryId
                },

                data: {
                    status: 'PROCESSING',
                    progress: 10
                }
            });


            try {

                const issue =
                    await prisma.issue.findUnique({

                        where: {
                            id: issueId
                        },

                        include: {
                            logs: true,
                            tags: true
                        }
                    });

                await prisma.summary.update({
                    where: {
                        id: summaryId
                    },

                    data: {
                        progress: 30
                    }
                });

                const result = generateHeuristicSummary(issue);

                await prisma.summary.update({
                    where: {
                        id: summaryId
                    },

                    data: {
                        progress: 60
                    }
                });

                const summaryText = `
const summaryText = 
Issue Summary

                Issue:
${issue.title}

                Status:
${issue.status}

                Severity:
${issue.severity}

Total Log Lines:
${result.totalLines}

Error Count:
${result.totalErrors}

Top Error Lines:

${result.topErrors.join('\n')}
                `;

                await prisma.summary.update({

                    where: {
                        id: summaryId
                    },

                    data: {

                        status:
                            'COMPLETED',
                        progress: 
                            100,
                        content:
                            summaryText,

                        completedAt:
                            new Date()
                    }
                });

            } catch (err) {

                await prisma.summary.update({

                    where: {
                        id: summaryId
                    },

                    data: {

                        status:
                            'FAILED',

                        errorMessage:
                            err.message
                    }
                });

                throw err;
            }
        },

        {
            connection:
                redisConnection
        }
    );

worker.on(
    'completed',
    (job) => {

        console.log(
            `Summary Job ${job.id} completed`
        );
    }
);

worker.on(
    'failed',
    (job, err) => {

        console.log(
            `Summary Job ${job.id} failed`
        );
    }
);