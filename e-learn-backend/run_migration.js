const { Client } = require('pg');

const db = new Client({
    host: 'samra-azure-db.postgres.database.azure.com',
    port: 5432,
    database: 'elearn',
    user: 'samrapqr',
    password: '#rMgC52s]i7#G(W38hgH',
    ssl: { rejectUnauthorized: false },
});

async function run() {
    await db.connect();
    await db.query(`ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS target_email TEXT`);
    console.log('✔ Added target_email column to Notification');
    await db.end();
    console.log('Migration complete!');
}

run().catch((e) => { console.error('Migration failed:', e.message); process.exit(1); });
