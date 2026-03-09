import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';
import * as https from 'https';

@Injectable()
export class AdminService {
    constructor(private prisma: PrismaService) { }

    async getDashboardStats() {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [
            totalUsers,
            activeCourses,
            inactiveCourses,
            pendingNotifications,
            recentPurchases,
            allPurchases,
        ] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.course.count({ where: { is_active: true } }),
            this.prisma.course.count({ where: { is_active: false } }),
            this.prisma.notification.count({ where: { status: 'PENDING' } }),
            this.prisma.purchase.findMany({
                where: { status: 'SUCCESS' },
                include: { user: true, course: true },
                orderBy: { created_at: 'desc' },
                take: 6,
            }),
            this.prisma.purchase.findMany({
                where: { status: 'SUCCESS' },
                select: { amount_paid: true, created_at: true },
                orderBy: { created_at: 'asc' },
            }),
        ]);

        // Total & this-month revenue
        const totalRevenue = allPurchases.reduce((s, p) => s + p.amount_paid, 0);
        const revenueThisMonth = allPurchases
            .filter(p => new Date(p.created_at) >= startOfMonth)
            .reduce((s, p) => s + p.amount_paid, 0);

        // Monthly revenue for last 6 months (INR)
        const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
            const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
            const end = new Date(now.getFullYear(), now.getMonth() - (5 - i) + 1, 1);
            const revenue = allPurchases
                .filter(p => new Date(p.created_at) >= d && new Date(p.created_at) < end)
                .reduce((s, p) => s + p.amount_paid, 0);
            return {
                month: d.toLocaleString('en-IN', { month: 'short' }),
                revenue,
            };
        });

        return {
            totalUsers,
            activeCourses,
            inactiveCourses,
            totalRevenue,
            revenueThisMonth,
            pendingNotifications,
            monthlyRevenue,
            recentPurchases: recentPurchases.map(p => ({
                id: p.id,
                userName: p.user?.name ?? 'Unknown',
                userEmail: p.user?.email ?? '',
                courseTitle: p.course?.title ?? 'Unknown',
                amount: p.amount_paid,
                createdAt: p.created_at,
            })),
        };
    }

    private getEnvFilePath() {
        return path.resolve(process.cwd(), '.env');
    }

    async updateEnvVariable(key: string, value: string) {
        const ALLOWED_KEYS = [
            'CLOUDFLARE_R2_ENDPOINT', 'CLOUDFLARE_R2_ACCESS_KEY_ID',
            'CLOUDFLARE_R2_SECRET_ACCESS_KEY', 'CLOUDFLARE_R2_BUCKET_NAME',
            'RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'RAZORPAY_WEBHOOK_SECRET',
            'FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY',
            'JWT_SECRET', 'SUPPORT_PHONE',
            'TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID',
        ];
        if (!ALLOWED_KEYS.includes(key)) {
            throw new Error(`Key "${key}" is not allowed`);
        }
        const envPath = this.getEnvFilePath();
        let content = fs.readFileSync(envPath, 'utf-8');
        const safeValue = value.includes('\n') ? `"${value}"` : value;
        const regex = new RegExp(`^${key}=.*$`, 'm');
        if (regex.test(content)) {
            content = content.replace(regex, `${key}=${safeValue}`);
        } else {
            content += `\n${key}=${safeValue}`;
        }
        fs.writeFileSync(envPath, content, 'utf-8');
        process.env[key] = value;
        return { success: true, key };
    }

    async getEnvConfig() {
        const DISPLAY_KEYS: Record<string, string> = {
            'CLOUDFLARE_R2_ENDPOINT': 'Cloudflare R2 Endpoint',
            'CLOUDFLARE_R2_ACCESS_KEY_ID': 'R2 Access Key ID',
            'CLOUDFLARE_R2_SECRET_ACCESS_KEY': 'R2 Secret Access Key',
            'CLOUDFLARE_R2_BUCKET_NAME': 'R2 Bucket Name',
            'RAZORPAY_KEY_ID': 'Razorpay Key ID',
            'RAZORPAY_KEY_SECRET': 'Razorpay Key Secret',
            'RAZORPAY_WEBHOOK_SECRET': 'Razorpay Webhook Secret',
            'FIREBASE_PROJECT_ID': 'Firebase Project ID',
            'FIREBASE_CLIENT_EMAIL': 'Firebase Client Email',
            'JWT_SECRET': 'JWT Secret',
            'SUPPORT_PHONE': 'Support Phone Number',
            'TELEGRAM_BOT_TOKEN': 'Telegram Bot Token',
            'TELEGRAM_CHAT_ID': 'Telegram Chat ID',
        };
        return Object.entries(DISPLAY_KEYS).map(([key, label]) => ({
            key,
            label,
            hasValue: !!process.env[key],
            // only expose non-secret partial preview
            preview: process.env[key]
                ? (key.includes('SECRET') || key.includes('PRIVATE') || key === 'JWT_SECRET' || key === 'TELEGRAM_BOT_TOKEN')
                    ? '••••••••'
                    : process.env[key]!.slice(0, 20) + (process.env[key]!.length > 20 ? '…' : '')
                : '',
        }));
    }

    async updateCredentials(adminId: string, email?: string, password?: string) {
        const data: any = {};
        if (email) data.email = email;
        if (password) data.password_hash = await bcrypt.hash(password, 10);

        if (Object.keys(data).length > 0) {
            await this.prisma.admin.update({
                where: { id: adminId },
                data,
            });
        }
        return { success: true };
    }

    getContactNumber() {
        return { phone: process.env.SUPPORT_PHONE || '' };
    }

    /**
     * Sends a plain-text alert to the configured Telegram bot.
     * Silently no-ops if TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID are not set.
     */
    async sendTelegramAlert(message: string): Promise<void> {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;
        if (!token || !chatId) return;

        const body = JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' });
        const options = {
            hostname: 'api.telegram.org',
            path: `/bot${token}/sendMessage`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body),
            },
        };

        return new Promise((resolve) => {
            const req = https.request(options, (res) => {
                res.on('data', () => { });
                res.on('end', () => resolve());
            });
            req.on('error', (err) => {
                console.error('Telegram alert failed:', err.message);
                resolve(); // never throw — alerts are non-critical
            });
            req.write(body);
            req.end();
        });
    }
}
