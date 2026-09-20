const { z } = require('zod');

const createTagSchema = z.object({
    name: z.string().min(2).max(50)
});

module.exports = {
    createTagSchema
};