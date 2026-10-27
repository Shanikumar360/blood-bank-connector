-- ============================================================
-- Blood Bank Connector: Sample Dummy Data for Testing
-- ============================================================

USE blood_bank_db;

-- 1. Insert Sample Donors across Delhi-NCR
-- Password for all dummy users is: 123456
INSERT INTO users (name, email, password_hash, phone, blood_group, latitude, longitude, address, is_available) VALUES
('Rohit Sharma', 'rohit@example.com', '$2b$10$Pz6wI0CxDoYDJpXPEbiXkuxsZQVSXOiFL5nR/GThEDlQ/sb3t3ZIi', '+91 98111 22334', 'O+', 28.6315, 77.2167, 'Connaught Place, New Delhi', TRUE),
('Pooja Verma', 'pooja@example.com', '$2b$10$Pz6wI0CxDoYDJpXPEbiXkuxsZQVSXOiFL5nR/GThEDlQ/sb3t3ZIi', '+91 98222 33445', 'O+', 28.5672, 77.2100, 'AIIMS Ansari Nagar, New Delhi', TRUE),
('Aman Gupta', 'aman@example.com', '$2b$10$Pz6wI0CxDoYDJpXPEbiXkuxsZQVSXOiFL5nR/GThEDlQ/sb3t3ZIi', '+91 98333 44556', 'A+', 28.5700, 77.2400, 'Lajpat Nagar IV, New Delhi', TRUE),
('Neha Singh', 'neha@example.com', '$2b$10$Pz6wI0CxDoYDJpXPEbiXkuxsZQVSXOiFL5nR/GThEDlQ/sb3t3ZIi', '+91 98444 55667', 'B+', 28.6514, 77.1907, 'Karol Bagh, New Delhi', TRUE),
('Vikas Malhotra', 'vikas@example.com', '$2b$10$Pz6wI0CxDoYDJpXPEbiXkuxsZQVSXOiFL5nR/GThEDlQ/sb3t3ZIi', '+91 98555 66778', 'O-', 28.5494, 77.2001, 'Hauz Khas Market, New Delhi', TRUE),
('Ananya Patel', 'ananya@example.com', '$2b$10$Pz6wI0CxDoYDJpXPEbiXkuxsZQVSXOiFL5nR/GThEDlQ/sb3t3ZIi', '+91 98666 77889', 'AB+', 28.5244, 77.2066, 'Saket District Centre, New Delhi', TRUE),
('Karan Mehta', 'karan@example.com', '$2b$10$Pz6wI0CxDoYDJpXPEbiXkuxsZQVSXOiFL5nR/GThEDlQ/sb3t3ZIi', '+91 98777 88990', 'B-', 28.5800, 77.2300, 'Defence Colony, New Delhi', TRUE),
('Sneha Joshi', 'sneha@example.com', '$2b$10$Pz6wI0CxDoYDJpXPEbiXkuxsZQVSXOiFL5nR/GThEDlQ/sb3t3ZIi', '+91 98888 99001', 'O+', 28.6200, 77.2800, 'Mayur Vihar Phase 1, East Delhi', TRUE),
('Dr. Arvind Rao', 'arvind@example.com', '$2b$10$Pz6wI0CxDoYDJpXPEbiXkuxsZQVSXOiFL5nR/GThEDlQ/sb3t3ZIi', '+91 98999 00112', 'A-', 28.7041, 77.1025, 'Pitampura, North West Delhi', TRUE),
('Simran Kaur', 'simran@example.com', '$2b$10$Pz6wI0CxDoYDJpXPEbiXkuxsZQVSXOiFL5nR/GThEDlQ/sb3t3ZIi', '+91 98123 45678', 'AB-', 28.5708, 77.3261, 'Sector 18, Noida', TRUE)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 2. Insert Sample Active Emergency Requests
INSERT INTO emergency_requests (requester_id, patient_name, blood_group, units_needed, hospital_name, hospital_address, latitude, longitude, urgency, status)
SELECT id, 'Sunita Devi', 'O+', 2, 'AIIMS Trauma Centre', 'Safdarjung Enclave, Ring Road, New Delhi', 28.5672, 77.2100, 'CRITICAL', 'PENDING'
FROM users WHERE email = 'rohit@example.com' LIMIT 1;

INSERT INTO emergency_requests (requester_id, patient_name, blood_group, units_needed, hospital_name, hospital_address, latitude, longitude, urgency, status)
SELECT id, 'Kavita Yadav', 'B+', 1, 'Max Super Speciality Hospital', 'Press Enclave Road, Saket, New Delhi', 28.5244, 77.2066, 'MEDIUM', 'PENDING'
FROM users WHERE email = 'aman@example.com' LIMIT 1;
