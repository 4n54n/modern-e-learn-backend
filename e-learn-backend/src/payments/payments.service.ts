import { Injectable, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdminService } from '../admin/admin.service';
import * as crypto from 'crypto';
const Razorpay = require('razorpay');

@Injectable()
export class PaymentsService {
    private readonly logger = new Logger(PaymentsService.name);
    private razorpay: any;

    constructor(
        private prisma: PrismaService,
        private adminService: AdminService,
    ) {
        this.razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID || '',
            key_secret: process.env.RAZORPAY_KEY_SECRET || '',
        });
    }

    // ── 1. Create Razorpay Order ─────────────────────────────────────────────
    async createOrder(courseId: string, userId: string) {
        const course = await this.prisma.course.findUnique({ where: { id: courseId } });
        if (!course) throw new BadRequestException('Course not found');

        // Check if user already has an active (non-expired) purchase
        const existing = await this.prisma.purchase.findFirst({
            where: {
                user_id: userId,
                course_id: courseId,
                status: 'SUCCESS',
                OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
            } as any,
        });
        if (existing) throw new ConflictException('User already has access to this course');

        // Embed userId + courseId in notes so webhook can reconstruct the purchase
        const order = await this.razorpay.orders.create({
            amount: Math.round(course.price * 100), // paise
            currency: 'INR',
            receipt: `rcpt_${courseId.slice(0, 8)}_${Date.now()}`,
            payment_capture: 1,
            notes: { userId, courseId },
        });

        this.logger.log(`Order created: ${order.id} for user ${userId} course ${courseId}`);
        return { orderId: order.id, amount: order.amount, currency: order.currency, key: process.env.RAZORPAY_KEY_ID };
    }

    // ── 2. Client-side verify (fallback / immediate confirmation) ────────────
    async verifyPayment(
        razorpayOrderId: string,
        razorpayPaymentId: string,
        razorpaySignature: string,
        userId: string,
        courseId: string,
    ) {
        // HMAC verification
        const secret = process.env.RAZORPAY_KEY_SECRET || '';
        const expected = crypto
            .createHmac('sha256', secret)
            .update(`${razorpayOrderId}|${razorpayPaymentId}`)
            .digest('hex');

        if (expected !== razorpaySignature) {
            throw new BadRequestException('Payment signature verification failed');
        }

        return this.recordPurchase(userId, courseId, razorpayPaymentId);
    }

    // ── 3. Razorpay Webhook (authoritative path) ─────────────────────────────
    async handleWebhook(rawBody: Buffer, signature: string) {
        // Verify webhook signature with the WEBHOOK secret (different from API secret)
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
        const expected = crypto
            .createHmac('sha256', webhookSecret)
            .update(rawBody)
            .digest('hex');

        if (expected !== signature) {
            this.logger.warn('Webhook signature mismatch — rejected');
            throw new BadRequestException('Invalid webhook signature');
        }

        const payload = JSON.parse(rawBody.toString());
        const event: string = payload.event;
        this.logger.log(`Webhook event received: ${event}`);

        // Only act on successful captures
        if (event !== 'payment.captured') {
            return { received: true };
        }

        const payment = payload?.payload?.payment?.entity;
        if (!payment) throw new BadRequestException('Missing payment entity');

        const { userId, courseId } = payment.notes ?? {};
        if (!userId || !courseId) {
            this.logger.warn(`Webhook notes missing userId/courseId for payment ${payment.id}`);
            return { received: true }; // ack so Razorpay stops retrying
        }

        await this.recordPurchase(userId, courseId, payment.id, payment.amount / 100);
        return { received: true };
    }

    // ── Shared: idempotent purchase recorder ─────────────────────────────────
    private async recordPurchase(userId: string, courseId: string, paymentId: string, amount?: number) {
        // Idempotent — skip if this paymentId already recorded
        const dup = await this.prisma.purchase.findUnique({ where: { payment_id: paymentId } });
        if (dup) {
            this.logger.log(`Duplicate purchase ignored: ${paymentId}`);
            return { success: true, purchase: dup, duplicate: true };
        }

        // Fetch course for price + validity
        const course: any = await this.prisma.course.findUnique({ where: { id: courseId } });
        if (!course) throw new BadRequestException('Course not found');

        // Fetch user info for the Telegram alert
        const user = await this.prisma.user.findUnique({ where: { id: userId } });

        // Compute expiry at purchase time (snapshot — future edits to validity_days won't change this)
        let expiresAt: Date | null = null;
        if (course.validity_days) {
            expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + course.validity_days);
        }

        const purchase = await this.prisma.purchase.create({
            data: {
                user_id: userId,
                course_id: courseId,
                payment_id: paymentId,
                amount_paid: amount ?? course.price,
                status: 'SUCCESS',
                ...(expiresAt ? { expires_at: expiresAt } : {}),
            } as any,
        });

        this.logger.log(`Purchase recorded: ${purchase.id} (expires: ${expiresAt?.toISOString() ?? 'never'})`);

        // 🔔 Telegram alert (non-blocking)
        const alertMsg =
            `🛒 <b>New Purchase!</b>\n` +
            `👤 User: ${user?.name ?? 'Unknown'} (${user?.email ?? userId})\n` +
            `📚 Course: ${course.title}\n` +
            `💰 Amount: ₹${(amount ?? course.price).toFixed(2)}\n` +
            `🆔 Payment ID: ${paymentId}`;
        this.adminService.sendTelegramAlert(alertMsg).catch(() => { });

        return { success: true, purchase };
    }
}
