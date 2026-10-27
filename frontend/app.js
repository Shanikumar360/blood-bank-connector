/* ==========================================================================
   Blood Bank Connector - Frontend Application Script
   ========================================================================== */

// Global Configuration
const API_URL = 'http://localhost:5000/api';
let authToken = localStorage.getItem('token') || null;
let currentUser = JSON.parse(localStorage.getItem('user') || 'null');

// Map instances
let searchMap = null;
let searchCircle = null;
let searchCenterMarker = null;
let donorMarkersGroup = null;

let regMap = null;
let regMarker = null;

let emMap = null;
let emMarker = null;

// Default coordinate: New Delhi, India
const DEFAULT_COORDS = [28.6139, 77.2090];

// ==========================================================================
// Initialization on DOM Ready
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    updateAuthState();

    if (authToken) {
        showSection('dashboard');
        switchTab('search');
        loadActiveRequests();
    } else {
        showSection('home');
    }

    // Leaflet tile load helper
    setTimeout(() => {
        initSearchMap();
    }, 200);
});

// ==========================================================================
// Toast Notification Utility
// ==========================================================================
function showToast(message, type = 'info', duration = 4500) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';

    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas fa-${icon}"></i>
        </div>
        <div class="toast-message">${message}</div>
        <button class="toast-close" onclick="this.parentElement.remove()" aria-label="Close">
            <i class="fas fa-times"></i>
        </button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('toast-leave');
        setTimeout(() => toast.remove(), 250);
    }, duration);
}

// Backward compatible alert function
function showAlert(message, type) {
    showToast(message, type === 'error' ? 'error' : 'success');
}

// ==========================================================================
// Navigation & State Management
// ==========================================================================
function initNavigation() {
    // Mobile menu toggle
    const toggleBtn = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    if (toggleBtn && navMenu) {
        toggleBtn.addEventListener('click', () => {
            navMenu.classList.toggle('show');
        });
    }

    // Blood compatibility helper selector
    const bloodPills = document.querySelectorAll('.blood-pill');
    bloodPills.forEach(pill => {
        pill.addEventListener('click', () => {
            bloodPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            const group = pill.getAttribute('data-blood');
            showCompatibilityInfo(group);
        });
    });
}

function showCompatibilityInfo(group) {
    const compatMatrix = {
        'A+': { givesTo: 'A+, AB+', receivesFrom: 'A+, A-, O+, O-' },
        'O+': { givesTo: 'O+, A+, B+, AB+', receivesFrom: 'O+, O-' },
        'B+': { givesTo: 'B+, AB+', receivesFrom: 'B+, B-, O+, O-' },
        'AB+': { givesTo: 'AB+ only', receivesFrom: 'All Blood Types (Universal Recipient)' },
        'A-': { givesTo: 'A+, A-, AB+, AB-', receivesFrom: 'A-, O-' },
        'O-': { givesTo: 'Everyone (Universal Donor)', receivesFrom: 'O- only' },
        'B-': { givesTo: 'B+, B-, AB+, AB-', receivesFrom: 'B-, O-' },
        'AB-': { givesTo: 'AB+, AB-', receivesFrom: 'AB-, A-, B-, O-' }
    };

    const info = compatMatrix[group];
    if (info) {
        const textElem = document.getElementById('compatText');
        if (textElem) {
            textElem.innerHTML = `<strong>${group}</strong> Can Donate To: <span style="color: var(--primary); font-weight:700;">${info.givesTo}</span> | Can Receive From: <span style="color: var(--secondary); font-weight:700;">${info.receivesFrom}</span>`;
        }
    }
}

