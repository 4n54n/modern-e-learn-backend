const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://samrapqr:%23rMgC52s%5Di7%23G(W38hgH@samra-azure-db.postgres.database.azure.com:5432/postgres?sslmode=require'
});

async function createDatabase() {
    const client = await pool.connect();
    try {
        console.log('Connected to postgres database. Creating elearn db...');
        await client.query('CREATE DATABASE elearn;');
        console.log('Database elearn created successfully!');
    } catch (error) {
        if (error.code === '42P04') {
            console.log('Database elearn already exists.');
        } else {
            console.error('Error creating database:', error);
        }
    } finally {
        client.release();
        pool.end();
    }
}

createDatabase();
