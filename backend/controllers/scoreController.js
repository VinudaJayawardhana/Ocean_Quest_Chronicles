/**
 * Ocean Quest Chronicles — CIS045-3 Distributed Service Architectures
 * File: backend/controllers/scoreController.js
 * Description: Leaderboard read + verified score save.
 * VIRTUAL IDENTITY: userId/username come from the session, never from the request body.
 * SECURITY: The score is computed by runService from answers the server itself verified.
 */
const db = require('../config/db');
const runService = require('../services/runService');

// GET /api/leaderboard  or  GET /api/scores (supports optional ?level=1|2|3 and ?mode=best|cumulative)
// High Cohesion / Virtual Identity: 1 distinct row per pilot call-sign with personal best or cumulative career XP
exports.getLeaderboard = async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 50);
    const levelQuery = req.query.level ? parseInt(req.query.level, 10) : null;
    const mode = req.query.mode === 'cumulative' ? 'cumulative' : 'best';

    let sql;
    const params = [];

    if (mode === 'cumulative') {
      sql = `
        SELECT 
          MIN(id) AS id, 
          userId, 
          username, 
          SUM(score) AS score, 
          MAX(depthReached) AS depthReached, 
          SUM(chestsCollected) AS chestsCollected, 
          country, 
          MAX(level) AS level, 
          MAX(createdAt) AS createdAt,
          COUNT(*) AS totalDives
        FROM scores
        WHERE (level >= 1 OR level IS NULL)
      `;
      if (levelQuery && levelQuery >= 1 && levelQuery <= 3) {
        sql += ` AND (level = ? OR (level IS NULL AND (CASE WHEN ? = 3 THEN depthReached >= 280 WHEN ? = 2 THEN (depthReached >= 140 AND depthReached < 280) ELSE depthReached < 140 END)))`;
        params.push(levelQuery, levelQuery, levelQuery);
      }
      sql += ` GROUP BY COALESCE(userId, username) ORDER BY score DESC, depthReached DESC LIMIT ?`;
      params.push(limit);
    } else {
      // Personal Best: 1 distinct entry per pilot with their maximum single-run score
      sql = `
        SELECT 
          id, 
          userId, 
          username, 
          MAX(score) AS score, 
          depthReached, 
          chestsCollected, 
          country, 
          level, 
          createdAt,
          COUNT(*) AS totalDives
        FROM scores
        WHERE 1=1
      `;
      if (levelQuery && levelQuery >= 1 && levelQuery <= 3) {
        sql += ` AND (level = ? OR (level IS NULL AND (CASE WHEN ? = 3 THEN depthReached >= 280 WHEN ? = 2 THEN (depthReached >= 140 AND depthReached < 280) ELSE depthReached < 140 END)))`;
        params.push(levelQuery, levelQuery, levelQuery);
      }
      sql += ` GROUP BY COALESCE(userId, username) ORDER BY score DESC, depthReached DESC LIMIT ?`;
      params.push(limit);
    }

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
