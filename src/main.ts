import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);

    // Get configuration values
    const port = configService.get<number>('PORT') || 3000;
    const nodeEnv = configService.get<string>('NODE_ENV') || 'development';
    const apiPrefix = configService.get<string>('API_PREFIX') || 'api';

    // Global API prefix
    app.setGlobalPrefix(apiPrefix);

    // Global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true, // Automatically transform payloads to DTO instances
        whitelist: true, // Strip properties that don't have decorators
        forbidNonWhitelisted: true, // Throw error for non-whitelisted properties
        disableErrorMessages: nodeEnv === 'production', // Hide detailed validation errors in production
        transformOptions: {
          enableImplicitConversion: true, // Allow implicit type conversion
        },
      }),
    );

    // CORS configuration
    app.enableCors({
      origin: [
        configService.get<string>('CORS_ORIGIN'), // optional env variable
        'http://localhost:8080', // add your frontend URL
      ].filter(Boolean), // remove undefined if env variable is not set
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      credentials: true,
    });

    // Security headers (consider using helmet middleware)
    app.use((req: Request, res: Response, next: () => void) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      next();
    });

    // Swagger/OpenAPI configuration (only in non-production environments)
    if (nodeEnv !== 'production') {
      const config = new DocumentBuilder()
        .setTitle('GitHub Analytics API')
        .setDescription(
          'API for fetching and analyzing GitHub user data and repository statistics. ' +
            'This API provides comprehensive GitHub user analytics including repository statistics, ' +
            'language usage, and activity insights.',
        )
        .setVersion('1.0.0')
        .setContact(
          'API Support',
          'https://github.com/yourusername/your-repo',
          'support@yourapp.com',
        )
        .setLicense('MIT', 'https://opensource.org/licenses/MIT')
        .addTag('GitHub', 'GitHub API operations')
        .addServer(`http://localhost:${port}`, 'Development server')
        .addServer('https://yourapi.com', 'Production server')
        .build();

      const document = SwaggerModule.createDocument(app, config, {
        operationIdFactory: (controllerKey: string, methodKey: string) =>
          methodKey,
      });

      SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
        customSiteTitle: 'GitHub Analytics API Documentation',
        customfavIcon: '/favicon.ico',
        customJs: [
          'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.19.1/swagger-ui-bundle.min.js',
        ],
        customCssUrl: [
          'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.19.1/swagger-ui.min.css',
        ],
        swaggerOptions: {
          persistAuthorization: true,
          displayRequestDuration: true,
          docExpansion: 'none', // Don't expand operations by default
          filter: true, // Enable filtering
          showRequestHeaders: true,
          tryItOutEnabled: true,
        },
      });

      logger.log(
        `Swagger documentation available at: http://localhost:${port}/${apiPrefix}/docs`,
      );
    }

    // Graceful shutdown handling
    const gracefulShutdown = (signal: string) => {
      logger.log(`Received ${signal}, shutting down gracefully...`);
      app
        .close()
        .then(() => {
          logger.log('Application closed successfully');
          process.exit(0);
        })
        .catch((error) => {
          logger.error('Error during shutdown', error);
          process.exit(1);
        });
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Start the server
    await app.listen(port, '0.0.0.0');

    logger.log(`Application is running in ${nodeEnv} mode`);
    logger.log(`Server is listening on: http://localhost:${port}`);
    logger.log(
      `API endpoints available at: http://localhost:${port}/${apiPrefix}`,
    );

    if (nodeEnv !== 'production') {
      logger.log(
        `API documentation: http://localhost:${port}/${apiPrefix}/docs`,
      );
    }
  } catch (error) {
    logger.error('Failed to start application', error);
    process.exit(1);
  }
}

bootstrap();
