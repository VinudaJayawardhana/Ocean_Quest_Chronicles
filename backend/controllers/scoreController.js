/**
 * Source/AI-generated: Ocean Quest Chronicles Project (see docs/references.md)
 * File: backend/controllers/scoreController.js
 * Description: Leaderboard read + verified score save.
 * VIRTUAL IDENTITY: userId/username come from the session, never from the request body.
 * SECURITY: The score is computed by runService from answers the server itself verified.
 */
const db = require('../config/db');
const runService = require('../services/runService');

// GET /api/leaderboard  or  GET /api/scores (supports optional ?level=1|2|3)
exports.getLeaderboard = async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 50);
    const levelQuery = req.query.level ? parseInt(req.query.level, 10) : null;

    let sql = `SELECT id, userId, username, score, depthReached, chestsCollected, country, level, createdAt FROM scores`;
    const params = [];

    if (levelQuery && levelQuery >= 1 && levelQuery <= 3) {
      // Filter by level with backwards-compatible depth threshold fallback
      sql += ` WHERE (level = ? OR (level IS NULL AND (CASE WHEN ? = 3 THEN depthReached >= 280 WHEN ? = 2 THEN (depthReached >= 140 AND depthReached < 280) ELSE depthReached < 140 END)))`;
      params.push(levelQuery, levelQuery, levelQuery);
    }

    sql += ` ORDER BY score DESC, depthReached DESC LIMIT ?`;
    params.push(limit);

    const rows = await db.queryAll(sql, params);
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
      `INSERT INTO scores (userId, username, score, depthReached, chestsCollected, country, level)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.session.userId, req.session.username, result.score, result.depthReached, result.chestsCollected, country, result.level || 1]
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
