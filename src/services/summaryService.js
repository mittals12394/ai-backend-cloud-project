const prisma = require('../config/prisma');

const summaryQueue =
    require('../queues/summaryQueue');

const requestSummary = async (issueId, userId) => {
    const issue = await prisma.issue.findUnique({
        where: { id: issueId }
    });

    if (!issue) {
        const error = new Error("Issue not found");
        error.status = 404;

        throw error;
    }

    const existingSummary = await prisma.summary.findUnique({
        where: { issueId: issueId }
    });

    if (existingSummary && (existingSummary.status === "PENDING" || existingSummary.status === "PROCESSING")) {
        const error = new Error("Summary already running");
        error.status = 409;

        throw error;
    }

    const summary = await prisma.summary.upsert({
        where: { issueId },
        create: {
            issueId,
            requestedBy: userId,
            status: "PENDING"
        },
        update: {
            status: "PENDING",
            content: null,
            errorMessage: null,
            completedAt: null
        }
    });

    await summaryQueue.add(
        "generate-summary",
        {
            summaryId: summary.id,
            issueId
        },
        {
            attempts: 3
        }
    );

    return summary;
};

const getSummary = async (issueId) => {

    const summary = await prisma.summary.findUnique({
        where: { issueId }
    });

    if (!summary) {
        return {
            issueId,
            status: "NOT_REQUESTED"
        };
    }

    return summary;

}

module.exports = {
    requestSummary,
    getSummary
}