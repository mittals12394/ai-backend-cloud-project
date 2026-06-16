// Health check endpoint
const getHealth = (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Server is healthy",
  });
};

// Version endpoint
const getVersion = (req, res) => {
  res.status(200).json({
    version: "1.0.0",
    service: "AI Backend Project",
  });
};

module.exports = {
  getHealth,
  getVersion,
};
