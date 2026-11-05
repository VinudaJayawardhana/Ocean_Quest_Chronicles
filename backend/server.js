/**
 * Ocean Quest Chronicles Project (see docs/references.md)
 * File: backend/server.js
 * Description: Express entry point. Wires middleware and delegates to modular routers.
 * COUPLING/COHESION: Only composition happens here; business logic lives in controllers/services.
 * VIRTUAL IDENTITY: Server-side cookie sessions (HttpOnly, SameSite=Lax, Secure in production).
 * INTEROPERABILITY: /api/puzzle proxies the external Fish Game API (answers stay on the server).
 */
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const dotenv = require('dotenv');

dotenv.config();
require('./config/db'); // opens SQLite and creates the tables

const authMiddleware = require('./middleware/authMiddleware');
const scoreController = require('./controllers/scoreController');

const app = express();
const PORT = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === 'production';

if (isProd) app.set('trust proxy', 1);

let secret = process.env.SESSION_SECRET;
if (!secret) {
  if (isProd) throw new Error('SESSION_SECRET must be set in production');
  secret = crypto.randomBytes(32).toString('hex');
  console.warn('[warn] SESSION_SECRET not set - using a random one (sessions reset on restart). See .env.example');
}

app.use(cors({ origin: ['http://localhost:4200', 'http://127.0.0.1:4200'], credentials: true }));
app.use(express.json());
app.use(
  session({
    secret,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax', secure: isProd, maxAge: 1000 * 60 * 60 * 24 * 7 }
  })
);

app.use('/api', require('./routes/authRoutes'));                          // /signup /login /logout /me
app.use('/api/profile', authMiddleware, require('./routes/profileRoutes')); // pilot dossier
app.use('/api/scores', require('./routes/scoreRoutes'));                  // GET public, POST needs login
app.get('/api/leaderboard', scoreController.getLeaderboard);              // read-only alias
app.use('/api/puzzle', authMiddleware, require('./routes/puzzleRoutes')); // Fish API proxy
app.use('/api/marine', require('./routes/marineRoutes'));                  // Open-Meteo Marine & Climate API (Separate from Fish API)

app.get('/api/health', (req, res) => res.status(200).json({ status: 'OK', sessionActive: !!req.session?.userId }));

app.use((err, req, res, next) => {
  console.error('[Unhandled Error]:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`Ocean Quest server running on http://localhost:${PORT}`));
}
module.exports = app;
