/**
 * Source/AI-generated: Ocean Quest Chronicles Project (see docs/references.md)
 * File: backend/controllers/scoreController.js
 * Description: Leaderboard read + verified score save.
 * VIRTUAL IDENTITY: userId/username come from the session, never from the request body.
 * SECURITY: The score is computed by runService from answers the server itself verified.
 */
const db = require('../config/db');
const runService = require('../services/runService');

// GET /api/leaderboard  or  GET /api/scores
exports.getLeaderboard = async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const rows = await db.queryAll(
      `SELECT id, userId, username, score, depthReached, chestsCollected, country, createdAt
       FROM scores ORDER BY score DESC, depthReached DESC LIMIT ?`,
      [limit]
    );
    res.status(200).json(rows);
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: 'Failed to retrieve leaderboard.' });
  }
};

// POST /api/scores  { depthReached, explorationScore }
exports.saveScore = async (req, res) => {
  try {
    const result = runService.finish(req.session, req.body || {});
    if (!result) {
      return res.status(409).json({ error: 'There is no open dive to submit.' });
    }
    const user = await db.queryGet('SELECT country FROM users WHERE id = ?', [req.session.userId]);
    const country = user ? user.country : 'Unknown';

    const saved = await db.queryRun(
      `INSERT INTO scores (userId, username, score, depthReached, chestsCollected, country)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.session.userId, req.session.username, result.score, result.depthReached, result.chestsCollected, country]
    );
    res.status(201).json({
      message: 'Score recorded successfully.',
      score: { id: saved.id, username: req.session.username, ...result, country }
    });
  } catch (err) {
    console.error('Save score error:', err);
    res.status(500).json({ error: 'Failed to save score.' });
  }
};
