const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const sampleDonors = [
    { name: 'Rohit Sharma', email: 'rohit@example.com', phone: '+91 98111 22334', blood_group: 'O+', lat: 28.6315, lng: 77.2167, address: 'Connaught Place, New Delhi' },
    { name: 'Pooja Verma', email: 'pooja@example.com', phone: '+91 98222 33445', blood_group: 'O+', lat: 28.5672, lng: 77.2100, address: 'AIIMS Ansari Nagar, New Delhi' },
    { name: 'Aman Gupta', email: 'aman@example.com', phone: '+91 98333 44556', blood_group: 'A+', lat: 28.5700, lng: 77.2400, address: 'Lajpat Nagar IV, New Delhi' },
    { name: 'Neha Singh', email: 'neha@example.com', phone: '+91 98444 55667', blood_group: 'B+', lat: 28.6514, lng: 77.1907, address: 'Karol Bagh, New Delhi' },
    { name: 'Vikas Malhotra', email: 'vikas@example.com', phone: '+91 98555 66778', blood_group: 'O-', lat: 28.5494, lng: 77.2001, address: 'Hauz Khas Market, New Delhi' },
    { name: 'Ananya Patel', email: 'ananya@example.com', phone: '+91 98666 77889', blood_group: 'AB+', lat: 28.5244, lng: 77.2066, address: 'Saket District Centre, New Delhi' },
    { name: 'Karan Mehta', email: 'karan@example.com', phone: '+91 98777 88990', blood_group: 'B-', lat: 28.5800, lng: 77.2300, address: 'Defence Colony, New Delhi' },
    { name: 'Sneha Joshi', email: 'sneha@example.com', phone: '+91 98888 99001', blood_group: 'O+', lat: 28.6200, lng: 77.2800, address: 'Mayur Vihar Phase 1, East Delhi' },
    { name: 'Dr. Arvind Rao', email: 'arvind@example.com', phone: '+91 98999 00112', blood_group: 'A-', lat: 28.7041, lng: 77.1025, address: 'Pitampura, North West Delhi' },
    { name: 'Simran Kaur', email: 'simran@example.com', phone: '+91 98123 45678', blood_group: 'AB-', lat: 28.5708, lng: 77.3261, address: 'Sector 18, Noida' }
];

// Hash for '123456'
const PASSWORD_HASH = '$2b$10$Pz6wI0CxDoYDJpXPEbiXkuxsZQVSXOiFL5nR/GThEDlQ/sb3t3ZIi';

async function seedDatabase() {
    let connection;
    try {
        console.log('Connecting to MySQL database:', process.env.DB_NAME);
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME || 'blood_bank_db'
        });

        console.log('Connected! Ensuring tables exist...');

        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                phone VARCHAR(20) NOT NULL,
                blood_group VARCHAR(10) NOT NULL,
                latitude DECIMAL(10, 6) NOT NULL,
                longitude DECIMAL(10, 6) NOT NULL,
                address TEXT,
                is_available BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS emergency_requests (
                id INT AUTO_INCREMENT PRIMARY KEY,
                requester_id INT NOT NULL,
                patient_name VARCHAR(100),
                blood_group VARCHAR(10) NOT NULL,
                units_needed INT DEFAULT 1,
                hospital_name VARCHAR(150) NOT NULL,
                hospital_address TEXT,
                latitude DECIMAL(10, 6) NOT NULL,
                longitude DECIMAL(10, 6) NOT NULL,
                urgency ENUM('LOW', 'MEDIUM', 'CRITICAL') DEFAULT 'MEDIUM',
                status ENUM('PENDING', 'FULFILLED', 'CANCELLED') DEFAULT 'PENDING',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        console.log('Inserting 10 sample donors across Delhi-NCR...');
        for (const donor of sampleDonors) {
            await connection.query(
                `INSERT INTO users (name, email, password_hash, phone, blood_group, latitude, longitude, address, is_available)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)
                 ON DUPLICATE KEY UPDATE name = VALUES(name), blood_group = VALUES(blood_group)`,
                [donor.name, donor.email, PASSWORD_HASH, donor.phone, donor.blood_group, donor.lat, donor.lng, donor.address]
            );
        }

        console.log('Inserting sample emergency requests...');
        const [users] = await connection.query(`SELECT id FROM users WHERE email = 'rohit@example.com' LIMIT 1`);
        if (users.length > 0) {
            const requesterId = users[0].id;
            await connection.query(`
                INSERT INTO emergency_requests 
                (requester_id, patient_name, blood_group, units_needed, hospital_name, hospital_address, latitude, longitude, urgency, status)
                VALUES (?, 'Sunita Devi', 'O+', 2, 'AIIMS Trauma Centre', 'Safdarjung Enclave, Ring Road, New Delhi', 28.5672, 77.2100, 'CRITICAL', 'PENDING')
            `, [requesterId]);

            await connection.query(`
                INSERT INTO emergency_requests 
                (requester_id, patient_name, blood_group, units_needed, hospital_name, hospital_address, latitude, longitude, urgency, status)
                VALUES (?, 'Kavita Yadav', 'B+', 1, 'Max Super Speciality Hospital', 'Press Enclave Road, Saket, New Delhi', 28.5244, 77.2066, 'MEDIUM', 'PENDING')
            `, [requesterId]);
        }

        console.log('✅ SUCCESS! 10 Sample Donors and 2 Emergency Requests added successfully!');
        console.log('👉 You can now test searching for O+, A+, B+, etc. on the map!');
    } catch (error) {
        console.error('❌ Seeding Error:', error.message);
    } finally {
        if (connection) await connection.end();
        process.exit(0);
    }
}

seedDatabase();