function updateAuthState() {
    const guestNav = document.getElementById('guestNav');
    const userNav = document.getElementById('userNav');
    const dashboardTabs = document.getElementById('dashboardTabs');
    const userDisplayName = document.getElementById('userDisplayName');
    const userBloodBadge = document.getElementById('userBloodBadge');
    const userAvatarChar = document.getElementById('userAvatarChar');

    if (authToken && currentUser) {
        if (guestNav) guestNav.classList.add('hidden');
        if (userNav) userNav.classList.remove('hidden');
        if (dashboardTabs) dashboardTabs.classList.remove('hidden');

        if (userDisplayName) userDisplayName.textContent = currentUser.name || 'User';
        if (userBloodBadge) userBloodBadge.textContent = currentUser.blood_group ? `(${currentUser.blood_group})` : '';
        if (userAvatarChar) userAvatarChar.textContent = (currentUser.name || 'U').charAt(0).toUpperCase();
        
        renderProfileTab();
    } else {
        if (guestNav) guestNav.classList.remove('hidden');
        if (userNav) userNav.classList.add('hidden');
        if (dashboardTabs) dashboardTabs.classList.add('hidden');
    }
}

function showSection(sectionId) {
    // Close mobile nav if opened
    const navMenu = document.getElementById('navMenu');
    if (navMenu) navMenu.classList.remove('show');

    // Sections list
    const sections = ['heroSection', 'registerSection', 'loginSection', 'dashboardSection'];
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });

    // Update active nav-link
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));

    switch(sectionId) {
        case 'home':
            document.getElementById('heroSection').classList.remove('hidden');
            const homeLink = document.getElementById('navHome');
            if (homeLink) homeLink.classList.add('active');
            break;

        case 'register':
            document.getElementById('registerSection').classList.remove('hidden');
            initRegMap();
            setTimeout(() => { if (regMap) regMap.invalidateSize(); }, 200);
            break;

        case 'login':
            document.getElementById('loginSection').classList.remove('hidden');
            break;

        case 'dashboard':
        case 'search':
        case 'directory':
        case 'emergency':
        case 'requests':
        case 'profile':
            if (!authToken) {
                showToast('Please sign in or register to access the dashboard', 'info');
                showSection('login');
                return;
            }
            document.getElementById('dashboardSection').classList.remove('hidden');
            if (sectionId === 'search' || sectionId === 'dashboard') switchTab('search');
            else if (sectionId === 'directory') switchTab('directory');
            else if (sectionId === 'emergency') switchTab('emergency');
            else if (sectionId === 'requests') switchTab('requests');
            else if (sectionId === 'profile') switchTab('profile');
            break;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function switchTab(tabId) {
    const tabs = ['search', 'directory', 'emergency', 'requests', 'profile'];
    tabs.forEach(t => {
        const content = document.getElementById(`${t}Tab`);
        const btn = document.getElementById(`tabBtn${t.charAt(0).toUpperCase() + t.slice(1)}`);
        if (content) content.classList.add('hidden');
        if (btn) btn.classList.remove('active');
    });

    const activeContent = document.getElementById(`${tabId}Tab`);
    const activeBtn = document.getElementById(`tabBtn${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`);
    if (activeContent) activeContent.classList.remove('hidden');
    if (activeBtn) activeBtn.classList.add('active');

    if (tabId === 'search') {
        setTimeout(() => {
            initSearchMap();
            if (searchMap) searchMap.invalidateSize();
        }, 150);
    } else if (tabId === 'directory') {
        loadAllDonors();
    } else if (tabId === 'emergency') {
        setTimeout(() => {
            initEmergencyMap();
            if (emMap) emMap.invalidateSize();
        }, 150);
    } else if (tabId === 'requests') {
        loadActiveRequests();
    } else if (tabId === 'profile') {
        renderProfileTab();
    }
}

// ==========================================================================
// Authentication Handlers
// ==========================================================================
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="spinner"></span> Signing in...';
    btn.disabled = true;

    const data = {
        email: document.getElementById('loginEmail').value.trim(),
        password: document.getElementById('loginPassword').value
    };

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            authToken = result.token;
            currentUser = result.user;
            localStorage.setItem('token', authToken);
            localStorage.setItem('user', JSON.stringify(currentUser));
            updateAuthState();
            showToast(`Welcome back, ${currentUser.name}!`, 'success');
            showSection('dashboard');
            switchTab('profile'); // Show their donor card immediately!
        } else {
            showToast(result.error || 'Invalid credentials', 'error');
        }
    } catch (error) {
        showToast('Connection failed. Please ensure the backend is running.', 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
});

