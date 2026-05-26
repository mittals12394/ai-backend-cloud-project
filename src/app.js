const express = require('express');
const routes = require('./routes');

const app = express();

// Middleware
app.use(express.json());

app.use('/api', routes);



// Test route
app.get('/', (req, res) => {
  res.send('API is running');
});

module.exports = app;