const logger =
  require('../utils/logger');

const requestLogger = (
  req,
  res,
  next
) => {

  const start = Date.now();

  res.on(
    'finish',
    () => {

      logger.info(
        'Request completed',
        {
          method:
            req.method,

          path:
            req.originalUrl,

          statusCode:
            res.statusCode,

          duration:
            `${Date.now()-start}ms`
        }
      );
    }
  );

  next();
};

module.exports =
  requestLogger;