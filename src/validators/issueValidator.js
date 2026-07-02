const { z } = require('zod');

const createIssueSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  userId: z.number()
});

module.exports = {
  createIssueSchema
};