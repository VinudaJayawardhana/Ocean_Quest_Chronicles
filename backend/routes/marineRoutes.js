/**
 * Ocean Quest Chronicles Project (see docs/references.md)
 * File: backend/routes/marineRoutes.js
 * Description: Dedicated route for Marine Weather & Telemetry API.
 * Completely separate from puzzle/fish API routes for modularity and low coupling.
 */
const express = require('express');
const router = express.Router();
const marineController = require('../controllers/marineController');

// GET /api/marine/telemetry
router.get('/telemetry', marineController.getMarineTelemetry);

module.exports = router;
