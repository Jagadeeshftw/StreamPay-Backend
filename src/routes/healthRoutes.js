'use strict';

const { Router } = require('express');
const healthController = require('../controllers/healthController');

const router = Router();

router.get('/health', healthController.health);
router.get('/version', healthController.version);

module.exports = router;
