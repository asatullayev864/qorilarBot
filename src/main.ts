import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  const port = process.env.PORT || 1111;
  await app.listen(port);

  console.log(`🚀 Server ${port}-portda ishga tushdi`);
  console.log(`🤖 Telegram bot faol`);
}
bootstrap();