require('dotenv').config();

const app = require('./src/app');
const connectDB = require('./src/config/db');

const {
  connectRedis,
  disconnectRedis
} = require('./src/config/redis');

const PORT = process.env.PORT || 5000;

let server;

const startServer = async () => {
  try {

    await connectDB();

    await connectRedis();

    server = app.listen(PORT, () => {
      console.log(
        `Server running on port ${PORT}`
      );
    });

  } catch (error) {

    console.error(
      'Failed to start server:',
      error
    );

    process.exit(1);
  }
};

const shutdown = async (signal) => {

  console.log(
    `${signal} received. Shutting down...`
  );

  if (server) {

    server.close(async () => {

      try {

        await disconnectRedis();

        process.exit(0);

      } catch (error) {

        console.error(
          'Shutdown error:',
          error
        );

        process.exit(1);
      }
    });
  }
};

process.on(
  'SIGINT',
  () => shutdown('SIGINT')
);

process.on(
  'SIGTERM',
  () => shutdown('SIGTERM')
);

startServer();