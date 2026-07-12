const prisma = require('../config/prisma');

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

module.exports = {
    createIssue,
    getIssues
};