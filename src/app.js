const express = require("express");
const routes = require("./routes");
const logger = require("./middleware/logger");
const errorHandler = require("./middleware/errorHandler");
const AppError = require("./utils/AppError");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");

const app = express();

// Middleware
app.use(express.json({ limit: "10kb" }));
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
