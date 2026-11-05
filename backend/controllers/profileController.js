/**
 * Ocean Quest Chronicles Project (see docs/references.md)
 * File: backend/controllers/profileController.js
 * Description: Pilot profile (dossier). Identity comes from the server session.
 */
const db = require('../config/db');

const shape = (u) => ({
  id: u.id,
  username: u.username,
  email: u.email,
  profile: { callsign: u.callsign, avatarUrl: u.avatarUrl, country: u.country, city: u.city, ip: u.ip },
  createdAt: u.createdAt
});

// GET /api/profile
exports.getProfile = async (req, res) => {
  try {
    const user = await db.queryGet(
      'SELECT id, username, email, callsign, avatarUrl, country, city, ip, createdAt FROM users WHERE id = ?',
      [req.session.userId]
    );
    if (!user) return res.status(404).json({ error: 'Pilot profile not found.' });
    res.status(200).json(shape(user));
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ error: 'Error retrieving profile.' });
  }
};

// PUT /api/profile  { callsign, avatarUrl, country, city }
exports.updateProfile = async (req, res) => {
  try {
    const user = await db.queryGet('SELECT * FROM users WHERE id = ?', [req.session.userId]);
    if (!user) return res.status(404).json({ error: 'Pilot profile not found.' });

    const b = req.body || {};
    const clean = (v, old) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, 60) : old);
    const next = {
      callsign: clean(b.callsign, user.callsign),
      avatarUrl: clean(b.avatarUrl, user.avatarUrl),
      country: clean(b.country, user.country),
      city: clean(b.city, user.city)
    };
    await db.queryRun('UPDATE users SET callsign = ?, avatarUrl = ?, country = ?, city = ? WHERE id = ?', [
      next.callsign, next.avatarUrl, next.country, next.city, user.id
    ]);
    res.status(200).json(shape({ ...user, ...next }));
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Error updating profile.' });
  }
};
