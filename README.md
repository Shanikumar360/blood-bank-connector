# 🩸 Blood Bank Connector

> A full-stack healthcare emergency web platform connecting voluntary blood donors with critical patients in real-time using geospatial matching (Haversine Formula) and automated email alerts.

---

## 🚀 Key Features

- **Geospatial Location Matching**: Computes accurate aerial distance using the **Haversine Formula** to locate compatible donors within a customizable radius (5 km to 50 km).
- **Interactive OpenStreetMap**: Powered by **Leaflet.js**, featuring live hospital markers, dynamic search radius boundary circles, and custom blood-drop donor pins with direct Call/Email actions.
- **Automated Emergency Dispatch**: Broadcasting an emergency alert automatically triggers asynchronous **Nodemailer SMTP email notifications** to verified donors residing within 10 km.
- **JWT & bcrypt Security**: Password protection with salted cryptographic hashing (10 rounds) and stateless JSON Web Token (JWT) verification middleware.
- **Digital Donor ID Card**: Instant generation of verified digital donor identity cards with unique serial identification (`BBC-DONOR-XXXX`).
- **Blood Compatibility Matrix**: Interactive matrix widget displaying donor/recipient compatibility chart for all 8 blood types.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | HTML5, CSS3 (Glassmorphism & Variables), Modern JavaScript (ES6+), Leaflet.js, FontAwesome 6 |
| **Backend** | Node.js, Express.js |
| **Database** | MySQL (with connection pooling via `mysql2/promise`) |
| **Authentication** | JSON Web Tokens (JWT), bcryptjs |
| **Email Service** | Nodemailer (Gmail SMTP) |
| **Geospatial Math** | Haversine Spherical Trigonometry Formula |

---

## 📁 Project Structure

```text
bloodbankconnector/
├── backend/
│   ├── config/
│   │   └── db.js                 # MySQL connection pool configuration
│   ├── controllers/
│   │   ├── authController.js     # User registration & login logic
│   │   ├── donorController.js    # Haversine radius search & directory
│   │   └── requestController.js  # Emergency requests & email dispatch
│   ├── middleware/
│   │   └── authMiddleware.js     # JWT verification guard
│   ├── routes/
│   │   ├── authRoutes.js         # /api/auth routes
│   │   ├── donorRoutes.js        # /api/donors routes
│   │   └── requestRoutes.js      # /api/emergency routes
│   ├── utils/
│   │   └── emailService.js       # Nodemailer SMTP transporter & templates
│   ├── .env.example              # Template for environment variables
│   ├── package.json              # Backend dependencies & scripts
│   ├── seed.js                   # Node script to populate 10 sample donors
│   ├── seed.sql                  # Raw SQL seed data
│   └── server.js                 # Express server entry point
├── frontend/
│   ├── index.html                # Semantic HTML5 layout & components
│   ├── style.css                 # Healthcare design system & animations
│   └── app.js                    # Leaflet map logic, API client, & toast alerts
├── .gitignore                    # Git ignore file (protects node_modules & .env)
└── README.md                     # Project documentation
```

---

## ⚡ Quick Start Guide

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [MySQL Server](https://dev.mysql.com/downloads/mysql/)

### 2. Database Setup
Execute the following in MySQL Workbench or CLI:
```sql
CREATE DATABASE IF NOT EXISTS blood_bank_db;
```

### 3. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory (see `.env.example`):
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=blood_bank_db
JWT_SECRET=your_jwt_secret_key

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
```

Seed sample donors (Delhi-NCR coordinates):
```bash
node seed.js
```

Start the backend server:
```bash
npm run dev
# Server running on http://localhost:5000
```

### 4. Frontend Launch
Open `frontend/index.html` in your browser, or use VS Code Live Server.

---

## 📄 License
This project is open-source and available under the [ISC License](LICENSE).
