/**
 * Ocean Quest Chronicles Project
 * File: server/middleware/authMiddleware.js
 * Description: Middleware ensuring requests have an active authenticated session.
 * VIRTUAL IDENTITY: Verifies user session identity directly from server-side cookie store.
 * COUPLING/COHESION: Low coupling - interceptor decoupling route handlers from session validation logic.
 */

const authMiddleware = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Active session required. Please log in.'
    });
  }
  next();
};

module.exports = authMiddleware;
