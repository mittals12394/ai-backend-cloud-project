const express = require("express");
const routes = require("./routes");
const logger = require("./middleware/logger");
const errorHandler = require("./middleware/errorHandler");
const AppError = require("./utils/AppError");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require('express-rate-limit');

const app = express();

const limiter = rateLimit({

  windowMs: 15 * 60 * 1000,

  max: 100,

  message: {
    success: false,
    message:
      'Too many requests. Please try again later.'
  }

});

// Middleware
app.use(express.json({ limit: "10kb" }));
app.use(helmet());
app.use(
  cors({
    origin: [
      'http://localhost:3000'
    ],

    methods: [
      'GET',
      'POST',
      'PUT',
      'DELETE'
    ],

    credentials: true
  })
);
app.use(limiter);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(logger);
app.use("/api", routes);
app.use("/api/v2", routes);

app.use((req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

app.use(errorHandler);

// Test route
app.get("/", (req, res) => {
  res.send("API is running");
});

module.exports = app;
