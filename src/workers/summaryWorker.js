const { Worker } =
    require('bullmq');

const prisma =
    require('../config/prisma');

const {
    redisConnection
} =
    require('../config/redis');


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
                    status:
                        'PROCESSING'
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

                const summaryText = `
Issue Title:
${issue.title}

Description:
${issue.description}

Status:
${issue.status}

Severity:
${issue.severity}

Log Count:
${issue.logs.length}

Tags:
${issue.tags
                        .map(t => t.name)
                        .join(', ')}
`;

                await prisma.summary.update({

                    where: {
                        id: summaryId
                    },

                    data: {

                        status:
                            'COMPLETED',

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