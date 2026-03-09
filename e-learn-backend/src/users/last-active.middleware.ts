import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class LastActiveMiddleware implements NestMiddleware {
    constructor(private prisma: PrismaService) { }

    async use(req: Request, res: Response, next: NextFunction) {
        // Run the update in background — never block the request
        this.updateLastActive(req).catch(() => { });
        next();
    }

    private async updateLastActive(req: Request) {
        // Extract Bearer token
        const auth = req.headers['authorization'];
        if (!auth?.startsWith('Bearer ')) return;
        const token = auth.slice(7);

        let payload: any;
        try {
            payload = jwt.verify(token, process.env.JWT_SECRET || 'super-secret-jwt-key');
        } catch {
            return; // invalid / expired token — skip
        }

        // Only act on user-role JWTs (not admin tokens)
        if (payload?.role !== 'user' || !payload?.sub) return;

        const userId: string = payload.sub;

        // Throttle: only update if last device activity was > 5 minutes ago.
        // This avoids hammering the DB on every single API call from the app.
        const recentDevice = await this.prisma.device.findFirst({
            where: {
                user_id: userId,
                last_active: { gt: new Date(Date.now() - 5 * 60 * 1000) },
            },
            select: { id: true },
        });
        if (recentDevice) return; // already up-to-date

        // Update all devices for this user
        await this.prisma.device.updateMany({
            where: { user_id: userId },
            data: { last_active: new Date() },
        });
    }
}
