/**
 * FCM Diagnostic Script
 * Reads FCM tokens from DB, sends a test notification, and shows per-token results.
 * Run: node fcm_diagnostic.js
 */
const { Client } = require('pg');
const admin = require('firebase-admin');

// ── DB Config ──────────────────────────────────────────────────────────────
const db = new Client({
    host: 'samra-azure-db.postgres.database.azure.com',
    port: 5432,
    database: 'elearn',
    user: 'samrapqr',
    password: '#rMgC52s]i7#G(W38hgH',
    ssl: { rejectUnauthorized: false },
});

// ── Firebase Config ────────────────────────────────────────────────────────
const privateKey = `-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC7CtU+anIf0tky\n2wEopEjxJQ4GVLLhTV0DkP3XA+3yb6fRGE3stuItZ1DODoX2LBnloHxvFfdR+Mg3\n228ZjIMlBcpG08cnrOUD8dvYapEhbIXSYX9UmjaiPdG4kS3TXSntrSUEMRFq+J2h\nJMvQ+imOrkUAUW+TNjA9scXZ13cJHQ7aMyq+80MXrKAEmlKiYpZNwTPghBnbIvA3\nLk1+aNfRhrq/S9x5Fbw+NNEw9Jd89W+9qYH2jSzLCAq/fNsV3bdSM9e0368IQ4gV\nrd0gk2GvWyyCusJMUMcvQWXPrZZCyNiWjO4WpRc6hh52u1XEzYb2vhgOWzeRRSH2\nzCeJo0rVAgMBAAECggEAKSLVSmBj0B7xuO8UnqkfB7YUEw1euBFpMwcY5MiO9QJc\ngK6dOMHyFXVC/saP7Ne/LFLy+wV0OtmBw1Ml6JMQJrzSw2gBRXcPeSIgrUSmvZie\nB+p8dBFkkaMR9Estrm4vcf/iA7187K9YD6BFmSTjreci8tJ2PQSucGsgLexm2CBl\nG16Jutxe5V7Nz9rH6tMA1Gu+YMW6I9XssVu9+8E8qnPxUTjm/+dY8rwz8NZM2PM2\nLm7WH1gThtjE6xn3vNqu8chh4Wfz7dckQNTjA0fwteKN0c7fjUZgCBiRKniJCXPt\nraWN5ExeOp42oTXxRtRI9EBB0Jk7f0SSXTm/8hU/owKBgQDitskA13sLftR8Lm3y\nPisck0JdrWwTzbfnbiz30stD/uhSSheSc/euSomLk/dMNYmHgXQUWe8TRZUtxUSi\nTmMwJ9kf7IX13VOGzWx56oMeatawtW2R9a39WCMhfqM9XPPg6vS16S46hAyrYXQW\nX6Ht+m2bXilJMA1KfpmYRgEDowKBgQDTNCSi0JmxPR0IO6ZfdQdtzaG7ZdOeQ5+4\n4biR86ILt0F+qknSEJW9kEHf0IuzEhDn3BFBs/zZRZMM70xtjPmRago6/yfILfbr\n2prINPRMSxxvbwx1/G2tXqbRkfQp2UjGzJl61C7yZj1S3+npw5QXFIBVmTzqK50j\n0b9AWHkfJwKBgBvchrs5v/9bqNVSB2T7yuSKHF/SzjNo1q70VUZne19x1i82t8rh\nwZCDzH+AwaV19t7WQ+O0YbMmm/yx/4tKwtnKK97GfHgIqRkp6ajZ7x8v1g6FXV/Q\np38486hMHdeOstHzTfuFGo9KZxwwr8mIGyhZ3Fp5qe06oIeFI28ZO0qtAoGBAJ42\no3MsHNX+1+7A8IL1ohkJP6yoPPyD3/SZcrAy+CMapn+ChUZNkj6tAAvvp5b/Y5as\n7mhvsmv4iI3Z/UDbqGDcNMm5Nk3o0N4hpm1v7cnxQl3frE/+RxLmosS/N07aLIBv\n6FFw/bIsEKgygIHTNu6LNw/oeQ9amJ6qk0BahnFlAoGBALUfABAWFzJkHnR1onk1\nxAxvrXNcGpzZcDnbSezg91JUvBXK/QN76duIXuZosIYswYVl/X0FTk5JvNelis5f\ni9E8W/6GwVbU0fm8eCMDwqVHkneehCEYuGlLX6DOaDcUBx8pLXakDSXMcQpplqvi\nsiFAhwpdMry02vk3Y6OkpjSJ\n-----END PRIVATE KEY-----\n`;

admin.initializeApp({
    credential: admin.credential.cert({
        projectId: 'samra-1',
        clientEmail: 'firebase-adminsdk-fbsvc@samra-1.iam.gserviceaccount.com',
        privateKey,
    }),
});

async function run() {
    await db.connect();
    console.log('✔ Connected to DB\n');

    // List all FCM tokens stored in Device table
    const devRes = await db.query(`SELECT id, user_id, device_id, fcm_token, last_active FROM "Device" ORDER BY last_active DESC`);
    console.log(`📱 ${devRes.rowCount} device(s) in DB:`);
    devRes.rows.forEach((r, i) => {
        console.log(`  [${i}] user=${r.user_id.substring(0, 8)}… device=${r.device_id.substring(0, 12)}… token=${r.fcm_token.substring(0, 30)}… active=${r.last_active}`);
    });

    const anonRes = await db.query(`SELECT id, device_id, fcm_token, last_active FROM "AnonymousDevice" ORDER BY last_active DESC`);
    console.log(`\n👤 ${anonRes.rowCount} anonymous device(s) in DB\n`);

    const tokens = devRes.rows.map(r => r.fcm_token).filter(Boolean);
    if (tokens.length === 0) {
        console.log('❌ No FCM tokens found in DB. The app has not registered any device.');
        await db.end(); return;
    }

    console.log(`\n🚀 Sending test FCM to ${tokens.length} token(s)…\n`);

    const response = await admin.messaging().sendEachForMulticast({
        tokens,
        notification: { title: '🔔 FCM Test', body: 'If you see this, FCM is working!' },
        data: { title: 'FCM Test', body: 'FCM diagnostic', click_action: 'FLUTTER_NOTIFICATION_CLICK' },
        android: {
            priority: 'high',
            notification: { sound: 'default', channelId: 'fcm_default_channel' },
        },
    });

    console.log(`📊 Results: ${response.successCount} success / ${response.failureCount} failed\n`);
    response.responses.forEach((r, i) => {
        const token = tokens[i].substring(0, 30) + '…';
        if (r.success) {
            console.log(`  ✅ Token[${i}] ${token} → messageId: ${r.messageId}`);
        } else {
            console.log(`  ❌ Token[${i}] ${token} → Error: ${r.error?.code} — ${r.error?.message}`);
        }
    });

    await db.end();
}

run().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
