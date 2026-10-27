const express = require('express');
const router = express.Router();
const { createEmergencyRequest, getActiveRequests } = require('../controllers/requestController');
const authMiddleware = require('../middleware/authMiddleware');

// POST /api/emergency → New request (login required)
router.post('/', authMiddleware, createEmergencyRequest);

// GET /api/emergency → All active requests (login required)
router.get('/', authMiddleware, getActiveRequests);

module.exports = router;