'use strict';

const { Router } = require('express');
const analyticsController = require('../controllers/analyticsController');
const asyncHandler = require('../utils/asyncHandler');
const methodNotAllowed = require('../middleware/methodNotAllowed');

const router = Router();

router.route('/balances')
  .get(asyncHandler(analyticsController.balances))
  .all(methodNotAllowed);

router.route('/withdrawable')
  .get(asyncHandler(analyticsController.withdrawable))
  .all(methodNotAllowed);

router.route('/analytics')
  .get(asyncHandler(analyticsController.analytics))
  .all(methodNotAllowed);

module.exports = router;
