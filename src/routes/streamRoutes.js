'use strict';

const { Router } = require('express');
const streamController = require('../controllers/streamController');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { validateCreateStream, validateWithdraw } = require('../validators/streamValidators');

const router = Router();

// Guard the :id param so obviously malformed ids short-circuit to a 400.
router.param('id', (req, res, next, id) => {
  if (typeof id !== 'string' || !id.startsWith('stream_')) {
    return next(ApiError.badRequest('Invalid stream id'));
  }
  next();
});

router.post('/streams', validate(validateCreateStream), asyncHandler(streamController.create));
router.get('/streams', streamController.list);
router.get('/streams/:id', streamController.getById);
router.post('/streams/:id/withdraw', validate(validateWithdraw), asyncHandler(streamController.withdraw));
router.post('/streams/:id/cancel', asyncHandler(streamController.cancel));

module.exports = router;
