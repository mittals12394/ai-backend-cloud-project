const { z } = require('zod');

const createIssueSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().optional(),
    userId: z.number(),
    status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional()
});

const listIssuesQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),

    limit: z.coerce.number().int().positive().max(100).default(10),

    status: z.enum([
        'OPEN',
        'IN_PROGRESS',
        'RESOLVED',
        'CLOSED'
    ]).optional(),

    severity: z.enum([
        'LOW',
        'MEDIUM',
        'HIGH',
        'CRITICAL'
    ]).optional(),

    keyword: z.string().optional(),

    startDate: z.string().optional(),

    endDate: z.string().optional(),

    sortBy: z.enum([
        'id',
        'title',
        'createdAt',
        'status',
        'severity'
    ]).default('createdAt'),

    sortOrder: z.enum([
        'asc',
        'desc'
    ]).default('desc')
});
const idParamSchema = z.object({
    id: z.coerce.number().int().positive()
});

const updateIssueSchema = z.object({
    title: z.string().min(3).optional(),
    description: z.string().optional(),
    status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional()
}).refine(
    (data) => Object.keys(data).length > 0,
    { message: 'At least one field must be provided for update' }
);

module.exports = {
    createIssueSchema,
    listIssuesQuerySchema,
    idParamSchema,
    updateIssueSchema
};