document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;

    const latVal = document.getElementById('regLat').value;
    const lngVal = document.getElementById('regLng').value;

    if (!latVal || !lngVal) {
        showToast('Please pick your location on the map or click auto-detect.', 'error');
        return;
    }

    btn.innerHTML = '<span class="spinner"></span> Creating account...';
    btn.disabled = true;

    const data = {
        name: document.getElementById('regName').value.trim(),
        email: document.getElementById('regEmail').value.trim(),
        password: document.getElementById('regPassword').value,
        phone: document.getElementById('regPhone').value.trim(),
        blood_group: document.getElementById('regBloodGroup').value,
        address: document.getElementById('regAddress').value.trim(),
        latitude: parseFloat(latVal),
        longitude: parseFloat(lngVal)
    };

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            authToken = result.token;
            currentUser = result.user;
            localStorage.setItem('token', authToken);
            localStorage.setItem('user', JSON.stringify(currentUser));
            updateAuthState();
            showToast('Registration successful! Your digital donor card is ready.', 'success', 5000);
            showSection('dashboard');
            switchTab('profile'); // Switch to profile card so they immediately see their registered details!
        } else {
            showToast(result.error || 'Registration failed', 'error');
        }
    } catch (error) {
        showToast('Server error during registration. Please verify backend connection.', 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
});

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    updateAuthState();
    showSection('home');
    showToast('Logged out securely.', 'info');
}

// ==========================================================================
// Digital Donor Card & Profile Renderer
// ==========================================================================
function renderProfileTab() {
    if (!currentUser) return;

    const nameElem = document.getElementById('profileName');
    const bloodBadge = document.getElementById('profileBloodGroupBadge');
    const avatarChar = document.getElementById('profileAvatarChar');
    const donorIdElem = document.getElementById('profileDonorId');
    const phoneElem = document.getElementById('profilePhone');
    const emailElem = document.getElementById('profileEmail');
    const addressElem = document.getElementById('profileAddress');

    if (nameElem) nameElem.textContent = currentUser.name || 'Verified Donor';
    if (bloodBadge) bloodBadge.textContent = currentUser.blood_group || 'O+';
    if (avatarChar) avatarChar.textContent = (currentUser.name || 'U').charAt(0).toUpperCase();
    if (donorIdElem) donorIdElem.textContent = `ID: BBC-DONOR-${String(currentUser.id || 1).padStart(4, '0')}`;
    if (phoneElem) phoneElem.textContent = currentUser.phone || 'Not provided';
    if (emailElem) emailElem.textContent = currentUser.email || 'Not provided';
    if (addressElem) addressElem.textContent = currentUser.address || 'Address registered on file';
}

