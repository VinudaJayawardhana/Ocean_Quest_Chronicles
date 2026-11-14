/**
 * Ocean Quest Chronicles — CIS045-3 Distributed Service Architectures
 * File: server/middleware/authMiddleware.js
 * Description: Middleware ensuring requests have an active authenticated server session.
 * VIRTUAL IDENTITY: Identity is strictly taken from the server-side session cookie (req.session.userId).
 * No client-supplied headers are trusted for identity.
 * COUPLING/COHESION: Low coupling - interceptor decoupling route handlers from session validation logic.
 */

const authMiddleware = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.status(401).json({
    error: 'Unauthorized',
    message: 'Active session required. Please log in.'
  });
};

module.exports = authMiddleware;
