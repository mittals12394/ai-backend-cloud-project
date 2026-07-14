const { z } = require('zod');

const createLogSchema = z.object({
  rawText: z.string().min(1),
  source: z.string().min(1)
});

module.exports = {
  createLogSchema
};
