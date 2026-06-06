const logger = require('../utils/logger');

function errorHandler(err, req, res, next) { // eslint-disable-line
  const status = err.status || 500;
  const safe = {
    message: err.message || 'Internal Server Error',
  };

  logger.error(err);

  if (process.env.NODE_ENV === 'production' && status === 500) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }

  res.status(status).json({ error: safe.message, details: err.details || undefined });
}

module.exports = errorHandler;
