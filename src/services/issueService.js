const prisma = require('../config/prisma');
const { where } = require('../models/User');

const createIssue = async (data) => {
    const user = await prisma.user.findUnique({
        where: {
            id: data.userId
        }
    });

    if (!user) {
        const error = new Error('User not found');
        error.status = 404;
        throw error;
    }

    return await prisma.issue.create({
        data: {
            title: data.title,
            description: data.description,
            userId: data.userId,
            status: data.status,
            severity: data.severity
        }
    });
};

const getIssues = async (query) => {
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

    return {
        issues,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
};

const getIssueById = async (id) => {

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

    return issue;

};

const updateIssue = async (id, data) => {
    const existing = await prisma.issue.findUnique({
        where: { id }
    });

    if (!existing) {
        const error = new Error('Issue not found!');
        error.status = 404;

        throw error;
    }

    if (existing.status === 'CLOSED') {
        const error = new Error('Cannot update a CLOSED issue');
        error.status = 409;

        throw error;
    }

    return await prisma.issue.update({
        where: { id },
        data
    });


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

    return { message: 'Issue deleted successfully' };
};

module.exports = {
    createIssue,
    getIssues,
    getIssueById,
    updateIssue,
    deleteIssue
};