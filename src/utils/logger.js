const log = (
  level,
  message,
  metadata = {}
) => {

  const payload = {
    timestamp:
      new Date().toISOString(),

    level,

    message,

    ...metadata
  };

  console.log(
    JSON.stringify(payload)
  );
};

module.exports = {

  info: (message, metadata) =>
    log(
      'INFO',
      message,
      metadata
    ),

  warn: (message, metadata) =>
    log(
      'WARN',
      message,
      metadata
    ),

  error: (message, metadata) =>
    log(
      'ERROR',
      message,
      metadata
    )
};
