'use strict';

const { Router } = require('express');
const analyticsController = require('../controllers/analyticsController');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();

router.get('/balances', asyncHandler(analyticsController.balances));
router.get('/withdrawable', asyncHandler(analyticsController.withdrawable));
router.get('/analytics', asyncHandler(analyticsController.analytics));

module.exports = router;
