import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('admin')
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @UseGuards(JwtAuthGuard, AdminGuard)
    @Get('stats')
    async getStats() {
        return this.adminService.getDashboardStats();
    }

    @UseGuards(JwtAuthGuard, AdminGuard)
    @Get('env-config')
    async getEnvConfig() {
        return this.adminService.getEnvConfig();
    }

    @UseGuards(JwtAuthGuard, AdminGuard)
    @Post('update-env')
    async updateEnv(@Body('key') key: string, @Body('value') value: string) {
        return this.adminService.updateEnvVariable(key, value);
    }

    @UseGuards(JwtAuthGuard, AdminGuard)
    @Post('update-credentials')
    async updateCredentials(@Req() req: any, @Body() body: any) {
        return this.adminService.updateCredentials(req.user.sub, body.email, body.password);
    }

    /** Public — no auth required. Used by mobile app and web to get support number. */
    @Get('contact')
    getContact() {
        return this.adminService.getContactNumber();
    }
}
