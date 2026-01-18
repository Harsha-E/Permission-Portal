/**
 * Vercel Serverless Function
 * Path: api/generate-pass.js
 */
const jwt = require('jsonwebtoken');

// Environment variable: process.env.JWT_SECRET
// Environment variable: process.env.ADMIN_API_KEY (Simple auth check)

module.exports = async (req, res) => {
    // 1. CORS Headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { permissionId, studentId, expiryDate, apiKey } = req.body;

        // 2. Simple API Key Check (Prevent public abuse)
        if (apiKey !== process.env.CLIENT_API_KEY) {
            return res.status(401).json({ error: 'Unauthorized Client' });
        }

        if (!permissionId || !studentId) {
            return res.status(400).json({ error: 'Missing Data' });
        }

        // 3. Construct Payload
        const payload = {
            pid: permissionId,
            sid: studentId,
            exp: Math.floor(new Date(expiryDate).getTime() / 1000), // UNIX Timestamp
            iss: 'mvgr-unipass-secure'
        };

        // 4. Sign with Server Secret (The "Seal")
        // This hash is what the Guard App will verify
        const signedHash = jwt.sign(payload, process.env.JWT_SECRET);

        // 5. Generate QR Data URL (Secure URL that Guard App scans)
        // The guard app must have the public key or shared secret to verify `hash` param
        const qrData = `https://harsha-e.github.io/UNI-Pass/public/checker.html?id=${permissionId}&hash=${signedHash}`;

        res.status(200).json({ 
            success: true, 
            signedHash: signedHash,
            qrData: qrData
        });

    } catch (error) {
        console.error("Signing Error:", error);
        res.status(500).json({ error: 'Internal Signing Error' });
    }
};