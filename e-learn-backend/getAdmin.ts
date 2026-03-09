import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
dotenv.config();

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const admin = await prisma.admin.findFirst();
    if (admin) {
        console.log('FOUND ADMIN:', admin.email);
    } else {
        console.log('NO ADMIN FOUND');
        // Let's create one for testing
        const bcrypt = require('bcrypt');
        const hash = await bcrypt.hash('admin123', 10);
        const newAdmin = await prisma.admin.create({
            data: {
                email: 'admin@elearn.com',
                password_hash: hash,
                role: 'SUPERADMIN'
            }
        });
        console.log('CREATED ADMIN:', newAdmin.email, 'admin123');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
