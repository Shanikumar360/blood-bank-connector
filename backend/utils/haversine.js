// ============================================================
// LINE 1: Function export karne ke liye
// Yeh file do locations ke beech distance nikalegi
// ============================================================

function calculateDistance(lat1, lng1, lat2, lng2) {
    
    // LINE 2: Earth ka radius kilometers mein
    // 6371 km = Average radius (pole pe 6357, equator pe 6378)
    const R = 6371;
    
    // LINE 3: Degree ko radian mein convert karne ka formula
    // Math.PI = 3.14159...
    // 180 se divide karne se degree radian ban jata hai
    const toRad = (degree) => degree * (Math.PI / 180);
    
    // LINE 4: Latitude ka difference
    // lat2 = hospital, lat1 = donor
    const dLat = toRad(lat2 - lat1);
    
    // LINE 5: Longitude ka difference
    const dLng = toRad(lng2 - lng1);
    
    // LINE 6: Haversine formula (spherical trigonometry)
    // a = square of half the chord length between the points
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    // LINE 7: Central angle in radians
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    // LINE 8: Final distance = radius × angle
    return R * c;
}

// LINE 9: Export karo taaki baaki files use kar sake
module.exports = { calculateDistance };