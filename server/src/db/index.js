const mongoose = require('mongoose');
const config = require('../config');
const logger = require('../utils/logger');

mongoose.set('strictQuery', false);

let isConnected = false;

async function connect(retries = 5, delay = 2000) {
  if (isConnected) return mongoose.connection;
  const uri = config.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is not configured');
  }

  const opts = {
    autoIndex: process.env.NODE_ENV !== 'production',
    maxPoolSize: process.env.MONGO_MAX_POOL_SIZE ? parseInt(process.env.MONGO_MAX_POOL_SIZE, 10) : 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    family: 4,
    useNewUrlParser: true,
    useUnifiedTopology: true
  };

  try {
    logger.info('Connecting to MongoDB...');
    await mongoose.connect(uri, opts);
    isConnected = true;
    mongoose.connection.on('connected', () => logger.info('MongoDB connected'));
    mongoose.connection.on('error', (err) => logger.error('MongoDB error', err));
    mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
    return mongoose.connection;
  } catch (err) {
    logger.error(`MongoDB connection attempt failed: ${err.message}`);
    if (retries > 0) {
      logger.info(`Retrying MongoDB connection in ${delay}ms... (${retries} attempts left)`);
      await new Promise((res) => setTimeout(res, delay));
      return connect(retries - 1, Math.min(delay * 2, 30000));
    }
    throw err;
  }
}

async function disconnect() {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
}

module.exports = connect;
module.exports.disconnect = disconnect;
