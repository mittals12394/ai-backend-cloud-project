const { z } = require('zod');

const summaryParamsSchema =
  z.object({

    issueId:
      z.coerce
       .number()
       .int()
       .positive()
  });

module.exports = {
  summaryParamsSchema
};