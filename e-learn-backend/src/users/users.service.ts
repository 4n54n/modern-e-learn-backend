import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdminService } from '../admin/admin.service';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class UsersService {
    constructor(
        private prisma: PrismaService,
        private adminService: AdminService,
    ) { }

    async findOrCreateUser(email: string, name: string, googleId: string) {
        let user = await this.prisma.user.findUnique({ where: { email } });
        const isNew = !user;
        if (!user) {
            user = await this.prisma.user.create({
                data: { email, name, google_id: googleId }
            });
        }
        // Issue a signed JWT for this user
        const secret = process.env.JWT_SECRET || 'super-secret-jwt-key';
        const access_token = jwt.sign(
            { sub: user.id, email: user.email, role: 'user' },
            secret,
            { expiresIn: '30d' },
        );

        // 🔔 Telegram alert for new registration (non-blocking)
        if (isNew) {
            const alertMsg =
                `🎉 <b>New User Registered!</b>\n` +
                `👤 Name: ${name}\n` +
                `📧 Email: ${email}\n` +
                `🕐 Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`;
            this.adminService.sendTelegramAlert(alertMsg).catch(() => { });
        }

        return { user, access_token };
    }

    async registerDevice(userId: string, deviceId: string, fcmToken?: string) {
        const token = fcmToken || '';

        // If this device was previously anonymous, remove it (user is now logged in)
        // Clean up by BOTH device_id AND fcm_token to handle edge cases where
        // the device_id changed but the FCM token is the same (e.g. token refresh before login)
        await this.prisma.anonymousDevice.deleteMany({
            where: {
                OR: [
                    { device_id: deviceId },
                    ...(token ? [{ fcm_token: token }] : []),
                ],
            },
        });

        // Bind device if not currently bound
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (user && !user.primary_device_id) {
            await this.prisma.user.update({
                where: { id: userId },
                data: { primary_device_id: deviceId }
            });
        }

        let device = await this.prisma.device.findFirst({
            where: { user_id: userId, device_id: deviceId }
        });

        if (device) {
            return this.prisma.device.update({
                where: { id: device.id },
                data: { fcm_token: token, last_active: new Date() }
            });
        }

        return this.prisma.device.create({
            data: { user_id: userId, device_id: deviceId, fcm_token: token }
        });
    }

    /** Register an FCM token for a device that has NOT logged in yet */
    async registerAnonymousDevice(deviceId: string, fcmToken: string) {
        return this.prisma.anonymousDevice.upsert({
            where: { device_id: deviceId },
            update: { fcm_token: fcmToken, last_active: new Date() },
            create: { device_id: deviceId, fcm_token: fcmToken },
        });
    }

    async getUserProfile(userId: string) {
        return this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true, primary_device_id: true }
        });
    }

    async clearDevice(userId: string) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { primary_device_id: null }
        });
    }

    async getPurchasesForUser(userId: string) {
        return this.prisma.purchase.findMany({
            where: {
                user_id: userId,
                status: 'SUCCESS',
                OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
            } as any,
            orderBy: { created_at: 'desc' },
        });
    }

    async getAllUsers() {
        return this.prisma.user.findMany({
            include: {
                devices: { select: { id: true, last_active: true } },
                purchases: {
                    where: { status: 'SUCCESS' },
                    include: { course: { select: { id: true, title: true, price: true } } },
                    orderBy: { created_at: 'desc' },
                },
            },
            orderBy: { created_at: 'desc' },
        });
    }

    async updatePurchase(purchaseId: string, data: { status?: string; expires_at?: string | null; amount_paid?: number }) {
        const update: any = {};
        if (data.status !== undefined) update.status = data.status;
        if (data.amount_paid !== undefined) update.amount_paid = data.amount_paid;
        if ('expires_at' in data) {
            update.expires_at = data.expires_at ? new Date(data.expires_at) : null;
        }
        return this.prisma.purchase.update({ where: { id: purchaseId }, data: update });
    }
}
