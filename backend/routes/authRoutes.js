/**
 * Ocean Quest Chronicles Project
 * File: server/routes/authRoutes.js
 * Description: Express routes for user authentication and virtual identity.
 * VIRTUAL IDENTITY: Defines contract for authentication session endpoints.
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/me', authController.getMe);

module.exports = router;
