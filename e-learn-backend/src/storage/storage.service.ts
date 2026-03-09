import { Injectable, BadRequestException } from '@nestjs/common';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StorageService {
    private s3: S3Client;
    private bucketName: string;

    constructor(private prisma: PrismaService) {
        this.bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'elearn-assets';
        this.s3 = new S3Client({
            region: 'auto',
            endpoint: process.env.CLOUDFLARE_R2_ENDPOINT || '',
            credentials: {
                accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '',
            },
        });
    }

    async generateUploadUrl(fileName: string, contentType: string) {
        const fileKey = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: fileKey,
            ContentType: contentType,
        });
        const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn: 900 });
        return { uploadUrl, fileKey };
    }

    async generateFileUrl(fileKey: string) {
        if (!fileKey || fileKey.trim() === '') {
            throw new BadRequestException('fileKey is required');
        }

        // If a legacy full URL was stored, extract just the R2 object key.
        // Handles both virtual-hosted style (bucket.account.r2.cloudflarestorage.com/key)
        // and path-style (account.r2.cloudflarestorage.com/bucket-name/key).
        let resolvedKey = fileKey.trim();
        if (resolvedKey.startsWith('http://') || resolvedKey.startsWith('https://')) {
            try {
                const parsed = new URL(resolvedKey);
                // Decode percent-encoded chars and strip the leading slash
                let pathname = decodeURIComponent(parsed.pathname.replace(/^\//, ''));
                // Path-style URL includes the bucket name as the first segment — strip it
                if (pathname.startsWith(this.bucketName + '/')) {
                    pathname = pathname.slice(this.bucketName.length + 1);
                }
                resolvedKey = pathname;
            } catch {
                throw new BadRequestException('Invalid fileKey URL');
            }
        }

        if (!resolvedKey) {
            throw new BadRequestException('Could not resolve a valid object key from fileKey');
        }

        console.log(`[storage] generateFileUrl: raw="${fileKey.substring(0, 80)}" resolved="${resolvedKey}"`);

        const command = new GetObjectCommand({
            Bucket: this.bucketName,
            Key: resolvedKey,
            // NOTE: ResponseContentType is intentionally omitted — certain R2 configurations
            // reject presigned URLs when this parameter is part of the signature.
            // ExoPlayer and PDF viewers auto-detect content from file bytes.
        });
        // 4-hour expiry for public assets (thumbnails, intro videos)
        const url = await getSignedUrl(this.s3, command, { expiresIn: 14400 });
        return { url };
    }

    async uploadFile(file: Express.Multer.File) {
        const ext = file.originalname.split('.').pop() ?? 'bin';
        const fileKey = `uploads/${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: fileKey,
            Body: file.buffer,
            ContentType: file.mimetype,
        });
        await this.s3.send(command);
        return { fileKey };
    }

    async generateSignedVideoUrl(courseId: string, videoKey: string, userId: string) {
        if (!videoKey || videoKey.trim() === '') {
            throw new BadRequestException('videoKey is required');
        }

        // Check if the file belongs to a lesson in a free section
        const lesson = await this.prisma.lesson.findFirst({
            where: {
                OR: [
                    { video_url: videoKey },
                    { document_url: videoKey }
                ]
            },
            include: { section: true }
        });

        const isFree = (lesson as any)?.section?.is_free === true;

        if (!isFree) {
            const purchase = await this.prisma.purchase.findFirst({
                where: { user_id: userId, course_id: courseId, status: 'SUCCESS' }
            });
            if (!purchase) throw new BadRequestException('Course not purchased');
        }

        console.log(`[storage] generateSignedVideoUrl: courseId="${courseId}" key="${videoKey}"`);

        const command = new GetObjectCommand({
            Bucket: this.bucketName,
            Key: videoKey,
            // NOTE: ResponseContentType omitted intentionally — R2 may reject the
            // presigned URL if this parameter is part of the signature. ExoPlayer
            // auto-detects the video format from the file bytes.
        });
        // 15-minute expiry — long enough to start playing without timeout
        const signedUrl = await getSignedUrl(this.s3, command, { expiresIn: 900 });
        return { url: signedUrl };
    }

    /**
     * Generates a signed URL for a course's intro video.
     * No purchase required — intro is always publicly viewable.
     * Fetches intro_video_url from DB and signs with identical params as
     * generateSignedVideoUrl (proven to work on device).
     */
    async generateIntroVideoUrl(courseId: string) {
        const course = await this.prisma.course.findUnique({
            where: { id: courseId },
            select: { intro_video_url: true },
        });
        if (!course) throw new BadRequestException('Course not found');
        if (!course.intro_video_url) throw new BadRequestException('No intro video for this course');

        // Resolve key — handles plain file keys AND legacy full https:// URLs
        let videoKey = course.intro_video_url.trim();
        if (videoKey.startsWith('http://') || videoKey.startsWith('https://')) {
            try {
                const parsed = new URL(videoKey);
                let pathname = decodeURIComponent(parsed.pathname.replace(/^\//, ''));
                if (pathname.startsWith(this.bucketName + '/')) {
                    pathname = pathname.slice(this.bucketName.length + 1);
                }
                videoKey = pathname;
            } catch {
                throw new BadRequestException('Invalid intro_video_url in DB');
            }
        }

        if (!videoKey) throw new BadRequestException('Could not resolve intro video key');

        console.log(`[storage] generateIntroVideoUrl: courseId="${courseId}" key="${videoKey}"`);

        const command = new GetObjectCommand({
            Bucket: this.bucketName,
            Key: videoKey,
        });
        const signedUrl = await getSignedUrl(this.s3, command, { expiresIn: 900 });
        return { url: signedUrl };
    }

    async listAssets() {
        // 1. Collect all used fileKeys from DB
        const [courses, lessons] = await Promise.all([
            this.prisma.course.findMany({ select: { thumbnail_url: true, intro_video_url: true } }),
            this.prisma.lesson.findMany({ select: { video_url: true, document_url: true } }),
        ]);
        const usedKeys = new Set<string>();
        courses.forEach(c => {
            if (c.thumbnail_url) usedKeys.add(c.thumbnail_url);
            if (c.intro_video_url) usedKeys.add(c.intro_video_url);
        });

        lessons.forEach(l => {
            if (l.video_url) usedKeys.add(l.video_url);
            if (l.document_url) usedKeys.add(l.document_url);
        });

        // 2. List all R2 objects (paginated)
        const objects: Array<{ key: string; size: number; lastModified: Date; inUse: boolean; previewUrl: string | null }> = [];
        let continuationToken: string | undefined;
        do {
            const res = await this.s3.send(new ListObjectsV2Command({
                Bucket: this.bucketName,
                ContinuationToken: continuationToken,
            }));
            for (const obj of res.Contents ?? []) {
                if (!obj.Key) continue;
                const inUse = usedKeys.has(obj.Key);
                // Generate signed preview URL for images (skip for large video – just include key)
                let previewUrl: string | null = null;
                const ext = obj.Key.split('.').pop()?.toLowerCase() ?? '';
                if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
                    const getCmd = new GetObjectCommand({ Bucket: this.bucketName, Key: obj.Key });
                    previewUrl = await getSignedUrl(this.s3, getCmd, { expiresIn: 3600 });
                }
                objects.push({
                    key: obj.Key,
                    size: obj.Size ?? 0,
                    lastModified: obj.LastModified ?? new Date(),
                    inUse,
                    previewUrl,
                });
            }
            continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
        } while (continuationToken);

        const orphanCount = objects.filter(o => !o.inUse).length;
        return { objects, total: objects.length, orphanCount };
    }

    async deleteOrphanedAssets() {
        const { objects } = await this.listAssets();
        const orphans = objects.filter(o => !o.inUse);
        if (orphans.length === 0) return { deleted: 0 };
        // Delete in batches of 1000 (S3 limit)
        let deleted = 0;
        for (let i = 0; i < orphans.length; i += 1000) {
            const batch = orphans.slice(i, i + 1000);
            await this.s3.send(new DeleteObjectsCommand({
                Bucket: this.bucketName,
                Delete: { Objects: batch.map(o => ({ Key: o.key })) },
            }));
            deleted += batch.length;
        }
        return { deleted };
    }
}
