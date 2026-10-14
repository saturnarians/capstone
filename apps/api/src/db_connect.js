const express = require('express');
const mongoose = require('mongoose');

function createDbConnectRouter({ connection = mongoose.connection, logger = console } = {}) {
  const router = express.Router();

  router.get('/', async (req, res) => {
    if (connection.readyState !== 1 || !connection.db) {
      return res.status(503).json({
        error: { code: 'DATABASE_UNAVAILABLE', message: 'Database is unavailable.' },
      });
    }

    try {
      await connection.db.admin().command({ ping: 1 });
      return res.json({ data: { status: 'connected' } });
    } catch (error) {
      logger.error({ event: 'database_health_check_failed', name: error?.name || 'Error' });
      return res.status(503).json({
        error: { code: 'DATABASE_UNAVAILABLE', message: 'Database is unavailable.' },
      });
    }
  });

  return router;
}

module.exports = { createDbConnectRouter };
