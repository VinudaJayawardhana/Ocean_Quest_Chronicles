/**
 * Source/AI-generated: Ocean Quest Chronicles Project (see docs/references.md)
 * File: backend/routes/puzzleRoutes.js
 * Description: /api/puzzle/* - mounted behind authMiddleware in server.js.
 */
const express = require('express');
const router = express.Router();
const puzzleController = require('../controllers/puzzleController');

router.post('/run', puzzleController.startRun);
router.get('/new', puzzleController.newPuzzle);
router.post('/answer', puzzleController.answer);

module.exports = router;