// ==========================================================================
// All Registered Donors Directory
// ==========================================================================
async function loadAllDonors() {
    const container = document.getElementById('allDonorsResults');
    if (!container) return;

    container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
            <span class="spinner dark"></span> Loading registered donors...
        </div>
    `;

    try {
        const response = await fetch(`${API_URL}/donors/all`);
        const data = await response.json();

        container.innerHTML = '';

        if (!response.ok || !data.donors || data.donors.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1;">
                    <div class="empty-state-icon"><i class="fas fa-users-slash"></i></div>
                    <h3>No Donors Found in Database</h3>
                    <p>Be the first donor to register and lead the life-saving mission!</p>
                </div>
            `;
            return;
        }

        const countElem = document.getElementById('directoryCount');
        if (countElem) countElem.textContent = data.total;

        data.donors.forEach(donor => {
            const card = document.createElement('div');
            card.className = 'donor-card';

            const initial = (donor.name || 'D').charAt(0).toUpperCase();
            const isSelf = currentUser && currentUser.email === donor.email;

            card.innerHTML = `
                <div>
                    <div class="donor-card-top">
                        <div class="donor-avatar" style="${isSelf ? 'background: var(--primary); color: white;' : ''}">
                            ${initial}
                        </div>
                        <div class="donor-details">
                            <h4>
                                ${escapeHtml(donor.name)} 
                                ${isSelf ? '<span style="font-size: 11px; background: #ffe4e6; color: #9f1239; padding: 2px 6px; border-radius: 4px; margin-left: 4px;">You</span>' : ''}
                            </h4>
                            <p><i class="fas fa-map-marker-alt"></i> ${escapeHtml(donor.address || 'Location on file')}</p>
                        </div>
                    </div>

                    <div class="badges-row">
                        <span class="blood-badge"><i class="fas fa-tint"></i> ${donor.blood_group}</span>
                        <span class="status-badge status-available"><i class="fas fa-check-circle"></i> Registered Donor</span>
                    </div>
                </div>

                <div class="donor-card-actions">
                    <a href="tel:${encodeURIComponent(donor.phone)}" class="btn btn-success btn-sm">
                        <i class="fas fa-phone-alt"></i> Call
                    </a>
                    <a href="mailto:${encodeURIComponent(donor.email)}" class="btn btn-outline btn-sm">
                        <i class="fas fa-envelope"></i> Email
                    </a>
                    <button class="btn btn-ghost btn-sm" onclick="showToast('Donor registered at: ${donor.address || 'Delhi'}', 'info')">
                        <i class="fas fa-info-circle"></i>
                    </button>
                </div>
            `;

            container.appendChild(card);
        });

    } catch (error) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <p style="color: var(--danger);">Failed to load donors directory. Make sure backend is running.</p>
            </div>
        `;
    }
}

// ==========================================================================
// Leaflet Map Integrations
// ==========================================================================

function createBloodIcon(bloodGroup) {
    return L.divIcon({
        className: 'custom-donor-pin-container',
        html: `<div class="custom-donor-marker"><span>${bloodGroup || '🩸'}</span></div>`,
        iconSize: [38, 38],
        iconAnchor: [19, 38],
        popupAnchor: [0, -36]
    });
}

function createHospitalIcon() {
    return L.divIcon({
        className: 'custom-hospital-pin-container',
        html: `<div class="custom-hospital-marker"><i class="fas fa-hospital"></i></div>`,
        iconSize: [42, 42],
        iconAnchor: [21, 21],
        popupAnchor: [0, -20]
    });
}

// 1. Search & Donor Map
function initSearchMap() {
    const mapElement = document.getElementById('searchMap');
    if (!mapElement) return;

    if (!searchMap) {
        searchMap = L.map('searchMap', {
            zoomControl: true,
            scrollWheelZoom: false
        }).setView(DEFAULT_COORDS, 12);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(searchMap);

        donorMarkersGroup = L.layerGroup().addTo(searchMap);

        // Click to change search coordinates
        searchMap.on('click', (e) => {
            const { lat, lng } = e.latlng;
            setSearchLocation(lat, lng, 'Selected on map');
            showToast(`Search center updated to: ${lat.toFixed(4)}, ${lng.toFixed(4)}`, 'info');
        });
    }

    searchMap.invalidateSize();
}

function setSearchLocation(lat, lng, label = 'Current Location') {
    document.getElementById('searchLat').value = lat;
    document.getElementById('searchLng').value = lng;
    document.getElementById('locationDisplay').value = `${lat.toFixed(4)}, ${lng.toFixed(4)} (${label})`;

    if (searchMap) {
        if (searchCenterMarker) searchMap.removeLayer(searchCenterMarker);

        searchCenterMarker = L.marker([lat, lng], {
            icon: createHospitalIcon(),
            title: 'Search Center'
        }).addTo(searchMap);

        searchCenterMarker.bindPopup(`<b>Search Center</b><br>${label}`).openPopup();
        searchMap.panTo([lat, lng]);
    }
}

// 2. Registration Location Picker Map
function initRegMap() {
    const mapElement = document.getElementById('regMap');
    if (!mapElement) return;

    if (!regMap) {
        regMap = L.map('regMap', {
            zoomControl: true,
            scrollWheelZoom: false
        }).setView(DEFAULT_COORDS, 11);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap',
            maxZoom: 19
        }).addTo(regMap);

        regMap.on('click', (e) => {
            const { lat, lng } = e.latlng;
            setRegCoordinates(lat, lng);
        });
    }

    regMap.invalidateSize();
}

function setRegCoordinates(lat, lng) {
    document.getElementById('regLat').value = lat.toFixed(6);
    document.getElementById('regLng').value = lng.toFixed(6);

    const helperText = document.getElementById('regLocationText');
    if (helperText) {
        helperText.innerHTML = `<i class="fas fa-check-circle" style="color:var(--success)"></i> Pinned at: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }

    if (regMap) {
        if (regMarker) regMap.removeLayer(regMarker);
        regMarker = L.marker([lat, lng]).addTo(regMap);
        regMarker.bindPopup('Your Donation Location').openPopup();
        regMap.panTo([lat, lng]);
    }
}

