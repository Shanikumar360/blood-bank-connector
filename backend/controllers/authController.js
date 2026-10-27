const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const register = async (req, res) => {
    try {
        const { name, email, password, phone, blood_group, latitude, longitude, address } = req.body;

        const [existingUsers] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const [result] = await pool.query(
            'INSERT INTO users (name, email, password_hash, phone, blood_group, latitude, longitude, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [name, email, password_hash, phone, blood_group, latitude, longitude, address]
        );

        const token = jwt.sign(
            { userId: result.insertId, email: email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'Registration successful',
            token: token,
            user: { 
                id: result.insertId, 
                name, 
                email, 
                phone, 
                blood_group, 
                address, 
                latitude, 
                longitude 
            }
        });

    } catch (error) {
        console.log('Register error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token: token,
            user: { 
                id: user.id, 
                name: user.name, 
                email: user.email, 
                phone: user.phone, 
                blood_group: user.blood_group, 
                address: user.address, 
                latitude: user.latitude, 
                longitude: user.longitude 
            }
        });

    } catch (error) {
        console.log('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { register, login };
