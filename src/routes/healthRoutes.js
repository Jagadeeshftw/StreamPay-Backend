'use strict';

const { Router } = require('express');
const healthController = require('../controllers/healthController');

const router = Router();

router.get('/health', healthController.health);
router.get('/health/live', healthController.live);
router.get('/health/ready', healthController.ready);
router.get('/version', healthController.version);

module.exports = router;
