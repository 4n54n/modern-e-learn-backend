import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CoursesModule } from './courses/courses.module';
import { UsersModule } from './users/users.module';
import { PaymentsModule } from './payments/payments.module';
import { StorageModule } from './storage/storage.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AdminModule } from './admin/admin.module';
import { LastActiveMiddleware } from './users/last-active.middleware';

@Module({
    imports: [PrismaModule, AuthModule, CoursesModule, UsersModule, PaymentsModule, StorageModule, NotificationsModule, AdminModule],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        // Apply to every route — the middleware only acts on user-role JWTs
        consumer.apply(LastActiveMiddleware).forRoutes('*');
    }
}
