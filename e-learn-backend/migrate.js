const { Client } = require('pg');
const client = new Client({ connectionString: 'postgres://samrapqr:%23rMgC52s%5Di7%23G(W38hgH@samra-azure-db.postgres.database.azure.com:5432/elearn?sslmode=require' });
client.connect().then(() => client.query('ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "intro_video_url" TEXT; ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "original_price" DOUBLE PRECISION;')).then(() => { console.log('Successfully added columns'); process.exit(0); }).catch(e => { console.error(e); process.exit(1); });
