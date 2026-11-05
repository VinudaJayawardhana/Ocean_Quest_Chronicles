/**
 * Ocean Quest Chronicles Project (see docs/references.md)
 * File: backend/routes/profileRoutes.js
 * Description: /api/profile - mounted behind authMiddleware in server.js.
 */
const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');

router.get('/', profileController.getProfile);
router.put('/', profileController.updateProfile);

module.exports = router;
