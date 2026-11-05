/**
 * Ocean Quest Chronicles Project (see docs/references.md)
 * File: backend/controllers/authController.js
 * Description: Registration, login, logout and "who am I" - the virtual identity of a pilot.
 *
 * VIRTUAL IDENTITY - why server-side session cookies:
 *  - JWT in localStorage can be stolen by XSS and cannot be revoked at logout.
 *  - OAuth/OIDC adds an external provider that this self-contained coursework does not need.
 *  - A session cookie (HttpOnly, SameSite=Lax) is invisible to JavaScript, protected against
 *    simple CSRF, and the server can end it immediately.
 *  - Passwords are hashed with bcrypt (salted) and never returned.
 *  - The session id is regenerated at login/signup to prevent session fixation.
 * COUPLING/COHESION: High cohesion - only authentication logic lives here.
 */
const bcrypt = require('bcryptjs');
const db = require('../config/db');

/** Replace the session id, then bind the identity to the new session. */
const startSession = (req, user) =>
  new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) return reject(err);
      req.session.userId = user.id;
      req.session.username = user.username;
      resolve();
    });
  });

// POST /api/signup
exports.signup = async (req, res) => {
  try {
    const { username, email, password, location } = req.body || {};
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email and password are required.' });
    }
    if (String(username).trim().length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters long.' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email address format.' });
    }

    const cleanName = String(username).trim();
    const cleanEmail = String(email).toLowerCase().trim();
    const existing = await db.queryGet('SELECT id FROM users WHERE email = ? OR username = ?', [cleanEmail, cleanName]);
    if (existing) return res.status(409).json({ error: 'Username or email already registered.' });

    const hashed = await bcrypt.hash(password, 10);
    const country = location?.country || 'Unknown';
    const city = location?.city || 'Unknown';
    const ip = location?.ip || req.ip || '';

    const inserted = await db.queryRun(
      'INSERT INTO users (username, email, password, country, city, ip) VALUES (?, ?, ?, ?, ?, ?)',
      [cleanName, cleanEmail, hashed, country, city, ip]
    );
    await startSession(req, { id: inserted.id, username: cleanName });

    res.status(201).json({
      message: 'Pilot enlisted successfully.',
      user: { id: inserted.id, username: cleanName, email: cleanEmail, country, city }
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Failed to create user account.' });
  }
};

// POST /api/login
exports.login = async (req, res) => {
  try {
    const body = req.body || {};
    const identifier = String(body.email || body.username || '').trim();
    const password = body.password;

    const user = await db.queryGet(
      'SELECT * FROM users WHERE email = ? OR username = ?',
      [identifier.toLowerCase(), identifier]
    );
    // Same message for "unknown email/username" and "wrong password" so attackers cannot probe accounts.
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    await startSession(req, user);

    res.status(200).json({
      message: 'Authentication successful.',
      user: { id: user.id, username: user.username, email: user.email, callsign: user.callsign, country: user.country, city: user.city }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal login error.' });
  }
};

// POST /api/logout
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Failed to terminate session.' });
    res.clearCookie('connect.sid');
    res.status(200).json({ message: 'Session closed successfully.' });
  });
};

// GET /api/me
exports.getMe = async (req, res) => {
  try {
    if (!req.session || !req.session.userId) return res.status(401).json({ error: 'Unauthenticated.' });
    const user = await db.queryGet(
      'SELECT id, username, email, callsign, avatarUrl, country, city, ip, createdAt FROM users WHERE id = ?',
      [req.session.userId]
    );
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.status(200).json({ user });
  } catch (err) {
    console.error('GetMe error:', err);
    res.status(500).json({ error: 'Error fetching session identity.' });
  }
};
