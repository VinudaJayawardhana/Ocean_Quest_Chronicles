/**
 * Ocean Quest Chronicles — CIS045-3 Distributed Service Architectures
 * File: backend/routes/profileRoutes.js
 * Description: /api/profile - mounted behind authMiddleware in server.js.
 */
const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');

router.get('/', profileController.getProfile);
router.put('/', profileController.updateProfile);
router.post('/progress', profileController.saveProgress);
router.post('/daily-challenge', profileController.recordDailyChallenge);

module.exports = router;
