/**
 * Tests device registration + FCM token retrieval against the live Azure API.
 * Run: node test_device_reg.js
 */
const { Client } = require('pg');

const db = new Client({
    host: 'samra-azure-db.postgres.database.azure.com',
    port: 5432,
    database: 'elearn',
    user: 'samrapqr',
    password: '#rMgC52s]i7#G(W38hgH',
    ssl: { rejectUnauthorized: false },
});

const API = 'https://api.samra.intoai.in';

async function run() {
    await db.connect();

    // Get the first user from DB
    const users = await db.query('SELECT id, email FROM "User" LIMIT 1');
    if (users.rowCount === 0) {
        console.log('❌ No users in DB at all — has anyone ever logged in?');
        await db.end(); return;
    }

    const user = users.rows[0];
    console.log(`✔ Found user: ${user.email} (${user.id})\n`);

    // Try calling the device registration endpoint with a test token
    const testPayload = {
        deviceId: 'test-diagnostic-device',
        fcmToken: 'test_fcm_diagnostic_token_12345',
    };

    console.log(`📡 POST ${API}/users/${user.id}/devices`);
    console.log(`   body: ${JSON.stringify(testPayload)}\n`);

    try {
        const https = require('https');
        const body = JSON.stringify(testPayload);

        const result = await new Promise((resolve, reject) => {
            const url = new URL(`${API}/users/${user.id}/devices`);
            const req = https.request({
                hostname: url.hostname,
                path: url.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(body),
                },
            }, res => {
                let data = '';
                res.on('data', d => data += d);
                res.on('end', () => resolve({ status: res.statusCode, body: data }));
            });
            req.on('error', reject);
            req.write(body);
            req.end();
        });

        console.log(`📊 Response status: ${result.status}`);
        console.log(`📊 Response body:   ${result.body}\n`);

        if (result.status >= 200 && result.status < 300) {
            console.log('✅ Device registration endpoint is working!');
        } else {
            console.log('❌ Device registration returned an error — see response above');
        }
    } catch (e) {
        console.log(`❌ Network error: ${e.message}`);
    }

    // Also check Device table count
    const count = await db.query('SELECT COUNT(*) FROM "Device"');
    console.log(`\n📱 Total Device records in DB: ${count.rows[0].count}`);

    // Clean up test record if it was inserted
    await db.query(`DELETE FROM "Device" WHERE device_id = 'test-diagnostic-device'`);

    await db.end();
}

run().catch(e => { console.error('Fatal:', e.message); });
