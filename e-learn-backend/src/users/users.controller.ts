import { Controller, Post, Body, Get, Param, UseGuards, Patch, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post('google-login')
    async googleLogin(@Body('token') token: string, @Body('email') email: string, @Body('name') name: string) {
        return this.usersService.findOrCreateUser(email, name, token);
    }

    @Post(':userId/devices')
    async registerDevice(
        @Param('userId') userId: string,
        @Body('deviceId') deviceId: string,
        @Body('fcmToken') fcmToken: string,
    ) {
        return this.usersService.registerDevice(userId, deviceId, fcmToken);
    }

    /**
     * POST /users/anonymous-device
     * Registers an FCM token for a device that has not logged in yet.
     * Call this on app startup, before the user signs in with Google.
     */
    @Post('anonymous-device')
    async registerAnonymousDevice(
        @Body('deviceId') deviceId: string,
        @Body('fcmToken') fcmToken: string,
    ) {
        return this.usersService.registerAnonymousDevice(deviceId, fcmToken);
    }

    /** GET /users/me — returns the logged-in user profile including primary_device_id */
    @UseGuards(JwtAuthGuard)
    @Get('me')
    async getMyProfile(@Request() req: any) {
        return this.usersService.getUserProfile(req.user.sub);
    }

    /** GET /users/me/purchases — returns all active purchases for the logged-in user */
    @UseGuards(JwtAuthGuard)
    @Get('me/purchases')
    async getMyPurchases(@Request() req: any) {
        return this.usersService.getPurchasesForUser(req.user.sub);
    }

    @UseGuards(JwtAuthGuard, AdminGuard)
    @Patch(':userId/clear-device')
    async clearDevice(@Param('userId') userId: string) {
        return this.usersService.clearDevice(userId);
    }

    @UseGuards(JwtAuthGuard, AdminGuard)
    @Get()
    async getAllUsers() {
        return this.usersService.getAllUsers();
    }

    @UseGuards(JwtAuthGuard, AdminGuard)
    @Patch('purchases/:purchaseId')
    async updatePurchase(
        @Param('purchaseId') purchaseId: string,
        @Body() data: { status?: string; expires_at?: string | null; amount_paid?: number }
    ) {
        return this.usersService.updatePurchase(purchaseId, data);
    }
}
