const express = require('express');
const routes = require('./routes');
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/AppError');

const app = express();

// Middleware
app.use(express.json());
app.use(logger);
app.use('/api', routes);

app.use((req, res, next) => {
    next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

app.use(errorHandler);

// Test route
app.get('/', (req, res) => {
  res.send('API is running');
});

module.exports = app;