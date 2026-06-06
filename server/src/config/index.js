const dotenv = require('dotenv');
dotenv.config();

const get = (key, fallback) => process.env[key] || fallback;

const config = {
  PORT: parseInt(get('PORT', 3000), 10),
  NODE_ENV: get('NODE_ENV', 'development'),
  MONGO_URI: get('MONGO_URI', 'mongodb://localhost:27017/vendorbridge'),
  JWT_SECRET: get('JWT_SECRET'),
  JWT_EXPIRES_IN: get('JWT_EXPIRES_IN', '15m'),
  JWT_REFRESH_SECRET: get('JWT_REFRESH_SECRET'),
  REFRESH_TOKEN_EXPIRES_IN: get('REFRESH_TOKEN_EXPIRES_IN', '7d'),
  CORS_ORIGIN: get('VITE_API_BASE_URL', '*'),
  STORAGE_PROVIDER: get('STORAGE_PROVIDER', 'local'),
  STORAGE_LOCAL_PATH: get('STORAGE_LOCAL_PATH', './uploads'),
  REDIS_URL: get('REDIS_URL'),
};

if (!config.JWT_SECRET) {
  // In production this should fail fast
  if (config.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is required in production');
  }
}

module.exports = config;
