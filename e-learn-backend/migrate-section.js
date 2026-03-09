// migrate-section.js
require('dotenv').config();
const { Pool } = require('pg');

async function main() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    const client = await pool.connect();
    try {
        await client.query(`ALTER TABLE "Section" ADD COLUMN IF NOT EXISTS description TEXT;`);
        console.log('✓ description added to Section');
        await client.query(`ALTER TABLE "Section" ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;`);
        console.log('✓ thumbnail_url added to Section');
        console.log('Done!');
    } finally {
        client.release();
        await pool.end();
    }
}
main().catch(e => { console.error(e); process.exit(1); });
