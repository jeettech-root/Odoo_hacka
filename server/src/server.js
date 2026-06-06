const dotenv = require('dotenv');
dotenv.config();

const app = require('./app');
const config = require('./config');
const connectDB = require('./db');
const db = require('./db');
const logger = require('./utils/logger');

const PORT = config.PORT || 3000;

async function start() {
  try {
    await connectDB();
    const server = app.listen(PORT, () => {
      logger.info(`Server listening on port ${PORT}`);
    });

    const graceful = async () => {
      logger.info('Shutting down...');
      try {
        server.close(() => logger.info('HTTP server closed'));
        if (db && typeof db.disconnect === 'function') {
          await db.disconnect();
          logger.info('MongoDB disconnected');
        }
      } catch (err) {
        logger.error('Error during graceful shutdown', err);
      } finally {
        process.exit(0);
      }
    };

    process.on('SIGTERM', graceful);
    process.on('SIGINT', graceful);

    process.on('unhandledRejection', (reason, p) => {
      logger.error('Unhandled Rejection at Promise', { reason, promise: p });
    });

    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception thrown', err);
      // it's unsafe to continue running
      process.exit(1);
    });
  } catch (err) {
    logger.error('Failed to start server', err);
    process.exit(1);
  }
}

start();
