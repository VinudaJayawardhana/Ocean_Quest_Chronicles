/**
 * Source/AI-generated: Ocean Quest Chronicles Project (see docs/references.md)
 * File: backend/routes/scoreRoutes.js
 * Description: Leaderboard (public) and score submission (logged-in pilots only).
 */
const express = require('express');
const router = express.Router();
const scoreController = require('../controllers/scoreController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', scoreController.getLeaderboard);
router.post('/', authMiddleware, scoreController.saveScore);

module.exports = router;