// 3. Emergency Hospital Location Picker Map
function initEmergencyMap() {
    const mapElement = document.getElementById('emMap');
    if (!mapElement) return;

    if (!emMap) {
        emMap = L.map('emMap', {
            zoomControl: true,
            scrollWheelZoom: false
        }).setView(DEFAULT_COORDS, 12);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap',
            maxZoom: 19
        }).addTo(emMap);

        emMap.on('click', (e) => {
            const { lat, lng } = e.latlng;
            setEmergencyCoordinates(lat, lng);
        });
    }

    emMap.invalidateSize();
}

function setEmergencyCoordinates(lat, lng) {
    document.getElementById('emLat').value = lat.toFixed(6);
    document.getElementById('emLng').value = lng.toFixed(6);

    const helperText = document.getElementById('emLocationText');
    if (helperText) {
        helperText.innerHTML = `<i class="fas fa-check-circle" style="color:var(--success)"></i> Hospital pinned: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }

    if (emMap) {
        if (emMarker) emMap.removeLayer(emMarker);
        emMarker = L.marker([lat, lng], { icon: createHospitalIcon() }).addTo(emMap);
        emMarker.bindPopup('Hospital Location').openPopup();
        emMap.panTo([lat, lng]);
    }
}

// ==========================================================================
// Geolocation Detection Helpers
// ==========================================================================
function getSearchLocation() {
    if (!navigator.geolocation) {
        showToast('Geolocation is not supported by your browser', 'error');
        return;
    }

    const btn = document.getElementById('getSearchLocationBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="spinner dark"></span> Locating...';
    btn.disabled = true;

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            setSearchLocation(lat, lng, 'My GPS Location');
            btn.innerHTML = '<i class="fas fa-check"></i> Location Set';
            btn.classList.add('btn-success');
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.classList.remove('btn-success');
                btn.disabled = false;
            }, 3000);
            showToast('GPS location detected successfully!', 'success');
        },
        (error) => {
            showToast('Unable to detect GPS position: ' + error.message, 'error');
            btn.innerHTML = originalText;
            btn.disabled = false;
        },
        { enableHighAccuracy: true, timeout: 8000 }
    );
}

function getRegLocation() {
    if (!navigator.geolocation) {
        showToast('Geolocation is not supported', 'error');
        return;
    }

    const btn = document.getElementById('getRegLocationBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="spinner"></span> Detecting...';
    btn.disabled = true;

    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            setRegCoordinates(lat, lng);
            btn.innerHTML = '<i class="fas fa-check"></i> Captured';
            btn.classList.add('btn-success');
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.classList.remove('btn-success');
                btn.disabled = false;
            }, 3000);
            showToast('Location captured successfully!', 'success');
        },
        (err) => {
            showToast('Error getting GPS: ' + err.message, 'error');
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    );
}

function getEmergencyLocation() {
    if (!navigator.geolocation) {
        showToast('Geolocation not supported', 'error');
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (pos) => {
            setEmergencyCoordinates(pos.coords.latitude, pos.coords.longitude);
            showToast('Hospital coordinates set to current location', 'success');
        },
        (err) => {
            showToast('Could not fetch location: ' + err.message, 'error');
        }
    );
}

// ==========================================================================
// Donor Search Implementation
// ==========================================================================
document.getElementById('searchForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const lat = document.getElementById('searchLat').value;
    const lng = document.getElementById('searchLng').value;
    const radius = document.getElementById('searchRadius').value;
    const bloodGroup = document.getElementById('searchBloodGroup').value;

    if (!lat || !lng) {
        showToast('Please capture your location first (click "Detect GPS" or click on the map)', 'error');
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtn = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="spinner"></span> Searching...';
    submitBtn.disabled = true;

    try {
        const response = await fetch(
            `${API_URL}/donors/nearby?lat=${lat}&lng=${lng}&radius=${radius}&blood_group=${encodeURIComponent(bloodGroup)}`,
            {
                headers: { 'Authorization': `Bearer ${authToken}` }
            }
        );

        const result = await response.json();

        if (response.ok) {
            displayDonors(result, parseFloat(lat), parseFloat(lng), parseFloat(radius));
            showToast(`Found ${result.total} available ${bloodGroup} donor(s) within ${radius} km!`, 'success');
        } else {
            showToast(result.error || 'Search failed', 'error');
        }
    } catch (error) {
        showToast('Server connection error. Please verify backend service.', 'error');
    } finally {
        submitBtn.innerHTML = originalBtn;
        submitBtn.disabled = false;
    }
});

function displayDonors(data, searchLat, searchLng, searchRadiusKm) {
    const countElem = document.getElementById('donorCount');
    if (countElem) countElem.textContent = data.total;

    const container = document.getElementById('donorResults');
    container.innerHTML = '';

    // Clear previous markers
    if (donorMarkersGroup) donorMarkersGroup.clearLayers();
    if (searchCircle && searchMap) searchMap.removeLayer(searchCircle);

    // Draw search radius circle on map
    if (searchMap && searchLat && searchLng) {
        searchCircle = L.circle([searchLat, searchLng], {
            color: '#e11d48',
            fillColor: '#e11d48',
            fillOpacity: 0.1,
            radius: (searchRadiusKm || 10) * 1000
        }).addTo(searchMap);

        searchMap.fitBounds(searchCircle.getBounds(), { padding: [30, 30] });
    }

    if (data.total === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <div class="empty-state-icon">
                    <i class="fas fa-user-slash"></i>
                </div>
                <h3>No Matching Donors Nearby</h3>
                <p>We couldn't find active ${data.blood_group} donors within ${data.radius} km. Try expanding the search radius or post an emergency request.</p>
                <button class="btn btn-primary" style="margin-top: 16px;" onclick="switchTab('emergency')">
                    <i class="fas fa-bullhorn"></i> Post Emergency Alert
                </button>
            </div>
        `;
        return;
    }

    const bounds = L.latLngBounds([[searchLat, searchLng]]);

    data.donors.forEach((donor, index) => {
        const card = document.createElement('div');
        card.className = 'donor-card';
        card.id = `donor-card-${donor.id}`;

        const donorInitial = (donor.name || 'D').charAt(0).toUpperCase();
        const distanceFormatted = (typeof donor.distance === 'number') ? donor.distance.toFixed(2) : 'Nearby';

        card.innerHTML = `
            <div>
                <div class="donor-card-top">
                    <div class="donor-avatar">${donorInitial}</div>
                    <div class="donor-details">
                        <h4>${escapeHtml(donor.name)}</h4>
                        <p><i class="fas fa-map-marker-alt"></i> ${escapeHtml(donor.address || 'Address provided')}</p>
                    </div>
                </div>

                <div class="badges-row">
                    <span class="blood-badge"><i class="fas fa-tint"></i> ${donor.blood_group}</span>
                    <span class="distance-badge"><i class="fas fa-location-arrow"></i> ${distanceFormatted} km</span>
                    <span class="status-badge status-available"><i class="fas fa-check-circle"></i> Available</span>
                </div>
            </div>

            <div class="donor-card-actions">
                <a href="tel:${encodeURIComponent(donor.phone)}" class="btn btn-success btn-sm">
                    <i class="fas fa-phone-alt"></i> Call
                </a>
                <a href="mailto:${encodeURIComponent(donor.email)}?subject=Urgent Blood Donation Inquiry" class="btn btn-outline btn-sm">
                    <i class="fas fa-envelope"></i> Email
                </a>
                <button class="btn btn-ghost btn-sm" onclick="focusDonorOnMap(${donor.latitude}, ${donor.longitude}, '${escapeHtml(donor.name)}', '${donor.blood_group}')" title="Show on Map">
                    <i class="fas fa-map-pin"></i>
                </button>
            </div>
        `;

        container.appendChild(card);

        // Add pin on the Leaflet map
        if (donor.latitude && donor.longitude && donorMarkersGroup) {
            const donorLatLng = [parseFloat(donor.latitude), parseFloat(donor.longitude)];
            bounds.extend(donorLatLng);

            const marker = L.marker(donorLatLng, {
                icon: createBloodIcon(donor.blood_group),
                title: donor.name
            });

            marker.bindPopup(`
                <div style="font-family: inherit; padding: 4px;">
                    <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">${escapeHtml(donor.name)}</div>
                    <div style="font-size: 12px; color: #64748b; margin-bottom: 8px;">
                        <span style="background: #ffe4e6; color: #9f1239; font-weight: 800; padding: 2px 6px; border-radius: 4px;">${donor.blood_group}</span>
                        ${distanceFormatted} km away
                    </div>
                    <div style="display: flex; gap: 6px; margin-top: 6px;">
                        <a href="tel:${encodeURIComponent(donor.phone)}" style="background: #10b981; color: white; padding: 4px 10px; border-radius: 6px; text-decoration: none; font-size: 11px; font-weight: 700;">Call</a>
                        <a href="mailto:${encodeURIComponent(donor.email)}" style="background: #0284c7; color: white; padding: 4px 10px; border-radius: 6px; text-decoration: none; font-size: 11px; font-weight: 700;">Email</a>
                    </div>
                </div>
            `);

            donorMarkersGroup.addLayer(marker);
        }
    });

    if (searchMap && bounds.isValid()) {
        searchMap.fitBounds(bounds, { padding: [40, 40] });
    }
}

