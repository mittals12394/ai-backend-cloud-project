const validate =
  (schema, source = "body") =>
  (req, res, next) => {
    try {
      schema.parse(req[source]);
      next();
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: err.errors?.[0]?.message || "Validation error",
      });
    }
  };

module.exports = validate;
