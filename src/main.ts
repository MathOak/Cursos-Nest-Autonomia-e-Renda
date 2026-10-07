import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true
    })
  );
  app.use('/api/uploads', express.static(join(process.cwd(), 'uploads')));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('API do Ecommerce')
    .setDescription(
      'API para gerenciamento de produtos e cadastro de usuários do ecommerce.'
    )
    .setVersion('1.0.0')
    .addTag('produtos', 'Consulta e gerenciamento do catálogo de produtos')
    .addTag('usuarios', 'Cadastro de usuários')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
