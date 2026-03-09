import { Controller, Post, Body, Get, Param, Query, Request, UseGuards, UploadedFile, UseInterceptors, Delete } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express'; // requires @types/multer
import { StorageService } from './storage.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('storage')
export class StorageController {
    constructor(private readonly storageService: StorageService) { }

    /**
     * POST /storage/upload — multipart upload proxy (bypasses CORS for direct R2 PUTs)
     */
    @UseGuards(JwtAuthGuard, AdminGuard)
    @Post('upload')
    @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 500 * 1024 * 1024 } }))
    async uploadFile(@UploadedFile() file: Express.Multer.File) {
        return this.storageService.uploadFile(file);
    }

    @UseGuards(JwtAuthGuard, AdminGuard)
    @Post('upload-url')
    async getUploadUrl(@Body('fileName') fileName: string, @Body('contentType') contentType: string) {
        return this.storageService.generateUploadUrl(fileName, contentType);
    }

    // Public — thumbnails are short-lived signed R2 URLs, no auth needed
    @Get('file-url')
    async getFileUrl(@Query('key') key: string) {
        return this.storageService.generateFileUrl(key);
    }

    @UseGuards(JwtAuthGuard, AdminGuard)
    @Get('assets')
    async listAssets() {
        return this.storageService.listAssets();
    }

    @UseGuards(JwtAuthGuard, AdminGuard)
    @Delete('assets/cleanup')
    async deleteOrphans() {
        return this.storageService.deleteOrphanedAssets();
    }

    @UseGuards(JwtAuthGuard)
    @Get('video/:courseId')
    async getSignedVideoUrl(
        @Param('courseId') courseId: string,
        @Query('key') videoKey: string,
        @Request() req: any
    ) {
        return this.storageService.generateSignedVideoUrl(courseId, videoKey, req.user.sub);
    }

    /**
     * GET /storage/intro/:courseId
     * Public — no purchase or auth required.
     * Returns a signed URL for the course's intro video.
     * Uses the same signing path as /storage/video to ensure consistency.
     */
    @Get('intro/:courseId')
    async getIntroVideoUrl(@Param('courseId') courseId: string) {
        return this.storageService.generateIntroVideoUrl(courseId);
    }
}
