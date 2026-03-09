const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://samrapqr:%23rMgC52s%5Di7%23G(W38hgH@samra-azure-db.postgres.database.azure.com:5432/postgres?sslmode=require'
});

async function dropTables() {
    const client = await pool.connect();
    try {
        console.log('Connected to postgres database. Dropping old tables...');
        await client.query('DROP SCHEMA public CASCADE;');
        await client.query('CREATE SCHEMA public;');
        console.log('Old tables successfully removed from postgres db!');
    } catch (error) {
        console.error('Error dropping tables:', error);
    } finally {
        client.release();
        pool.end();
    }
}

dropTables();
