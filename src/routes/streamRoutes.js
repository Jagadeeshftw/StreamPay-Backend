'use strict';

const { Router } = require('express');
const streamController = require('../controllers/streamController');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { validateCreateStream } = require('../validators/streamValidators');

const router = Router();

router.post('/streams', validate(validateCreateStream), asyncHandler(streamController.create));
router.get('/streams', streamController.list);
router.get('/streams/:id', streamController.getById);
router.post('/streams/:id/withdraw', asyncHandler(streamController.withdraw));
router.post('/streams/:id/cancel', asyncHandler(streamController.cancel));

module.exports = router;
