const prisma = require('../config/prisma');

const cacheService = require('./cacheService');

const {
    issueDetailKey,
    issueListKey
} = require('../utils/cacheKeys');

const {
    invalidateIssueLists,
    invalidateIssueCache,
    invalidateIssueDetail
} = require('./issueCacheService');
const { canModifyIssue } = require("../utils/permissions");

const ISSUES_LIST_CACHE_TTL = Number(
    process.env.ISSUES_LIST_CACHE_TTL || 60
);

const ISSUE_DETAIL_CACHE_TTL = Number(
    process.env.ISSUE_DETAIL_CACHE_TTL || 300
);

const createIssue = async (
    data,
    authenticatedUserId
) => {

    const user = await prisma.user.findUnique({
        where: {
            id: authenticatedUserId
        }
    });

    if (!user) {
        const error = new Error('User not found');
        error.status = 404;
        throw error;
    }



    const issue = await prisma.$transaction(async (tx) => {

        const newIssue = await tx.issue.create({
            data: {
                title: data.title,
                description: data.description,

                userId: authenticatedUserId,

                createdById: authenticatedUserId,

                status: data.status,
                severity: data.severity
            }
        });

        await tx.auditLog.create({
            data: {
                entityType: 'Issue',

                entityId: newIssue.id,

                action: 'CREATE',

                userId: authenticatedUserId
            }
        });

        return newIssue;
    });

    await invalidateIssueLists();

    return issue;
};

const getIssues = async (query) => {

    const cacheKey = issueListKey(query);

    const cachedResult = await cacheService.getJson(cacheKey);

    if (cachedResult) {
        return cachedResult;
    }

    const {
        page,
        limit,
        status,
        severity,
        keyword,
        startDate,
        endDate,
        sortBy,
        sortOrder
    } = query;

    const skip = (page - 1) * limit;

    const where = {};

    if (status) {
        where.status = status;
    }

    if (severity) {
        where.severity = severity;
    }

    if (keyword) {
        where.OR = [
            {
                title: {
                    contains: keyword,
                    mode: 'insensitive'
                }
            },
            {
                description: {
                    contains: keyword,
                    mode: 'insensitive'
                }
            }
        ];
    }

    if (startDate || endDate) {
        where.createdAt = {};

        if (startDate) {
            where.createdAt.gte = new Date(startDate);
        }

        if (endDate) {
            where.createdAt.lte = new Date(endDate);
        }
    }

    const [issues, total] = await prisma.$transaction([
        prisma.issue.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
                [sortBy]: sortOrder
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        }),

        prisma.issue.count({
            where
        })
    ]);

    const result = {
        issues,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };

    await cacheService.setJson(cacheKey, result, ISSUES_LIST_CACHE_TTL);

    return result;
};

const getIssueById = async (id) => {

    const cacheKey = issueDetailKey(id);

    const cachedResult = await cacheService.getJson(cacheKey);

    if (cachedResult) { 
        return cachedResult; 
    }

    const issue = await prisma.issue.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            },
            logs: true,
            tags: true
        }
    });

    if (!issue) {
        const error = new Error('Issue not found!');
        error.status = 404;

        throw error;
    }

    await cacheService.setJson(cacheKey, issue, ISSUE_DETAIL_CACHE_TTL);

    return issue;

};

const updateIssue = async (id, data, user) => {
    const existing = await prisma.issue.findUnique({
        where: { id }
    });

    if (!existing) {
        const error = new Error('Issue not found!');
        error.status = 404;

        throw error;
    }

    if (!canModifyIssue(user, existing)) {
        const error = new Error("Access denied!");
        error.status = 403;

        throw error;
    }

    if (existing.status === 'CLOSED') {
        const error = new Error('Cannot update a CLOSED issue');
        error.status = 409;

        throw error;
    }

    const issue = await prisma.$transaction(async (tx) => {

        const updatedIssue = await tx.issue.update({
            where: { id },
            data: {
                ...data,
                updatedById: user.id
            }
        });

        await tx.auditLog.create({
            data: {
                entityType: 'Issue',
                entityId: id,
                action: 'UPDATE',
                userId: user.id
            }
        });

        return updatedIssue;
    });

    await invalidateIssueCache(id);

    return issue;


};

const deleteIssue = async (id) => {
    const issue = await prisma.issue.findUnique({
        where: { id }
    });

    if (!issue) {
        const error = new Error('Issue not found!');
        error.status = 404;

        throw error;
    }


    await prisma.issue.delete({
        where: { id }
    });

    await prisma.auditLog.create({
        data: {
            entityType: 'Issue',
            entityId: id,
            action: 'DELETE',
            userId: user.userId
        }
    });

    await invalidateIssueCache(id);

    return { message: 'Issue deleted successfully' };
};

module.exports = {
    createIssue,
    getIssues,
    getIssueById,
    updateIssue,
    deleteIssue
};