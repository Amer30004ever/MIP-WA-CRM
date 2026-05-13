import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Global API prefix
  app.setGlobalPrefix('api/v1');

  // Auto-validate incoming DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS (adjust origins for production)
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? '*',
    credentials: true,
  });

  // ── Swagger / OpenAPI ──────────────────────────────────────────────────────
  const swaggerConfig = new DocumentBuilder()
    .setTitle('MaVoid CRM API')
    .setDescription(
      'WhatsApp CRM backend — Authentication, Webhooks, Conversations, Leads, Contacts, Deals, Tasks, Templates.',
    )
    .setVersion('1.0.0')
    .addTag('Health', 'Service health check')
    .addTag('Auth', 'User authentication & profile')
    .addTag('Webhook', 'WhatsApp Cloud API webhook endpoints')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT',
    )
    .setContact('MaVoid Team', '', 'support@mavoid.com')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'MaVoid CRM — API Docs',
  });
  // ──────────────────────────────────────────────────────────────────────────

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`🚀 MaVoid CRM API running on http://localhost:${port}/api/v1`);
  logger.log(`📖 Swagger docs available at http://localhost:${port}/api/docs`);
}
bootstrap();

