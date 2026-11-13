/**
 * Source/AI-generated: Ocean Quest Chronicles Project (see docs/references.md)
 * File: backend/controllers/profileController.js
 * Description: Pilot profile (dossier). Identity comes from the server session.
 * VIRTUAL IDENTITY: Progress (highestLevel) and personal dive records (bestScore, maxDepth, totalRuns)
 * are stored and queried directly from SQLite under the pilot's account.
 */
const db = require('../config/db');

const shape = (u, stats = {}) => ({
  id: u.id,
  username: u.username,
  email: u.email,
  callsign: u.callsign || u.username,
  country: u.country || 'Sri Lanka',
  city: u.city || 'Colombo',
  highestLevel: u.highestLevel || 0,
  bestScore: stats.bestScore || 0,
  level1Best: stats.level1Best || 0,
  level2Best: stats.level2Best || 0,
  level3Best: stats.level3Best || 0,
  maxDepth: stats.maxDepth || 0,
  totalRuns: stats.totalRuns || 0,
  profile: {
    callsign: u.callsign || u.username,
    avatarUrl: u.avatarUrl,
    country: u.country || 'Sri Lanka',
    city: u.city || 'Colombo',
    ip: u.ip
  },
  createdAt: u.createdAt
});

// GET /api/profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) return res.status(401).json({ error: 'Pilot profile not found.' });
    const user = await db.queryGet(
      'SELECT id, username, email, callsign, avatarUrl, country, city, ip, highestLevel, createdAt FROM users WHERE id = ?',
      [userId]
    );
    if (!user) return res.status(404).json({ error: 'Pilot profile not found.' });

    // Query personal dive telemetry directly from verified scores table
    const stats = await db.queryGet(
      'SELECT MAX(score) AS bestScore, MAX(CASE WHEN (level = 1 OR (level IS NULL AND depthReached < 140)) THEN score ELSE 0 END) AS level1Best, MAX(CASE WHEN (level = 2 OR (level IS NULL AND depthReached >= 140 AND depthReached < 280)) THEN score ELSE 0 END) AS level2Best, MAX(CASE WHEN (level = 3 OR (level IS NULL AND depthReached >= 280)) THEN score ELSE 0 END) AS level3Best, MAX(depthReached) AS maxDepth, COUNT(*) AS totalRuns FROM scores WHERE userId = ?',
      [userId]
    );

    res.status(200).json(shape(user, stats || {}));
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ error: 'Error retrieving profile.' });
  }
};

// PUT /api/profile  { callsign, avatarUrl, country, city }
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) return res.status(401).json({ error: 'Pilot profile not found.' });
    const user = await db.queryGet('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) return res.status(404).json({ error: 'Pilot profile not found.' });

    const b = req.body || {};
    const clean = (v, old) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, 60) : old);
    const next = {
      callsign: clean(b.callsign, user.callsign || user.username),
      avatarUrl: clean(b.avatarUrl, user.avatarUrl),
      country: clean(b.country, user.country),
      city: clean(b.city, user.city)
    };
    await db.queryRun('UPDATE users SET callsign = ?, avatarUrl = ?, country = ?, city = ? WHERE id = ?', [
      next.callsign, next.avatarUrl, next.country, next.city, user.id
    ]);

    const stats = await db.queryGet(
      'SELECT MAX(score) AS bestScore, MAX(CASE WHEN (level = 1 OR (level IS NULL AND depthReached < 140)) THEN score ELSE 0 END) AS level1Best, MAX(CASE WHEN (level = 2 OR (level IS NULL AND depthReached >= 140 AND depthReached < 280)) THEN score ELSE 0 END) AS level2Best, MAX(CASE WHEN (level = 3 OR (level IS NULL AND depthReached >= 280)) THEN score ELSE 0 END) AS level3Best, MAX(depthReached) AS maxDepth, COUNT(*) AS totalRuns FROM scores WHERE userId = ?',
      [userId]
    );

    res.status(200).json(shape({ ...user, ...next }, stats || {}));
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Error updating profile.' });
  }
};

// POST /api/profile/progress  { levelCleared: number }
exports.saveProgress = async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized.' });
    const levelCleared = parseInt(req.body?.levelCleared, 10);
    if (!levelCleared || levelCleared < 1 || levelCleared > 3) {
      return res.status(400).json({ error: 'Valid level number (1-3) required.' });
    }

    const user = await db.queryGet('SELECT id, highestLevel FROM users WHERE id = ?', [userId]);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const currentHighest = user.highestLevel || 0;
    const newHighest = Math.max(currentHighest, levelCleared);

    if (newHighest > currentHighest) {
      await db.queryRun('UPDATE users SET highestLevel = ? WHERE id = ?', [newHighest, userId]);
    }

    res.status(200).json({
      message: 'Progression saved to naval database.',
      highestLevel: newHighest
    });
  } catch (err) {
    console.error('SaveProgress error:', err);
    res.status(500).json({ error: 'Failed to record progression.' });
  }
};
