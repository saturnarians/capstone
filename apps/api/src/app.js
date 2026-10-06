const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const { createAuth } = require('./auth');
const { createCrmRouter } = require('./crm');
const { createStaffRouter } = require('./staff');
const { ApiError, errorHandler } = require('./errors');

function createApp(config, { logger = console } = {}) {
  const app = express();
  app.locals.logger = logger;
  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy);
  app.use(helmet());
  app.use(cors({ origin(origin, callback) {
    if (!origin || config.origins.includes(origin)) return callback(null, true);
    callback(new ApiError(403, 'ORIGIN_NOT_ALLOWED', 'This origin is not allowed.'));
  } }));
  app.use(express.json({ limit: '32kb' }));
  app.get('/api/health', (req, res) => res.json({ data: { status: 'OK' } }));
  app.use('/api/v1', (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  const auth = createAuth(config);
  app.use('/api/v1/auth', rateLimit({
    windowMs: 15 * 60 * 1000, limit: config.authRateLimit,
    standardHeaders: 'draft-8', legacyHeaders: false,
    skip: req => !/^\/(register|login|refresh)\/?$/i.test(req.path),
    handler: (req, res) => res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Too many authentication attempts. Please try again later.' } }),
  }), auth.router);
  app.use('/api/v1', auth.protect, createCrmRouter({ requireAdmin: auth.requireAdmin }));
  app.use('/api/v1', auth.protect, createStaffRouter({ requireAdmin: auth.requireAdmin, config }));
  app.use((req, res, next) => next(new ApiError(404, 'ROUTE_NOT_FOUND', 'Route not found.')));
  app.use(errorHandler);
  return app;
}
module.exports = { createApp };
