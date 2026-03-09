import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
    // rawBody:true is required for Razorpay webhook signature verification
    const app = await NestFactory.create(AppModule, { rawBody: true });
    const allowedOrigins = [
        'http://localhost:3001',
        'http://localhost:3000',
        'https://samra.intoai.in',
        'https://www.samra.intoai.in'
    ];
    if (process.env.FRONTEND_URL) {
        allowedOrigins.push(process.env.FRONTEND_URL);
    }

    app.enableCors({
        origin: allowedOrigins,
        credentials: true,
    });
    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