function focusDonorOnMap(lat, lng, name, bloodGroup) {
    if (!searchMap) return;
    searchMap.setView([lat, lng], 15, { animate: true });
    showToast(`Focused on donor: ${name} (${bloodGroup})`, 'info');
}

// ==========================================================================
// Emergency Requests Implementation
// ==========================================================================
document.getElementById('emergencyForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtn = submitBtn.innerHTML;

    const lat = document.getElementById('emLat').value;
    const lng = document.getElementById('emLng').value;

    if (!lat || !lng) {
        showToast('Please specify the hospital latitude and longitude using the map picker or GPS', 'error');
        return;
    }

    submitBtn.innerHTML = '<span class="spinner"></span> Broadcasting Alert...';
    submitBtn.disabled = true;

    const data = {
        patientName: document.getElementById('emPatientName').value.trim(),
        bloodGroup: document.getElementById('emBloodGroup').value,
        unitsNeeded: parseInt(document.getElementById('emUnits').value, 10),
        hospitalName: document.getElementById('emHospital').value.trim(),
        hospitalAddress: document.getElementById('emAddress').value.trim(),
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        urgency: document.getElementById('emUrgency').value
    };

    try {
        const response = await fetch(`${API_URL}/emergency`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            showToast(`Emergency alert broadcast successfully! ${result.donorsNotified || 0} nearby donors notified.`, 'success', 6000);
            document.getElementById('emergencyForm').reset();
            loadActiveRequests();
            switchTab('requests');
        } else {
            showToast(result.error || 'Emergency request failed', 'error');
        }
    } catch (error) {
        showToast('Network error while broadcasting emergency alert.', 'error');
    } finally {
        submitBtn.innerHTML = originalBtn;
        submitBtn.disabled = false;
    }
});

