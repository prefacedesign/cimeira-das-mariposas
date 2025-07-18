import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: '*' }); // for development, todo: create it properly
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
