import { defineConfig } from '@prisma/config';
import * as fs from 'fs';

let envUrl = process.env.DATABASE_URL;
if (!envUrl) {
    try {
        const envFile = fs.readFileSync('.env', 'utf-8');
        const match = envFile.match(/DATABASE_URL="?([^"\n]+)"?/);
        if (match) envUrl = match[1];
    } catch (e) { }
}

export default defineConfig({
    datasource: {
        url: envUrl || "postgresql://dummy:dummy@localhost:5432/dummy"
    }
});
