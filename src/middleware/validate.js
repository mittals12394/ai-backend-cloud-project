const validate = (schema, source = 'body') => (req, res, next) => {
  try {
    const parsedData = schema.parse(req[source]);

    if (source === 'query') {
      req.validatedQuery = parsedData;
    } else if (source === 'params') {
      req.validatedParams = parsedData;
    } else {
      req.body = parsedData;
    }

    next();
  } catch (err) {
  console.log(err);

  return res.status(400).json({
    success: false,
    message: err.issues?.[0]?.message || err.message,
    issues: err.issues
  });
}
};

module.exports = validate;