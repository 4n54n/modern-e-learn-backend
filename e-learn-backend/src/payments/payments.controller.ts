import { Controller, Post, Body, UseGuards, Request, Headers, Req } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';

import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    // ── Auth-protected: create Razorpay order ────────────────────────────────
    @UseGuards(JwtAuthGuard)
    @Post('create-order')
    async createOrder(@Body('courseId') courseId: string, @Request() req: any) {
        const userId = req.user.sub;
        return this.paymentsService.createOrder(courseId, userId);
    }

    // ── Auth-protected: client-side verify (immediate confirmation path) ─────
    @UseGuards(JwtAuthGuard)
    @Post('verify')
    async verifyPayment(
        @Body('razorpayOrderId') razorpayOrderId: string,
        @Body('razorpayPaymentId') razorpayPaymentId: string,
        @Body('razorpaySignature') razorpaySignature: string,
        @Body('courseId') courseId: string,
        @Request() req: any,
    ) {
        const userId = req.user.sub;
        return this.paymentsService.verifyPayment(
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
            userId,
            courseId,
        );
    }

    // ── Public: Razorpay webhook (authoritative payment confirmation) ─────────
    // Razorpay calls this directly — no JWT. Security = HMAC signature check.
    @Post('webhook')
    async webhook(
        @Req() req: RawBodyRequest<Request>,
        @Headers('x-razorpay-signature') signature: string,
    ) {
        const rawBody = req.rawBody;
        if (!rawBody) throw new Error('Raw body not available');
        return this.paymentsService.handleWebhook(rawBody, signature);
    }
}
