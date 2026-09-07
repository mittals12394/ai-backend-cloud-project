// eslint-disable-next-line no-unused-vars
const errorHandler = (
  err,
  req,
  res,
  next
) => {

  console.log(err);
  
  const status =
    err.status || 500;

  const message =
    status === 500
      ? 'Internal server error'
      : err.message;

  res.status(status).json({
    success: false,
    message
  });

};

module.exports = errorHandler;
