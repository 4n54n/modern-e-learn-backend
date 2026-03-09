import { Controller, Post, Body, UseGuards, Get, Delete, Param } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard, AdminGuard)
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get()
    async findAll() {
        return this.notificationsService.findAll();
    }

    @Post('schedule')
    async scheduleNotification(
        @Body('title') title: string,
        @Body('message') message: string,
        @Body('scheduledAt') scheduledAt: string,
        @Body('targetAudience') targetAudience?: string,
        @Body('courseId') courseId?: string,
        @Body('userEmail') userEmail?: string,
        @Body('repeatType') repeatType?: string,
        @Body('repeatCount') repeatCount?: number,
    ) {
        const date = new Date(scheduledAt);
        const audience = targetAudience || 'ALL';
        return this.notificationsService.createNotification(
            title, message, date, audience, courseId, userEmail, repeatType, repeatCount,
        );
    }

    @Delete(':id')
    async deleteNotification(@Param('id') id: string) {
        return this.notificationsService.deleteNotification(id);
    }
}
