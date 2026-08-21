require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// KeyAuth API configuration
const KEYAUTH_API_URL = 'https://keyauth.win/api/seller/';
const SELLER_KEY = process.env.KEYAUTH_SELLER_KEY;

// IP Rate Limiting & Caching Cache (stores IP -> { key, timestamp })
const ipCache = new Map();
const COOLDOWN_PERIOD = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Generate Key Endpoint
app.post('/api/generate-key', async (req, res) => {
    try {
        if (!SELLER_KEY) {
            return res.status(500).json({ success: false, message: 'Server configuration error: Missing Seller Key' });
        }

        // Get Client IP Address
        let clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        if (typeof clientIp === 'string') {
            clientIp = clientIp.split(',')[0].trim();
        }

        // Check if IP is in cache and within the 24 hour cooldown
        if (ipCache.has(clientIp)) {
            const cachedData = ipCache.get(clientIp);
            const timeSinceGenerated = Date.now() - cachedData.timestamp;

            if (timeSinceGenerated < COOLDOWN_PERIOD) {
                // Return the same key they generated previously
                console.log(`Returning cached key for IP: ${clientIp}`);
                return res.json({ success: true, key: cachedData.key, cached: true });
            } else {
                // Cooldown expired, remove from cache to generate a new one
                ipCache.delete(clientIp);
            }
        }

        // Make request to KeyAuth API
        const response = await axios.get(KEYAUTH_API_URL, {
            params: {
                sellerkey: SELLER_KEY,
                type: 'add',
                expiry: 1, // 1 day expiry
                mask: 'VISION-******-******',
                level: 1,
                amount: 1,
                format: 'json'
            }
        });

        if (response.data && response.data.success) {
            const generatedKey = response.data.key;
            
            // Store the generated key and timestamp in the cache for this IP
            ipCache.set(clientIp, { key: generatedKey, timestamp: Date.now() });
            
            return res.json({ success: true, key: generatedKey, cached: false });
        } else {
            return res.status(400).json({ success: false, message: response.data.message || 'Failed to generate key from KeyAuth' });
        }

    } catch (error) {
        console.error('Error generating key:', error.message);
        res.status(500).json({ success: false, message: 'Internal server error while generating key' });
    }
});
// Check Existing Key Endpoint
app.get('/api/check-key', (req, res) => {
    let clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if (typeof clientIp === 'string') {
        clientIp = clientIp.split(',')[0].trim();
    }

    if (ipCache.has(clientIp)) {
        const cachedData = ipCache.get(clientIp);
        const timeSinceGenerated = Date.now() - cachedData.timestamp;

        if (timeSinceGenerated < COOLDOWN_PERIOD) {
            return res.json({ success: true, key: cachedData.key });
        } else {
            ipCache.delete(clientIp);
        }
    }
    
    return res.json({ success: false });
});

// LootLabs Pingback / Webhook Endpoint
app.post('/api/lootlabs-pingback', (req, res) => {
    // Here you would normally verify the payload from LootLabs
    // using a secret to ensure the request is authentic
    const payload = req.body;
    
    console.log('Received LootLabs pingback:', payload);
    
    // Process the completion (e.g., store in database, unlock access)
    // For this demonstration, we just log and acknowledge
    
    res.status(200).send('Pingback received');
});
// Routine to delete all expired users/keys automatically
const CLEANUP_INTERVAL = 1000 * 60 * 60 * 24; // Run once every 24 hours
setInterval(async () => {
    if (!SELLER_KEY) return;
    try {
        console.log('Running automatic cleanup of used keys...');
        const response = await axios.get(KEYAUTH_API_URL, {
            params: {
                sellerkey: SELLER_KEY,
                type: 'delused', // KeyAuth endpoint to delete all used keys
            }
        });
        if (response.data && response.data.success) {
            console.log('Successfully deleted used/expired keys from KeyAuth.');
        } else {
            console.error('Failed to delete keys:', response.data.message);
        }
    } catch (error) {
        console.error('Error during expired key cleanup:', error.message);
    }
}, CLEANUP_INTERVAL);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
