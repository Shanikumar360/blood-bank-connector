const pool = require('../config/db');
const { sendDonorAlert } = require('../utils/emailService');

// ============================================================
// Create Emergency Request
// ============================================================
const createEmergencyRequest = async (req, res) => {
    try {
        const requesterId = req.userId;
        
        const {
            patientName,
            bloodGroup,
            unitsNeeded,
            hospitalName,
            hospitalAddress,
            latitude,
            longitude,
            urgency
        } = req.body;
        
        if (!bloodGroup || !hospitalName || !latitude || !longitude) {
            return res.status(400).json({ error: 'Required fields missing' });
        }
        
        // Save request
        const [result] = await pool.query(
            `INSERT INTO emergency_requests 
             (requester_id, patient_name, blood_group, units_needed, 
              hospital_name, hospital_address, latitude, longitude, urgency) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                requesterId,
                patientName || null,
                bloodGroup,
                unitsNeeded || 1,
                hospitalName,
                hospitalAddress || null,
                latitude,
                longitude,
                urgency || 'MEDIUM'
            ]
        );
        
        // Find matching donors
        const [donors] = await pool.query(
            `SELECT id, name, email, phone,
                (
                    6371 * ACOS(
                        COS(RADIANS(?)) * COS(RADIANS(latitude)) * 
                        COS(RADIANS(longitude) - RADIANS(?)) + 
                        SIN(RADIANS(?)) * SIN(RADIANS(latitude))
                    )
                ) AS distance
            FROM users
            WHERE blood_group = ? AND is_available = TRUE
            HAVING distance <= 10
            ORDER BY distance
            LIMIT 5`,
            [latitude, longitude, latitude, bloodGroup]
        );
        
        // Send emails to donors
        const requestDetails = { bloodGroup, hospitalName, hospitalAddress, urgency };
        
        const emailPromises = donors.map(donor => 
            sendDonorAlert(donor.email, donor.name, requestDetails)
        );
        
        const emailResults = await Promise.all(emailPromises);
        
        res.status(201).json({
            message: 'Emergency request created',
            requestId: result.insertId,
            donorsNotified: donors.length,
            emailsSent: emailResults.filter(r => r).length
        });
        
    } catch (error) {
        console.log('Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// ============================================================
// Get All Active Requests
// ============================================================
const getActiveRequests = async (req, res) => {
    try {
        const [requests] = await pool.query(
            `SELECT er.*, u.name as requester_name, u.phone as requester_phone
             FROM emergency_requests er
             JOIN users u ON er.requester_id = u.id
             WHERE er.status = 'PENDING'
             ORDER BY er.created_at DESC`
        );
        
        res.json({
            total: requests.length,
            requests: requests
        });
        
    } catch (error) {
        console.log('Get requests error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// ============================================================
// Export both
// ============================================================
module.exports = { createEmergencyRequest, getActiveRequests };