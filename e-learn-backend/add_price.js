const { Client } = require('pg');

async function main() {
    const client = new Client({
        connectionString: 'postgresql://samrapqr:%23rMgC52s%5Di7%23G(W38hgH@samra-azure-db.postgres.database.azure.com:5432/elearn?sslmode=require'
    });

    try {
        await client.connect();
        console.log("Connected to DB!");

        await client.query('ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "original_price" DOUBLE PRECISION;');
        console.log("Successfully added original_price column!");

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await client.end();
    }
}

main();
