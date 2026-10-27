const express = require('express');
const router = express.Router();
const { searchNearbyDonors, getAllDonors } = require('../controllers/donorController');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/donors/nearby -> Search donors by location (token required)
router.get('/nearby', authMiddleware, searchNearbyDonors);

// GET /api/donors/all -> Get list of all registered donors
router.get('/all', getAllDonors);

module.exports = router;
