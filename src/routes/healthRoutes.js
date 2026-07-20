'use strict';

const { Router } = require('express');
const healthController = require('../controllers/healthController');
const methodNotAllowed = require('../middleware/methodNotAllowed');

const router = Router();

router.route('/health')
  .get(healthController.health)
  .all(methodNotAllowed);

router.route('/health/live')
  .get(healthController.live)
  .all(methodNotAllowed);

router.route('/health/ready')
  .get(healthController.ready)
  .all(methodNotAllowed);

router.route('/version')
  .get(healthController.version)
  .all(methodNotAllowed);

module.exports = router;
