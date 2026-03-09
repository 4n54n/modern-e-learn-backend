import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as admin from 'firebase-admin';
import * as cron from 'node-cron';

@Injectable()
export class NotificationsService implements OnModuleInit {
    constructor(private prisma: PrismaService) { }

    onModuleInit() {
        this.initializeFirebase();
        this.scheduleCronJob();
    }

    private initializeFirebase() {
        try {
            // Only initialize if no app already exists (prevents re-init on hot reload)
            if (admin.apps.length > 0) return;
            const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: privateKey,
                }),
            });
            console.log('Firebase Admin initialized successfully');
        } catch (e) {
            console.error('Firebase init failed:', e);
        }
    }

    private scheduleCronJob() {
        // Run every minute
        cron.schedule('* * * * *', async () => {
            await this.processScheduledNotifications();
        });
    }

    async createNotification(
        title: string,
        message: string,
        scheduledAt: Date,
        targetAudience: string,
        courseId?: string,
        userEmail?: string,
        repeatType?: string,
        repeatCount?: number,
    ) {
        return this.prisma.notification.create({
            data: {
                title,
                message,
                scheduled_at: scheduledAt,
                target_audience: targetAudience,
                course_id: courseId || null,
                target_email: userEmail || null,
                status: 'PENDING',
                repeat_type: repeatType || null,
                repeat_count: repeatCount && repeatCount > 1 ? repeatCount : 1,
                repeat_sent: 0,
            } as any,
        });
    }

    async findAll() {
        return this.prisma.notification.findMany({
            orderBy: { scheduled_at: 'desc' },
            include: { course: { select: { title: true } } },
        });
    }

    async deleteNotification(id: string) {
        return this.prisma.notification.delete({ where: { id } });
    }

    async processScheduledNotifications() {
        const now = new Date();
        const pendingNotifications = await this.prisma.notification.findMany({
            where: {
                status: 'PENDING',
                scheduled_at: { lte: now },
            },
        });

        for (const notif of pendingNotifications) {
            try {
                let fcmTokens: string[] = [];

                const audience = notif.target_audience || 'ALL';

                if (audience === 'COURSE' && notif.course_id) {
                    // Tokens for users who purchased this specific course
                    const purchases = await this.prisma.purchase.findMany({
                        where: { course_id: notif.course_id, status: 'SUCCESS' },
                        include: { user: { include: { devices: true } } },
                    });
                    purchases.forEach((p) => {
                        p.user.devices.forEach((d) => {
                            if (d.fcm_token) fcmTokens.push(d.fcm_token);
                        });
                    });

                } else if (audience === 'EMAIL' && notif.target_email) {
                    // Single user identified by email address
                    const user = await this.prisma.user.findFirst({
                        where: { email: notif.target_email },
                        include: { devices: true },
                    });
                    if (user) {
                        user.devices.forEach((d) => {
                            if (d.fcm_token) fcmTokens.push(d.fcm_token);
                        });
                        if (fcmTokens.length === 0) {
                            console.warn(`Notification ${notif.id}: user ${notif.target_email} found but has no registered devices`);
                        }
                    } else {
                        console.warn(`Notification ${notif.id}: no user found with email ${notif.target_email}`);
                    }

                } else if (audience === 'NOT_PURCHASED') {
                    // Logged-in users who have NEVER made any successful purchase
                    const purchasedUserIds = await this.prisma.purchase.findMany({
                        where: { status: 'SUCCESS' },
                        select: { user_id: true },
                    });
                    const purchasedIds = [...new Set(purchasedUserIds.map(p => p.user_id))];

                    const usersWithNoPurchase = await this.prisma.user.findMany({
                        where: {
                            id: { notIn: purchasedIds.length > 0 ? purchasedIds : ['__none__'] },
                        },
                        include: { devices: true },
                    });
                    usersWithNoPurchase.forEach((u) => {
                        u.devices.forEach((d) => {
                            if (d.fcm_token) fcmTokens.push(d.fcm_token);
                        });
                    });

                } else if (audience === 'INSTALLED_NO_PURCHASE') {
                    // Everyone who has NOT purchased: logged-in with no purchase + anonymous (not logged in)

                    // Step 1: get all user_ids that have at least one SUCCESS purchase
                    const purchasedUserIds = await this.prisma.purchase.findMany({
                        where: { status: 'SUCCESS' },
                        select: { user_id: true },
                    });
                    const purchasedIds = [...new Set(purchasedUserIds.map(p => p.user_id))];

                    // Step 2: get ALL FCM tokens + device_ids from the Device (logged-in) table
                    // We compare by both to catch stale AnonymousDevice entries re-created on token refresh
                    const allRegisteredDevices = await this.prisma.device.findMany({
                        select: { device_id: true, fcm_token: true },
                    });
                    const registeredFcmTokenSet = new Set(allRegisteredDevices.map(d => d.fcm_token).filter(Boolean));
                    const registeredDeviceIdSet = new Set(allRegisteredDevices.map(d => d.device_id));

                    // Step 3: users who have never purchased
                    const usersWithNoPurchase = await this.prisma.user.findMany({
                        where: {
                            id: { notIn: purchasedIds.length > 0 ? purchasedIds : ['__none__'] },
                        },
                        include: { devices: true },
                    });

                    // Step 4: anonymous devices — exclude any whose device_id OR fcm_token is already in the Device table
                    const anonDevices = await this.prisma.anonymousDevice.findMany({
                        where: { fcm_token: { not: '' } },
                    });

                    usersWithNoPurchase.forEach((u) => {
                        u.devices.forEach((d) => {
                            if (d.fcm_token) fcmTokens.push(d.fcm_token);
                        });
                    });
                    anonDevices.forEach((d) => {
                        if (registeredDeviceIdSet.has(d.device_id)) return;
                        if (registeredFcmTokenSet.has(d.fcm_token)) return;
                        if (d.fcm_token) fcmTokens.push(d.fcm_token);
                    });

                    console.log(
                        `[INSTALLED_NO_PURCHASE] purchased=${purchasedIds.length}`,
                        `non_purchased_users=${usersWithNoPurchase.length}`,
                        `anon_total=${anonDevices.length}`,
                        `anon_included=${anonDevices.filter(d => !registeredDeviceIdSet.has(d.device_id) && !registeredFcmTokenSet.has(d.fcm_token)).length}`,
                        `total_tokens=${fcmTokens.length}`,
                    );

                } else if (audience === 'ANONYMOUS') {
                    // Installed but never logged in — only AnonymousDevice table
                    // Exclude any device whose token or device_id is already registered to a logged-in user
                    const allRegisteredDevices = await this.prisma.device.findMany({
                        select: { device_id: true, fcm_token: true },
                    });
                    const registeredFcmTokenSet = new Set(allRegisteredDevices.map(d => d.fcm_token).filter(Boolean));
                    const registeredDeviceIdSet = new Set(allRegisteredDevices.map(d => d.device_id));

                    const anonDevices = await this.prisma.anonymousDevice.findMany({
                        where: { fcm_token: { not: '' } },
                    });
                    fcmTokens = anonDevices
                        .filter(d => !registeredDeviceIdSet.has(d.device_id) && !registeredFcmTokenSet.has(d.fcm_token))
                        .map(d => d.fcm_token);

                } else {
                    // ALL — logged-in users AND anonymous (not-logged-in) users
                    const [devices, anonDevices] = await Promise.all([
                        this.prisma.device.findMany({
                            where: { fcm_token: { not: '' } },
                        }),
                        this.prisma.anonymousDevice.findMany({
                            where: { fcm_token: { not: '' } },
                        }),
                    ]);
                    fcmTokens = [
                        ...devices.map((d) => d.fcm_token),
                        ...anonDevices.map((d) => d.fcm_token),
                    ];
                }

                // De-duplicate tokens
                fcmTokens = [...new Set(fcmTokens)].filter(Boolean);

                if (fcmTokens.length > 0) {
                    await this.sendFCMNotification(notif.title, notif.message, fcmTokens);
                } else {
                    console.log(`Notification ${notif.id}: no FCM tokens found for audience "${audience}"`);
                }

                // --- Repeat logic ---
                const currentSent = ((notif as any).repeat_sent ?? 0) + 1;
                const totalCount = (notif as any).repeat_count ?? 1;
                const repeatType: string | null = (notif as any).repeat_type ?? null;

                if (repeatType && currentSent < totalCount) {
                    // Compute next scheduled time
                    const nextDate = new Date((notif as any).scheduled_at);
                    if (repeatType === 'DAILY') {
                        nextDate.setDate(nextDate.getDate() + 1);
                    } else if (repeatType === 'WEEKLY') {
                        nextDate.setDate(nextDate.getDate() + 7);
                    }

                    await this.prisma.notification.update({
                        where: { id: notif.id },
                        data: {
                            status: 'PENDING',
                            scheduled_at: nextDate,
                            repeat_sent: currentSent,
                        } as any,
                    });
                } else {
                    // No more repeats — mark as sent
                    await this.prisma.notification.update({
                        where: { id: notif.id },
                        data: { status: 'SENT', repeat_sent: currentSent } as any,
                    });
                }
            } catch (error) {
                console.error(`Failed to send notification ${notif.id}:`, error);
                await this.prisma.notification.update({
                    where: { id: notif.id },
                    data: { status: 'FAILED' },
                });
            }
        }
    }

    /**
     * Sends an FCM notification to a list of tokens using the v1 HTTP API
     * via Firebase Admin SDK. Batches into groups of 500 (FCM limit).
     */
    private async sendFCMNotification(title: string, body: string, tokens: string[]): Promise<void> {
        const BATCH_SIZE = 500;
        for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
            const batch = tokens.slice(i, i + BATCH_SIZE);
            const response = await admin.messaging().sendEachForMulticast({
                tokens: batch,
                // notification shows in system tray
                notification: { title, body },
                // data payload wakes up Flutter background handler
                data: { title, body, click_action: 'FLUTTER_NOTIFICATION_CLICK' },
                android: {
                    priority: 'high',
                    notification: {
                        sound: 'default',
                        // 'fcm_default_channel' is the channel Flutter firebase_messaging creates by default
                        channelId: 'fcm_default_channel',
                        notificationCount: 0,
                    },
                },
                apns: {
                    headers: { 'apns-priority': '10' },
                    payload: {
                        aps: {
                            alert: { title, body },
                            sound: 'default',
                        },
                    },
                },
            });

            // Log per-token errors for diagnostics
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    const code = resp.error?.code;
                    console.warn(`FCM token[${i + idx}] (${batch[idx].substring(0, 20)}…) failed: ${code}`, resp.error?.message);
                }
            });

            console.log(`FCM batch ${Math.floor(i / BATCH_SIZE) + 1}: ${response.successCount}/${batch.length} delivered`);
        }
    }
}