async function loadActiveRequests() {
    const container = document.getElementById('activeRequests');
    if (!container) return;

    try {
        const response = await fetch(`${API_URL}/emergency`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const result = await response.json();
        container.innerHTML = '';

        if (!response.ok || !result.requests || result.requests.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <i class="fas fa-heart"></i>
                    </div>
                    <h3>No Active Emergency Requests</h3>
                    <p>There are no urgent blood requests pending at this moment. All requests have been fulfilled or resolved.</p>
                </div>
            `;
            return;
        }

        result.requests.forEach(req => {
            const card = document.createElement('div');
            const urgencyClass = (req.urgency || '').toLowerCase().includes('crit') ? 'crit' : 
                                 (req.urgency || '').toLowerCase().includes('med') ? 'med' : 'low';
            
            card.className = `emergency-request-card ${urgencyClass}`;

            const timeStr = req.created_at ? formatTimeAgo(new Date(req.created_at)) : 'Recently';

            card.innerHTML = `
                <div class="req-header">
                    <div>
                        <div class="req-patient-title">
                            <i class="fas fa-user-injured" style="color: var(--primary); margin-right: 6px;"></i>
                            ${escapeHtml(req.patient_name || 'Patient in Need')}
                        </div>
                        <div style="display: flex; gap: 8px; align-items: center; margin-top: 4px;">
                            <span class="blood-badge"><i class="fas fa-tint"></i> ${req.blood_group}</span>
                            <span class="urgency-pill urgency-${urgencyClass}">
                                <i class="fas fa-bolt"></i> ${req.urgency || 'MEDIUM'}
                            </span>
                        </div>
                    </div>
                    <div style="font-size: 12px; color: var(--text-muted); font-weight: 600;">
                        <i class="fas fa-clock"></i> ${timeStr}
                    </div>
                </div>

                <div class="req-info-grid">
                    <div class="req-info-item">
                        <span>Hospital</span>
                        <strong><i class="fas fa-hospital" style="color: var(--secondary)"></i> ${escapeHtml(req.hospital_name || 'Hospital')}</strong>
                    </div>
                    <div class="req-info-item">
                        <span>Units Needed</span>
                        <strong><i class="fas fa-vials" style="color: var(--primary)"></i> ${req.units_needed} Unit(s)</strong>
                    </div>
                    <div class="req-info-item">
                        <span>Status</span>
                        <strong style="color: var(--success);"><i class="fas fa-circle" style="font-size: 9px;"></i> ${req.status || 'ACTIVE'}</strong>
                    </div>
                </div>

                <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 14px;">
                    <i class="fas fa-map-marker-alt" style="color: var(--danger)"></i> ${escapeHtml(req.hospital_address || 'Address not listed')}
                </div>

                <div class="req-actions">
                    <div style="font-size: 12px; color: var(--text-muted);">
                        Requester: <strong>${escapeHtml(req.requester_name || 'Hospital Staff')}</strong>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        ${req.requester_phone ? `
                            <a href="tel:${encodeURIComponent(req.requester_phone)}" class="btn btn-success btn-sm">
                                <i class="fas fa-phone-alt"></i> Contact Coordinator
                            </a>
                        ` : ''}
                        <button class="btn btn-primary btn-sm" onclick="showToast('Thank you for pledging! Please proceed to ${escapeHtml(req.hospital_name || 'the hospital')}', 'success', 7000)">
                            <i class="fas fa-hand-holding-heart"></i> I Can Donate
                        </button>
                    </div>
                </div>
            `;

            container.appendChild(card);
        });

    } catch (error) {
        container.innerHTML = `
            <div class="empty-state">
                <p style="color: var(--danger);">Failed to load active requests. Please ensure backend server is running.</p>
            </div>
        `;
    }
}

// ==========================================================================
// Formatting & Security Helpers
// ==========================================================================
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
}
