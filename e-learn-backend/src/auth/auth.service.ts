import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService) { }

    async adminLogin(email: string, pass: string) {
        const admin = await this.prisma.admin.findUnique({ where: { email } });

        if (!admin) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isMatch = await bcrypt.compare(pass, admin.password_hash);
        if (!isMatch) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const payload = { sub: admin.id, email: admin.email, role: admin.role };
        const secret = process.env.JWT_SECRET || 'super-secret-jwt-key';

        return {
            access_token: jwt.sign(payload, secret, { expiresIn: '1d' }),
        };
    }
}
