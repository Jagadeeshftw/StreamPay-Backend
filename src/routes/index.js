'use strict';

const { Router } = require('express');
const healthRoutes = require('./healthRoutes');
const streamRoutes = require('./streamRoutes');
const analyticsRoutes = require('./analyticsRoutes');

const router = Router();

/**
 * Aggregate all feature routers under the /api namespace.
 */
router.use('/', healthRoutes);
router.use('/', streamRoutes);
router.use('/', analyticsRoutes);

module.exports = router;
