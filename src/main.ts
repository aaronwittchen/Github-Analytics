import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Swagger/OpenAPI configuration
  const config = new DocumentBuilder()
    .setTitle('GitHub Analytics API')
    .setDescription(
      'API for fetching and analyzing GitHub user data and repository statistics',
    )
    .setVersion('1.0')
    .addTag('users', 'GitHub user operations')
    .addTag('repositories', 'Repository analytics')
    .addServer('http://localhost:3000', 'Development server')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth', // This name here is important for matching up with @ApiBearerAuth() in your controller!
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'GitHub Analytics API Docs',
    customfavIcon: 'https://swagger.io/favicon.ico',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.js',
    ],
    customCssUrl: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
    ],
  });

  // Enable CORS for frontend integration
  app.enableCors();

  await app.listen(3000);
  console.log('API is running on: http://localhost:3000');
  console.log('Swagger docs available at: http://localhost:3000/api/docs');
}
bootstrap();
