const prisma = require("../config/prisma");
const {
  invalidateIssueCache
} = require('./issueCacheService');

const createLog = async (issueId, data) => {
    const issue = await prisma.issue.findUnique({
        where: {
            id: issueId
        }
    });

    if(!issue){
        const error = new Error("Issue not found!");
        error.status = 404;

        throw error;
    }

    const log = await prisma.logEntry.create({
        data: {
            issueId,
            rawText: data.rawText,
            source: data.source
        }
    });

    await invalidateIssueCache(issueId);

    return log;
};

module.exports = {
    createLog
};