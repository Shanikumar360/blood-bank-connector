const pool = require('../config/db');

const searchNearbyDonors = async (req, res) => {
    try {
        const { lat, lng, radius, blood_group } = req.query;
        
        console.log('Query received:', { lat, lng, radius, blood_group });
        
        if (!lat || !lng || !radius || !blood_group) {
            return res.status(400).json({
                error: 'lat, lng, radius, blood_group required'
            });
        }
        
        const hospitalLat = parseFloat(lat);
        const hospitalLng = parseFloat(lng);
        const searchRadius = parseFloat(radius);
        
        console.log('Parsed values:', { hospitalLat, hospitalLng, searchRadius, blood_group });
        
        const query = `
            SELECT 
                id, name, phone, blood_group, latitude, longitude, address, is_available,
                (
                    6371 * ACOS(
                        COS(RADIANS(?)) * COS(RADIANS(latitude)) * 
                        COS(RADIANS(longitude) - RADIANS(?)) + 
                        SIN(RADIANS(?)) * SIN(RADIANS(latitude))
                    )
                ) AS distance
            FROM users
            WHERE blood_group = ? AND is_available = TRUE
            HAVING distance <= ?
            ORDER BY distance
        `;
        
        const params = [hospitalLat, hospitalLng, hospitalLat, blood_group, searchRadius];
        
        const [donors] = await pool.query(query, params);
        
        res.json({
            total: donors.length,
            radius: searchRadius,
            blood_group: blood_group,
            donors: donors
        });
        
    } catch (error) {
        console.log('Search error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

const getAllDonors = async (req, res) => {
    try {
        const [donors] = await pool.query(
            `SELECT id, name, email, phone, blood_group, address, latitude, longitude, is_available, created_at 
             FROM users 
             ORDER BY created_at DESC 
             LIMIT 50`
        );
        res.json({ total: donors.length, donors });
    } catch (error) {
        console.log('Get all donors error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { searchNearbyDonors, getAllDonors };
